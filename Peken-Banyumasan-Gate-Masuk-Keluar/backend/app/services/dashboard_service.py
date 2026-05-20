from app.db.supabase import supabase
from fastapi import HTTPException
from datetime import datetime, timezone
from app.schemas.dashboard_schema import Stats, Visitor, VisitorTapResponse
import time as _time

# ── Active event cache ───────────────────────────────────────────────────────
# Eliminates a Supabase query on every NFC tap / manual entry.
# Event status changes are rare, so 30s staleness is acceptable.
_event_cache = {"data": None, "ts": 0}
_EVENT_CACHE_TTL = 30  # seconds


def get_active_event():
    """Get current active/berlangsung event (cached for 30s)."""
    now = _time.time()
    if _event_cache["data"] is not None and (now - _event_cache["ts"]) < _EVENT_CACHE_TTL:
        return _event_cache["data"]

    res = supabase.table("events") \
        .select("id, nama, status") \
        .eq("status", "berlangsung") \
        .limit(1) \
        .execute()

    result = res.data[0] if res.data else None
    _event_cache["data"] = result
    _event_cache["ts"] = now
    return result



def get_dashboard_stats(event_id: str = None):
    """Get visitor statistics for dashboard."""
    try:
        if not event_id:
            event = get_active_event()
            if not event:
                return Stats(
                    di_dalam=0,
                    total_masuk=0,
                    total_keluar=0,
                    total_harian=0,
                    event_id="",
                    nama_event=""
                )
            event_id = event["id"]
        else:
            # Verify event exists
            event_res = supabase.table("events") \
                .select("id, nama") \
                .eq("id", event_id) \
                .single() \
                .execute()
            if not event_res.data:
                raise HTTPException(404, "Event tidak ditemukan")
            event = event_res.data

        # Get visitors for stats
        logs_res = supabase.table("visitors") \
            .select("status") \
            .eq("event_id", event_id) \
            .execute()

        logs = logs_res.data if logs_res.data else []

        total_masuk = len(logs)
        di_dalam = len([l for l in logs if l["status"] == "di_dalam"])
        total_keluar = len([l for l in logs if l["status"] == "keluar"])

        return Stats(
            di_dalam=di_dalam,
            total_masuk=total_masuk,
            total_keluar=total_keluar,
            total_harian=total_masuk,
            event_id=event_id,
            nama_event=event.get("nama", "")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching dashboard stats: {str(e)}")


def list_visitors(tanggal: str = None, event_id: str = None):
    """List all visitor entries with optional date and event filtering."""
    try:
        query = supabase.table("visitors").select("*")

        if event_id:
            query = query.eq("event_id", event_id)

        if tanggal:
            # Filter by date (YYYY-MM-DD) — use >= and < to cover entire day UTC
            query = query.gte("waktu_masuk", f"{tanggal}T00:00:00.000Z") \
                        .lt("waktu_masuk", f"{tanggal}T23:59:59.999Z")

        res = query.order("waktu_masuk", desc=True).execute()

        visitors = []
        for log in res.data or []:
            uid = log.get("uid")
            tipe = "nfc" if uid else "manual"
            visitor = Visitor(
                id=log.get("id"),
                nama=log.get("nama") or "Tamu",
                waktu_masuk=log.get("waktu_masuk"),
                waktu_keluar=log.get("waktu_keluar"),
                status=log.get("status"),
                tipe_pengunjung=tipe,
                nfc_uid=uid,
                nama_pengunjung=log.get("nama") or "Pengunjung"
            )
            visitors.append(visitor)

        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"list_visitors: tanggal={tanggal}, event_id={event_id}, found={len(visitors)} visitors")
        
        return visitors

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error listing visitors: {str(e)}")
        raise HTTPException(500, f"Error listing visitors: {str(e)}")


def manual_visitor_entry(aksi: str, event_id: str = None):
    """Record a manual visitor entry without NFC tap."""
    try:
        if not event_id:
            event = get_active_event()
            if not event:
                raise HTTPException(404, "Tidak ada event yang sedang berlangsung")
            event_id = event["id"]

        now_iso = datetime.now(timezone.utc).isoformat()

        if aksi == "masuk":
            res = supabase.table("visitors").insert({
                "event_id": event_id,
                "waktu_masuk": now_iso,
                "status": "di_dalam",
                "nama": "Tamu Manual"
            }).execute()
        else:
            # For "keluar", find an active visitor and exit them
            active_res = supabase.table("visitors") \
                .select("id") \
                .eq("event_id", event_id) \
                .eq("status", "di_dalam") \
                .limit(1) \
                .execute()
            
            if not active_res.data:
                # If no one is inside, just insert a complete record
                res = supabase.table("visitors").insert({
                    "event_id": event_id,
                    "waktu_masuk": now_iso,
                    "waktu_keluar": now_iso,
                    "status": "keluar",
                    "nama": "Tamu Manual"
                }).execute()
            else:
                target_id = active_res.data[0]["id"]
                res = supabase.table("visitors").update({
                    "waktu_keluar": now_iso,
                    "status": "keluar"
                }).eq("id", target_id).execute()

        if not res.data:
            raise HTTPException(500, "Gagal mencatat pengunjung")

        return {"message": f"Pengunjung berhasil dicatat {aksi}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error recording manual entry: {str(e)}")


def process_nfc_tap(uid: str, timestamp: str, event_id: str = None):
    """
    Process NFC tap. Determines masuk/keluar based on current status.
    """
    try:
        if not event_id:
            event = get_active_event()
            if not event:
                raise HTTPException(404, "Tidak ada event yang sedang berlangsung")
            event_id = event["id"]

        # Check if this UID is currently inside
        active_res = supabase.table("visitors") \
            .select("id, nama") \
            .eq("event_id", event_id) \
            .eq("uid", uid) \
            .eq("status", "di_dalam") \
            .order("waktu_masuk", desc=True) \
            .limit(1) \
            .execute()

        if active_res.data:
            # It's an exit tap
            target_id = active_res.data[0]["id"]
            nama = active_res.data[0].get("nama", "Tamu")
            aksi = "keluar"
            res = supabase.table("visitors").update({
                "waktu_keluar": timestamp,
                "status": "keluar"
            }).eq("id", target_id).execute()
        else:
            # It's an entry tap
            aksi = "masuk"
            nama = "Tamu"
            
            # Lookup user name if card is registered. If nfc_cards table doesn't exist
            # or lookup fails, just use default "Tamu" (graceful degradation).
            try:
                nfc_res = supabase.table("nfc_cards").select("user_id").eq("card_uid", uid).execute()
                if nfc_res.data:
                    user_res = supabase.table("users_profile").select("nama").eq("id", nfc_res.data[0]["user_id"]).execute()
                    if user_res.data:
                        nama = user_res.data[0]["nama"]
            except Exception as nfc_err:
                # Log warning but don't crash — table might be missing or query failed
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"NFC card lookup failed (table may be missing): {nfc_err}")
                # Continue with default nama = "Tamu"

            res = supabase.table("visitors").insert({
                "event_id": event_id,
                "uid": uid,
                "waktu_masuk": timestamp,
                "status": "di_dalam",
                "nama": nama
            }).execute()

        if not res.data:
            raise HTTPException(500, "Gagal memproses tap NFC")

        status = "di_dalam" if aksi == "masuk" else "keluar"
        message = f"Selamat datang, {nama}!" if aksi == "masuk" else f"Sampai jumpa, {nama}!"

        return VisitorTapResponse(
            aksi=aksi,
            nama=nama,
            status=status
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error processing NFC tap: {str(e)}")


def get_recent_activity(event_id: str = None, limit: int = 10):
    """Get recent visitor activities."""
    try:
        if not event_id:
            event = get_active_event()
            if not event:
                return []
            event_id = event["id"]

        res = supabase.table("visitors") \
            .select("id, nama, status, waktu_masuk, waktu_keluar") \
            .eq("event_id", event_id) \
            .order("waktu_masuk", desc=True) \
            .limit(limit) \
            .execute()

        activities = []
        for log in res.data or []:
            activities.append({
                "id": log.get("id"),
                "nama": log.get("nama"),
                "status": log.get("status"),
                "waktu": log.get("waktu_keluar") if log.get("status") == "keluar" else log.get("waktu_masuk")
            })

        return activities

    except Exception as e:
        return []

