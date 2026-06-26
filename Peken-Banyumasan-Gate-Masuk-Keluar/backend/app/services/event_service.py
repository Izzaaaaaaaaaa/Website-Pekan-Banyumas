from app.db.supabase import supabase, supabase_admin
from fastapi import HTTPException
from datetime import datetime, date, time

from app.services.notifikasi_service import create_notifikasi, create_notifikasi_bulk


def _parse_date(v):
    if not v:
        return None
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def _parse_time(v):
    if not v:
        return None
    s = str(v)
    for cand in (s, s[:8], s[:5]):
        try:
            return time.fromisoformat(cand)
        except ValueError:
            continue
    return None


def _validate_event_schedule(d: dict):
    """Reject impossible schedules (admin is the source of truth for dates).
    tanggal_selesai must not precede tanggal; on a single day, jam_selesai
    must be after jam_mulai."""
    tgl = _parse_date(d.get("tanggal"))
    tgl_selesai = _parse_date(d.get("tanggal_selesai"))
    jam_mulai = _parse_time(d.get("jam_mulai"))
    jam_selesai = _parse_time(d.get("jam_selesai"))
    if tgl and tgl_selesai and tgl_selesai < tgl:
        raise HTTPException(422, "Tanggal selesai tidak boleh sebelum tanggal mulai.")
    same_day = tgl_selesai is None or tgl_selesai == tgl
    if same_day and jam_mulai and jam_selesai and jam_selesai <= jam_mulai:
        raise HTTPException(422, "Jam selesai harus setelah jam mulai pada hari yang sama.")


def _event_nama(event_id: str) -> str:
    """Nama event untuk pesan notifikasi; aman saat gagal."""
    try:
        res = supabase_admin.table("events").select("nama").eq("id", event_id).single().execute()
        return (res.data or {}).get("nama") or "event"
    except Exception:
        return "event"


def _event_participant_ids(event_id: str):
    """Semua user peserta event: kolaborator (non-dibatalkan) + artisan (approved)."""
    ids = []
    try:
        kol = supabase_admin.table("event_kolaborators").select("kolaborator_id")             .eq("event_id", event_id).neq("status_kehadiran", "dibatalkan").execute()
        ids += [r.get("kolaborator_id") for r in (kol.data or [])]
    except Exception:
        pass
    try:
        art = supabase_admin.table("event_artisans").select("artisan_id")             .eq("event_id", event_id).eq("status_request", "approved").execute()
        ids += [r.get("artisan_id") for r in (art.data or [])]
    except Exception:
        pass
    return ids


# Field event yang relevan untuk peserta — perubahan di luar ini tidak dinotifikasi.
_EVENT_NOTIFY_FIELDS = {"nama", "tanggal", "tanggal_selesai", "jam_mulai",
                        "jam_selesai", "lokasi", "status"}


def list_events(status: str = None):
    """List all events."""
    try:
        query = supabase_admin.table("events").select("*")
        if status:
            query = query.eq("status", status)
        res = query.order("tanggal", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error listing events: {str(e)}")


def get_event(event_id: str):
    """Get event details."""
    try:
        res = supabase_admin.table("events").select("*").eq("id", event_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Event tidak ditemukan")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching event: {str(e)}")


def create_event(data: dict):
    """Create new event."""
    _validate_event_schedule(data)
    try:
        res = supabase_admin.table("events").insert(data).execute()
        if not res.data:
            raise HTTPException(500, "Gagal membuat event")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating event: {str(e)}")


def update_event(event_id: str, data: dict):
    """Update event. Peserta (kolaborator + artisan) dinotifikasi bila field
    yang relevan berubah — kontrak 'notifikasi event harus benar-benar jalan'."""
    try:
        # Validate the resulting schedule (merge existing event + incoming partial).
        existing_res = supabase_admin.table("events").select(
            "tanggal, tanggal_selesai, jam_mulai, jam_selesai"
        ).eq("id", event_id).limit(1).execute()
        existing = (existing_res.data or [{}])[0]
        _validate_event_schedule({**existing, **data})
        changed = _EVENT_NOTIFY_FIELDS.intersection(k for k, v in data.items() if v is not None)
        res = supabase_admin.table("events").update(data).eq("id", event_id).execute()
        if not res.data:
            raise HTTPException(404, "Event tidak ditemukan")
        row = res.data[0]
        if changed:
            nama = row.get("nama") or "event"
            if changed == {"status"}:
                msg = f"Status event '{nama}' kini {row.get('status')}."
            else:
                msg = f"Detail event '{nama}' diperbarui ({', '.join(sorted(changed))}). Cek jadwal terbaru."
            create_notifikasi_bulk(_event_participant_ids(event_id),
                                   "event_update", "Event diperbarui", msg, link="/event")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating event: {str(e)}")


def delete_event(event_id: str):
    """Delete event. Peserta dinotifikasi (data peserta diambil SEBELUM delete
    karena baris junction ikut terhapus via ON DELETE CASCADE)."""
    try:
        nama = _event_nama(event_id)
        participants = _event_participant_ids(event_id)
        res = supabase_admin.table("events").delete().eq("id", event_id).execute()
        if res.data:
            create_notifikasi_bulk(participants, "event_update", "Event dibatalkan",
                                   f"Event '{nama}' dibatalkan/dihapus oleh penyelenggara.")
        return {"message": "Event berhasil dihapus"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting event: {str(e)}")


# Event ↔ Kolaborator relations

def get_event_kolaborators(event_id: str):
    """Get kolaborators assigned to event with enriched names."""
    try:
        res = supabase_admin.table("event_kolaborators") \
            .select("*, kolaborators(nama, subsektor)") \
            .eq("event_id", event_id) \
            .execute()
            
        kolabs = []
        for row in (res.data or []):
            k_info = row.pop("kolaborators", None) or {}
            row["nama"] = k_info.get("nama", "—")
            row["subsektor"] = k_info.get("subsektor", [])
            kolabs.append(row)
            
        return kolabs
    except Exception as e:
        raise HTTPException(500, f"Error fetching event kolaborators: {str(e)}")


def assign_kolaborator(event_id: str, data: dict):
    """Assign kolaborator to event."""
    try:
        insert_data = {
            "event_id": event_id,
            "kolaborator_id": data.get("kolaborator_id"),
            "peran": data.get("peran", "peserta"),
            "status_kehadiran": data.get("status_kehadiran", "terdaftar"),
            "assigned_by": "admin"
        }
        res = supabase_admin.table("event_kolaborators").insert(insert_data).execute()
        if not res.data:
            raise HTTPException(500, "Gagal assign kolaborator")
        create_notifikasi(insert_data["kolaborator_id"], "event_invite",
                          "Ditambahkan ke event",
                          f"Anda ditambahkan sebagai {insert_data['peran']} di event '{_event_nama(event_id)}'.",
                          link="/event")
        return res.data[0]
    except Exception as e:
        raise HTTPException(500, f"Error assigning kolaborator: {str(e)}")


def update_event_kolaborator(event_id: str, kolab_id: str, data: dict):
    """Update kolaborator assignment."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        res = supabase_admin.table("event_kolaborators").update(update_data).eq("id", kolab_id).eq("event_id", event_id).execute()
        if not res.data:
            raise HTTPException(404, "Kolaborator assignment tidak ditemukan")
        row = res.data[0]
        if "peran" in update_data:
            create_notifikasi(row.get("kolaborator_id"), "event_update",
                              "Peran event diubah",
                              f"Peran Anda di event '{_event_nama(event_id)}' kini {update_data['peran']}.",
                              link="/event")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating kolaborator: {str(e)}")


def remove_kolaborator(event_id: str, kolab_id: str):
    """Remove kolaborator from event."""
    try:
        res = supabase_admin.table("event_kolaborators").delete().eq("id", kolab_id).eq("event_id", event_id).execute()
        if not res.data:  # BE-5: detect silent no-op
            raise HTTPException(404, "Kolaborator assignment tidak ditemukan")
        create_notifikasi(res.data[0].get("kolaborator_id"), "event_update",
                          "Dikeluarkan dari event",
                          f"Keikutsertaan Anda di event '{_event_nama(event_id)}' dihapus oleh penyelenggara.")
        return {"message": "Kolaborator removed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error removing kolaborator: {str(e)}")


# Event ↔ Artisan relations

def get_event_artisans(event_id: str):
    """Get artisans assigned to event with enriched names."""
    try:
        res = supabase_admin.table("event_artisans") \
            .select("*, artisans(nama_usaha, kategori_usaha)") \
            .eq("event_id", event_id) \
            .execute()
            
        artisans = []
        for row in (res.data or []):
            a_info = row.pop("artisans", None) or {}
            row["nama_usaha"] = a_info.get("nama_usaha", "—")
            row["kategori_usaha"] = a_info.get("kategori_usaha", [])
            artisans.append(row)
            
        return artisans
    except Exception as e:
        raise HTTPException(500, f"Error fetching event artisans: {str(e)}")


def assign_artisan(event_id: str, data: dict):
    """Assign artisan to event."""
    try:
        stand_id = data.get("stand_id")
        if stand_id:
            existing = supabase_admin.table("event_artisans").select("id").eq("event_id", event_id).eq("stand_id", stand_id).execute()
            if existing.data:
                raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain.")

        insert_data = {
            "event_id": event_id,
            "artisan_id": data.get("artisan_id"),
            "stand_id": stand_id,
            "posisi_event": stand_id,  # BE-4: always mirror stand_id
            "status_request": "approved",
            "assigned_by": "admin"
        }
        res = supabase_admin.table("event_artisans").insert(insert_data).execute()
        if not res.data:
            raise HTTPException(500, "Gagal assign artisan")
        stand = insert_data.get("stand_id")
        create_notifikasi(insert_data.get("artisan_id"), "event_invite",
                          "Ditambahkan ke event",
                          f"Anda ditambahkan ke event '{_event_nama(event_id)}'"
                          + (f" di stand {stand}." if stand else "."),
                          link="/event")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error assigning artisan: {str(e)}")


def update_event_artisan(event_id: str, artisan_id: str, data: dict):
    """Update artisan assignment."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        
        stand_id = update_data.get("stand_id")
        if stand_id:
            existing = supabase_admin.table("event_artisans").select("artisan_id").eq("event_id", event_id).eq("stand_id", stand_id).execute()
            if existing.data and existing.data[0].get("artisan_id") != artisan_id:
                raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain.")

        res = supabase_admin.table("event_artisans").update(update_data).eq("artisan_id", artisan_id).eq("event_id", event_id).execute()
        if not res.data:
            raise HTTPException(404, "Artisan assignment tidak ditemukan")
        if "stand_id" in update_data or "posisi_event" in update_data:
            stand = update_data.get("stand_id") or update_data.get("posisi_event")
            create_notifikasi(artisan_id, "event_update", "Posisi stand diubah",
                              f"Posisi stand Anda di event '{_event_nama(event_id)}' kini {stand}.",
                              link="/event")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating artisan: {str(e)}")


def remove_artisan(event_id: str, artisan_id: str):
    """Remove artisan from event."""
    try:
        res = supabase_admin.table("event_artisans").delete().eq("artisan_id", artisan_id).eq("event_id", event_id).execute()
        if not res.data:  # BE-5: detect silent no-op
            raise HTTPException(404, "Artisan assignment tidak ditemukan")
        create_notifikasi(artisan_id, "event_update", "Dikeluarkan dari event",
                          f"Keikutsertaan Anda di event '{_event_nama(event_id)}' dihapus oleh penyelenggara.")
        return {"message": "Artisan removed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error removing artisan: {str(e)}")


# Artisan request handling

def get_artisan_requests(event_id: str):
    """Self-join requests (artisan_requests) + stand-change requests (event_artisans).

    BE-1 fix: stand-change requests are written to event_artisans by the artisan
    backend (status_request='pending_change'). We merge them here so the FE
    "Permintaan" tab sees both kinds of request cards.
    """
    try:
        # Only genuinely-pending self-join requests belong in the queue.
        # Approved requests are moved to event_artisans (and the request row
        # deleted) on approval; a lingering 'approved'/other status here is a
        # stale anomaly and must NOT appear as an actionable request.
        res = supabase_admin.table("artisan_requests") \
            .select("*, artisans(nama_usaha, kategori_usaha)") \
            .eq("event_id", event_id) \
            .eq("status_request", "pending") \
            .execute()

        reqs = []
        for row in (res.data or []):
            a_info = row.pop("artisans", None) or {}
            row["nama_usaha"] = a_info.get("nama_usaha", "—")
            row["kategori_usaha"] = a_info.get("kategori_usaha", [])
            reqs.append(row)

        # Stand-change requests live on the event_artisans junction row
        # (written by the artisan backend). Map them to the same request-card
        # shape so the FE "Permintaan" tab renders them without changes.
        ea = supabase_admin.table("event_artisans") \
            .select("*, artisans(nama_usaha, kategori_usaha)") \
            .eq("event_id", event_id) \
            .eq("status_request", "pending_change") \
            .execute()
        for row in (ea.data or []):
            a_info = row.pop("artisans", None) or {}
            reqs.append({
                "id": row.get("id"),                # FE uses this as {rid}
                "event_id": row.get("event_id"),
                "artisan_id": row.get("artisan_id"),
                "posisi_event": row.get("stand_id") or row.get("posisi_event"),  # CURRENT stand
                "change_request": row.get("change_request"),                     # REQUESTED stand
                "status_request": "pending_change",
                "assigned_by": row.get("assigned_by"),
                "created_at": row.get("created_at"),
                "nama_usaha": a_info.get("nama_usaha", "—"),
                "kategori_usaha": a_info.get("kategori_usaha", []),
            })

        return reqs
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan requests: {str(e)}")


def respond_artisan_request(event_id: str, request_id: str, action: str):
    """Approve or reject artisan request."""
    try:
        if action == "approve":
            # Move to event_artisans
            req_res = supabase_admin.table("artisan_requests").select("*").eq("id", request_id).single().execute()
            if not req_res.data:
                raise HTTPException(404, "Request tidak ditemukan")

            req = req_res.data
            stand_id = req.get("posisi_event")
            
            if stand_id:
                existing = supabase_admin.table("event_artisans").select("id").eq("event_id", event_id).eq("stand_id", stand_id).execute()
                if existing.data:
                    raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain. Mohon tolak atau minta ganti posisi.")

            insert_data = {
                "event_id": event_id,
                "artisan_id": req.get("artisan_id"),
                "stand_id": stand_id,
                "posisi_event": stand_id,  # BE-4: always mirror stand_id
                "status_request": "approved",
                "assigned_by": "self"
            }
            supabase_admin.table("event_artisans").insert(insert_data).execute()
            # Delete request
            supabase_admin.table("artisan_requests").delete().eq("id", request_id).execute()
            create_notifikasi(req.get("artisan_id"), "artisan_request_approved",
                              "Permintaan disetujui",
                              f"Permintaan Anda bergabung di event '{_event_nama(event_id)}' disetujui"
                              + (f" (stand {stand_id})." if stand_id else "."),
                              link="/event")
            return {"message": "Request approved"}
        else:  # reject
            # Hard delete to allow re-request (artisan_id diambil dari baris terhapus)
            res = supabase_admin.table("artisan_requests").delete().eq("id", request_id).execute()
            if res.data:
                create_notifikasi(res.data[0].get("artisan_id"), "artisan_request_rejected",
                                  "Permintaan ditolak",
                                  f"Permintaan Anda bergabung di event '{_event_nama(event_id)}' ditolak.")
            return {"message": "Request rejected"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error responding to request: {str(e)}")


def respond_position_change(event_id: str, request_id: str, action: str):
    """Respond to an artisan stand-change request.

    BE-1 fix: request_id = event_artisans.id (NOT artisan_requests.id).
    The artisan backend writes stand-change requests to event_artisans
    (status_request='pending_change', change_request=<new_stand_id>).
    """
    try:
        req_res = supabase_admin.table("event_artisans").select("*") \
            .eq("id", request_id).eq("event_id", event_id).single().execute()
        if not req_res.data:
            raise HTTPException(404, "Request tidak ditemukan")
        row = req_res.data
        new_stand = row.get("change_request")

        if action == "approve":
            if not new_stand:
                raise HTTPException(404, "Tidak ada permintaan perubahan posisi")
            # Conflict: another row of the same event already occupies the target stand
            existing = supabase_admin.table("event_artisans").select("id") \
                .eq("event_id", event_id).eq("stand_id", new_stand) \
                .neq("id", request_id).execute()
            if existing.data:
                raise HTTPException(400, f"Posisi {new_stand} sudah ditempati.")
            # Apply: move the stand, clear the request, back to approved.
            # The row is NEVER deleted.
            supabase_admin.table("event_artisans").update({
                "stand_id": new_stand,
                "posisi_event": new_stand,
                "change_request": None,
                "status_request": "approved",
            }).eq("id", request_id).execute()
            create_notifikasi(row.get("artisan_id"), "position_change_approved",
                              "Perubahan posisi disetujui",
                              f"Stand Anda di event '{_event_nama(event_id)}' kini {new_stand}.",
                              link="/event")
            return {"message": "Position change approved"}
        else:  # reject — old stand stays, request cleared
            supabase_admin.table("event_artisans").update({
                "change_request": None,
                "status_request": "approved",
            }).eq("id", request_id).execute()
            create_notifikasi(row.get("artisan_id"), "position_change_rejected",
                              "Perubahan posisi ditolak",
                              f"Permintaan pindah stand di event '{_event_nama(event_id)}' ditolak; posisi Anda tetap {row.get('stand_id')}.")
            return {"message": "Position change rejected"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error responding to position change: {str(e)}")


# Kolaborator request handling

def get_kolaborator_requests(event_id: str):
    """Get pending kolaborator self-join requests.
    Attempts to use kolaborator_requests table if it exists, otherwise falls back.
    """
    try:
        # Check if kolaborator_requests table exists by trying to query it
        try:
            res = supabase_admin.table("kolaborator_requests") \
                .select("*, kolaborators(nama, subsektor)") \
                .eq("event_id", event_id) \
                .execute()
                
            reqs = []
            for row in (res.data or []):
                k_info = row.pop("kolaborators", None) or {}
                row["nama"] = k_info.get("nama", "—")
                row["subsektor"] = k_info.get("subsektor", [])
                reqs.append(row)
            return reqs
        except Exception:
            # Fallback for when DB doesn't have the table (backward compatibility)
            res = supabase_admin.table("event_kolaborators") \
                .select("*, kolaborators(nama, subsektor)") \
                .eq("event_id", event_id) \
                .eq("assigned_by", "self") \
                .execute()
                
            reqs = []
            for row in (res.data or []):
                if row.get("status_kehadiran") == "pending":
                    k_info = row.pop("kolaborators", None) or {}
                    row["nama"] = k_info.get("nama", "—")
                    row["subsektor"] = k_info.get("subsektor", [])
                    reqs.append(row)
            return reqs
            
    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator requests: {str(e)}")


def respond_kolaborator_request(event_id: str, request_id: str, action: str):
    """Approve or reject kolaborator request."""
    try:
        # Check if we're using the new table by trying to read the request
        try:
            req_res = supabase_admin.table("kolaborator_requests").select("*").eq("id", request_id).single().execute()
            if req_res.data:
                req = req_res.data
                if action == "approve":
                    insert_data = {
                        "event_id": event_id,
                        "kolaborator_id": req.get("kolaborator_id"),
                        "peran": req.get("peran", "peserta"),
                        "status_kehadiran": "terdaftar",
                        "assigned_by": "self"
                    }
                    supabase_admin.table("event_kolaborators").insert(insert_data).execute()
                    
                supabase_admin.table("kolaborator_requests").delete().eq("id", request_id).execute()
                if action == "approve":
                    create_notifikasi(req.get("kolaborator_id"), "event_request_approved",
                                      "Permintaan disetujui",
                                      f"Anda terdaftar sebagai {req.get('peran', 'peserta')} di event '{_event_nama(event_id)}'.",
                                      link="/event")
                else:
                    create_notifikasi(req.get("kolaborator_id"), "event_request_rejected",
                                      "Permintaan ditolak",
                                      f"Permintaan Anda bergabung di event '{_event_nama(event_id)}' ditolak.")
                return {"message": f"Request {action}d"}
        except Exception:
            pass # Fallback below
            
        # Fallback to old behavior
        if action == "approve":
            supabase_admin.table("event_kolaborators").update({"status_kehadiran": "terdaftar"}).eq("id", request_id).execute()
            return {"message": "Request approved"}
        else:  # reject
            supabase_admin.table("event_kolaborators").delete().eq("id", request_id).execute()
            return {"message": "Request rejected"}
    except Exception as e:
        raise HTTPException(500, f"Error responding to request: {str(e)}")


def get_active_event():
    """Get currently active event."""
    try:
        res = supabase_admin.table("events").select("*").eq("status", "berlangsung").limit(1).execute()
        return res.data
    except Exception:
        return None
