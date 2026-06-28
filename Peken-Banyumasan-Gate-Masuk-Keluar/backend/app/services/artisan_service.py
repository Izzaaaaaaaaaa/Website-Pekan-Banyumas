from app.db.supabase import supabase, supabase_admin
from fastapi import HTTPException


def _sync_auth_metadata(user_id: str, status: str) -> None:
    """Mirror the account state into Supabase Auth app_metadata.

    The `artisans` table is the source of truth, but the FE route guards and
    the JWT read `app_metadata.{role,status}`. Keeping the copy in sync means a
    suspend/approve takes effect on the next token refresh/reload, and the two
    never drift. Best-effort: the artisan login also re-checks the DB, so a sync
    failure never compromises the gate.
    """
    if not user_id or not status:
        return
    try:
        supabase_admin.auth.admin.update_user_by_id(
            user_id, {"app_metadata": {"role": "artisan", "status": status}}
        )
    except Exception as e:
        print(f"Warning: gagal sync app_metadata artisan {user_id}: {e}")


def list_artisans(status: str = None, kota: str = None, kategori: str = None, q: str = None):
    """List artisans with optional filters."""
    try:
        query = supabase_admin.table("artisans").select("*")

        if status:
            query = query.eq("status", status)
        if kota:
            query = query.eq("kota", kota)
        if kategori:
            query = query.contains("kategori_usaha", [kategori])
        if q:
            query = query.or_(f"nama_usaha.ilike.%{q}%,deskripsi.ilike.%{q}%")

        res = query.order("updated_at", desc=True).execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error listing artisans: {str(e)}")


def get_artisan(artisan_id: str):
    """Get artisan details."""
    try:
        res = supabase_admin.table("artisans").select("*").eq("id", artisan_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Artisan tidak ditemukan")
        return res.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan: {str(e)}")


def update_artisan(artisan_id: str, data: dict):
    """Update artisan."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return get_artisan(artisan_id)

        # Invariant uang: komisi_terkumpul = ROUND(total_penjualan*persen/100, 2).
        # Recompute milik backend artisan hanya berjalan saat mutasi kas — jadi
        # saat admin mengubah komisi_persen DI SINI, turunannya wajib ikut
        # dihitung ulang; tanpa ini dashboard & laporan menampilkan komisi basi
        # sampai artisan kebetulan mencatat transaksi baru.
        if "komisi_persen" in update_data:
            from decimal import Decimal
            cur = supabase_admin.table("artisans").select("total_penjualan")                 .eq("id", artisan_id).single().execute()
            total = Decimal(str((cur.data or {}).get("total_penjualan") or 0))
            persen = Decimal(str(update_data["komisi_persen"] or 0))
            update_data["komisi_terkumpul"] = str((total * persen / 100).quantize(Decimal("0.01")))

        res = supabase_admin.table("artisans").update(update_data).eq("id", artisan_id).execute()
        if not res.data:
            raise HTTPException(404, "Artisan tidak ditemukan")
        # Keep the Supabase Auth copy of the account state in sync (see helper).
        if "status" in update_data:
            _sync_auth_metadata(artisan_id, update_data["status"])
        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating artisan: {str(e)}")


def update_artisan_status(artisan_id: str, status: str):
    """Update artisan status."""
    return update_artisan(artisan_id, {"status": status})


def delete_artisan(artisan_id: str):
    """Hard-delete an artisan and everything attached to it.

    Every child row (event_artisans, artisan_requests, kas, karya, stories, …)
    has FK ON DELETE CASCADE, and artisans -> users_profile -> auth.users all
    cascade downward, so removing any ancestor cleans the whole subtree. We
    attempt all three removals idempotently (each in its own guard) so one
    failure can't leave a half-deleted account behind:
      1. auth user   — cascades the entire chain when it succeeds;
      2. users_profile — cascades artisans + children if the auth delete failed;
      3. artisans row  — final no-op safety net.
    The artisan login also fails closed when the row is gone, so even a failed
    auth-user delete can never be used to log back in.
    """
    try:
        try:
            supabase_admin.auth.admin.delete_user(artisan_id)
        except Exception as auth_err:
            print(f"Warning: gagal hapus auth user {artisan_id}: {auth_err}")

        try:
            supabase_admin.table("users_profile").delete().eq("id", artisan_id).execute()
        except Exception:
            pass

        supabase_admin.table("artisans").delete().eq("id", artisan_id).execute()
        return {"message": "Artisan berhasil dihapus"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting artisan: {str(e)}")


def get_artisan_events(artisan_id: str):
    """Get events this artisan is assigned to."""
    try:
        res = supabase_admin.table("event_artisans") \
            .select("*, events(*)") \
            .eq("artisan_id", artisan_id) \
            .execute()
            
        data = res.data or []
        formatted_events = []
        for item in data:
            event = item.get("events") or {}
            formatted_events.append({
                "id": item.get("id"),
                "event_id": item.get("event_id"),
                "nama": event.get("nama", "Unknown Event"),
                "tanggal": event.get("tanggal", ""),
                "jam_mulai": event.get("jam_mulai", ""),
                "jam_selesai": event.get("jam_selesai", ""),
                "posisi_event": item.get("stand_id", ""),
                "assigned_by": item.get("assigned_by", "")
            })
        return formatted_events

    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan events: {str(e)}")


def get_artisan_qris(artisan_id: str):
    """Get artisan QRIS code."""
    try:
        res = supabase_admin.table("artisans").select("qris_url, qris_updated_at").eq("id", artisan_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Artisan tidak ditemukan")
        return {
            "qris_url": res.data.get("qris_url"),
            "updated_at": res.data.get("qris_updated_at")
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching QRIS: {str(e)}")


def get_artisan_kas(artisan_id: str, from_date: str = None, to_date: str = None):
    """Get artisan cashflow."""
    try:
        query = supabase_admin.table("kas").select("*").eq("artisan_id", artisan_id)
        if from_date:
            query = query.gte("created_at", f"{from_date}T00:00:00")
        if to_date:
            query = query.lt("created_at", f"{to_date}T23:59:59")
            
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan kas: {str(e)}")


def get_artisan_riwayat(artisan_id: str, from_date: str = None, to_date: str = None):
    """Get artisan transaction history."""
    try:
        query = supabase_admin.table("riwayat").select("*").eq("artisan_id", artisan_id)
        if from_date:
            query = query.gte("created_at", f"{from_date}T00:00:00")
        if to_date:
            query = query.lt("created_at", f"{to_date}T23:59:59")
            
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan riwayat: {str(e)}")


def get_artisan_promo(artisan_id: str):
    """Get artisan promos."""
    try:
        res = supabase_admin.table("promo").select("*").eq("artisan_id", artisan_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan promo: {str(e)}")


def get_artisan_stok(artisan_id: str):
    """Get artisan inventory."""
    try:
        res = supabase_admin.table("stok").select("*").eq("artisan_id", artisan_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan stok: {str(e)}")

def get_artisan_requests(artisan_id: str):
    """Get pending artisan requests across all events."""
    try:
        # Check if artisan_requests table exists
        try:
            res = supabase_admin.table("artisan_requests") \
                .select("*, events(nama, tanggal, jam_mulai, jam_selesai)") \
                .eq("artisan_id", artisan_id) \
                .neq("status_request", "rejected") \
                .execute()
                
            reqs = []
            for row in (res.data or []):
                e_info = row.pop("events", None) or {}
                row["event_nama"] = e_info.get("nama", "—")
                row["tanggal"] = e_info.get("tanggal")
                row["jam_mulai"] = e_info.get("jam_mulai")
                row["jam_selesai"] = e_info.get("jam_selesai")
                reqs.append(row)
            return reqs
        except Exception:
            # Fallback to event_artisans table with status_kehadiran == 'pending'
            res = supabase_admin.table("event_artisans") \
                .select("*, events(nama, tanggal, jam_mulai, jam_selesai)") \
                .eq("artisan_id", artisan_id) \
                .eq("assigned_by", "self") \
                .execute()
                
            reqs = []
            for row in (res.data or []):
                if row.get("status_kehadiran") == "pending":
                    e_info = row.pop("events", None) or {}
                    row["event_nama"] = e_info.get("nama", "—")
                    row["tanggal"] = e_info.get("tanggal")
                    row["jam_mulai"] = e_info.get("jam_mulai")
                    row["jam_selesai"] = e_info.get("jam_selesai")
                    reqs.append(row)
            return reqs
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan requests: {str(e)}")
