from app.db.supabase import supabase, supabase_admin, execute_with_retry
from fastapi import HTTPException
from datetime import datetime, timezone
from app.schemas.dashboard_schema import Stats, Visitor, VisitorTapResponse, NfcTapResponse, NfcTapData
import time as _time
import logging
from typing import Optional, List, Dict, Tuple

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# NFC TAP COOLDOWN CACHE - prevent double/triple taps
# ──────────────────────────────────────────────────────────────────────
_tap_cooldown_cache: Dict[str, float] = {}  # {uid: last_tap_timestamp}
_TAP_COOLDOWN_SECONDS = 5  # Must wait 5 seconds between taps


def is_tap_on_cooldown(uid: str) -> bool:
    """Check if UID has tapped too recently (within cooldown period)."""
    if uid not in _tap_cooldown_cache:
        return False
    
    last_tap = _tap_cooldown_cache[uid]
    now = _time.time()
    time_since_last_tap = now - last_tap
    
    if time_since_last_tap < _TAP_COOLDOWN_SECONDS:
        logger.debug(f"[NFC] UID {uid} on cooldown: {time_since_last_tap:.1f}s (need {_TAP_COOLDOWN_SECONDS}s)")
        return True
    
    return False


def update_tap_cooldown(uid: str) -> None:
    """Record tap time for this UID."""
    _tap_cooldown_cache[uid] = _time.time()
    logger.debug(f"[NFC] Tap cooldown updated for UID: {uid}")


# ── Active event cache ───────────────────────────────────────────────────────
_event_cache = {"data": None, "ts": 0}
_EVENT_CACHE_TTL = 30  # seconds


def get_active_event():
    """Get current active/berlangsung event (cached for 30s)."""
    try:
        now = _time.time()
        if _event_cache["data"] is not None and (now - _event_cache["ts"]) < _EVENT_CACHE_TTL:
            logger.debug(f"[CACHE] Active event cache hit")
            return _event_cache["data"]

        logger.debug(f"[QUERY] Fetching active event from database")
        
        def fetch_event():
            return supabase_admin.table("events") \
                .select("id, nama, status") \
                .eq("status", "berlangsung") \
                .limit(1) \
                .execute()

        res = execute_with_retry(fetch_event, is_admin=True)

        result = res.data[0] if res.data else None
        _event_cache["data"] = result
        _event_cache["ts"] = now
        
        if result:
            logger.debug(f"[CACHE] Active event cached: {result.get('id')} - {result.get('nama')}")
        else:
            logger.debug(f"[QUERY] No active event found")
        
        return result
    except Exception as e:
        logger.error(f"[ERROR] get_active_event failed: {str(e)}")
        return None



def get_dashboard_stats(event_id: Optional[str] = None) -> Stats:
    """Get visitor statistics for dashboard with fallback on error."""
    try:
        logger.info(f"[STATS] Fetching dashboard stats for event_id={event_id}")
        
        if not event_id:
            event = get_active_event()
            if not event:
                logger.warning(f"[STATS] No active event found, returning zero stats")
                return Stats(
                    di_dalam=0,
                    total_masuk=0,
                    total_keluar=0,
                    total_harian=0,
                    event_id="",
                    nama_event=""
                )
            event_id = event["id"]
            logger.debug(f"[STATS] Using active event: {event_id}")
        else:
            if not event_id or len(event_id.strip()) == 0:
                logger.error(f"[STATS] Invalid event_id provided")
                return Stats(
                    di_dalam=0,
                    total_masuk=0,
                    total_keluar=0,
                    total_harian=0,
                    event_id="",
                    nama_event=""
                )
            
            try:
                logger.debug(f"[STATS] Verifying event exists: {event_id}")
                
                def verify_event():
                    return supabase_admin.table("events") \
                        .select("id, nama") \
                        .eq("id", event_id) \
                        .single() \
                        .execute()
                
                event_res = execute_with_retry(verify_event, is_admin=True)
                
                if not event_res.data:
                    logger.warning(f"[STATS] Event not found: {event_id}")
                    return Stats(
                        di_dalam=0,
                        total_masuk=0,
                        total_keluar=0,
                        total_harian=0,
                        event_id=event_id,
                        nama_event="Event Not Found"
                    )
                event = event_res.data
            except Exception as e:
                logger.error(f"[STATS] Failed to verify event: {str(e)}")
                return Stats(
                    di_dalam=0,
                    total_masuk=0,
                    total_keluar=0,
                    total_harian=0,
                    event_id=event_id,
                    nama_event="Database Error"
                )

        try:
            logger.debug(f"[STATS] Fetching visitor stats for event: {event_id}")
            
            def fetch_logs():
                return supabase_admin.table("visitors") \
                    .select("status, uid") \
                    .eq("event_id", event_id) \
                    .execute()
            
            logs_res = execute_with_retry(fetch_logs, is_admin=True)

            logs = logs_res.data if logs_res.data else []
            logger.debug(f"[STATS] Found {len(logs)} visitor records")

            # Pengunjung yang saat ini masih di dalam (status = "di_dalam")
            di_dalam = len([l for l in logs if l.get("status") == "di_dalam"])
            # Total yang pernah masuk = semua record (di_dalam + keluar)
            total_masuk = len(logs)
            # Total yang sudah keluar
            total_keluar = len([l for l in logs if l.get("status") == "keluar"])
            
            # Total kunjungan keseluruhan event aktif:
            # - NFC: hitung unique UID (satu pengunjung tap berkali-kali tetap = 1)
            # - Manual: hitung semua row tanpa uid (di_dalam maupun keluar)
            unique_uids = set()
            manual_count = 0
            for l in logs:
                uid = l.get("uid")
                if uid:
                    unique_uids.add(uid)
                else:
                    manual_count += 1  # manual entry selalu = 1 kunjungan baru
                        
            total_harian = len(unique_uids) + manual_count

            stats = Stats(
                di_dalam=di_dalam,
                total_masuk=total_masuk,
                total_keluar=total_keluar,
                total_harian=total_harian,
                event_id=event_id,
                nama_event=event.get("nama", "")
            )
            logger.info(f"[STATS] ✅ Success: di_dalam={di_dalam}, total_masuk={total_masuk}, total_keluar={total_keluar}, total_harian={total_harian}")
            return stats
        except Exception as e:
            logger.error(f"[STATS] Failed to fetch visitor data: {str(e)}")
            return Stats(
                di_dalam=0,
                total_masuk=0,
                total_keluar=0,
                total_harian=0,
                event_id=event_id,
                nama_event=event.get("nama", "") if isinstance(event, dict) else ""
            )

    except Exception as e:
        logger.error(f"[STATS] Unexpected error in get_dashboard_stats: {str(e)}")
        return Stats(
            di_dalam=0,
            total_masuk=0,
            total_keluar=0,
            total_harian=0,
            event_id="",
            nama_event=""
        )


def list_visitors(tanggal: Optional[str] = None, event_id: Optional[str] = None, limit: Optional[int] = 50) -> List[Visitor]:
    """List all visitor entries with optional date and event filtering. Returns empty list on error."""
    try:
        logger.info(f"[VISITORS] Fetching visitors: tanggal={tanggal}, event_id={event_id}")
        
        if tanggal:
            try:
                datetime.strptime(tanggal, "%Y-%m-%d")
                logger.debug(f"[VISITORS] Date validated: {tanggal}")
            except ValueError:
                logger.error(f"[VISITORS] Invalid date format: {tanggal}. Expected YYYY-MM-DD")
                return []
        
        try:
            def fetch_visitors():
                query = supabase_admin.table("visitors").select("*")

                if event_id:
                    query = query.eq("event_id", event_id)

                if tanggal:
                    date_start = f"{tanggal}T00:00:00.000Z"
                    date_end = f"{tanggal}T23:59:59.999Z"
                    query = query.gte("waktu_masuk", date_start).lt("waktu_masuk", date_end)

                if limit:
                    query = query.limit(limit)

                return query.order("waktu_masuk", desc=True).execute()

            res = execute_with_retry(fetch_visitors, is_admin=True)

            visitors = []
            for log in res.data or []:
                try:
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
                except Exception as item_err:
                    logger.warning(f"[VISITORS] Failed to parse visitor item {log.get('id')}: {str(item_err)}")
                    continue
            
            logger.info(f"[VISITORS] ✅ Success: found {len(visitors)} visitors")
            return visitors
            
        except Exception as e:
            logger.error(f"[VISITORS] Query execution failed: {str(e)}")
            return []

    except Exception as e:
        logger.error(f"[VISITORS] Unexpected error in list_visitors: {str(e)}")
        return []


def manual_visitor_entry(aksi: str, event_id: Optional[str] = None) -> dict:
    """Record a manual visitor entry without NFC tap."""
    try:
        logger.info(f"[MANUAL] Recording manual entry: aksi={aksi}, event_id={event_id}")
        
        if aksi not in ["masuk", "keluar"]:
            logger.error(f"[MANUAL] Invalid aksi value: {aksi}")
            raise HTTPException(422, f"aksi harus 'masuk' atau 'keluar', bukan '{aksi}'")
        
        if not event_id:
            logger.debug(f"[MANUAL] No event_id provided, getting active event")
            event = get_active_event()
            if not event:
                logger.warning(f"[MANUAL] No active event found")
                raise HTTPException(404, "Tidak ada event yang sedang berlangsung")
            event_id = event["id"]
        else:
            if not event_id or len(event_id.strip()) == 0:
                logger.error(f"[MANUAL] Invalid event_id provided")
                raise HTTPException(422, "event_id tidak boleh kosong")

        now_iso = datetime.now(timezone.utc).isoformat()
        logger.debug(f"[MANUAL] Timestamp: {now_iso}")

        try:
            if aksi == "masuk":
                def perform_insert():
                    return supabase_admin.table("visitors").insert({
                        "event_id": event_id,
                        "waktu_masuk": now_iso,
                        "status": "di_dalam",
                        "nama": "Tamu Manual"
                    }).execute()
                res = execute_with_retry(perform_insert, is_admin=True)
            else:
                def fetch_active():
                    return supabase_admin.table("visitors") \
                        .select("id") \
                        .eq("event_id", event_id) \
                        .eq("status", "di_dalam") \
                        .limit(1) \
                        .execute()
                active_res = execute_with_retry(fetch_active, is_admin=True)
                
                if not active_res.data:
                    def insert_complete():
                        return supabase_admin.table("visitors").insert({
                            "event_id": event_id,
                            "waktu_masuk": now_iso,
                            "waktu_keluar": now_iso,
                            "status": "keluar",
                            "nama": "Tamu Manual"
                        }).execute()
                    res = execute_with_retry(insert_complete, is_admin=True)
                else:
                    target_id = active_res.data[0]["id"]
                    def update_active():
                        return supabase_admin.table("visitors").update({
                            "waktu_keluar": now_iso,
                            "status": "keluar"
                        }).eq("id", target_id).execute()
                    res = execute_with_retry(update_active, is_admin=True)

            if not res.data:
                logger.error(f"[MANUAL] Database returned empty response")
                raise HTTPException(500, "Gagal mencatat pengunjung - database error")

            message = f"Pengunjung berhasil dicatat {aksi}"
            logger.info(f"[MANUAL] ✅ Success: {message}")
            return {"message": message}
        
        except Exception as db_err:
            err_str = str(db_err)
            logger.error(f"[MANUAL] Database operation failed: {err_str}")
            if "42501" in err_str or "violates row-level security" in err_str:
                raise HTTPException(403, f"RLS Policy Error: {err_str}")
            if isinstance(db_err, HTTPException):
                raise
            raise HTTPException(500, f"Gagal mencatat pengunjung")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[MANUAL] Unexpected error: {str(e)}")
        raise HTTPException(500, f"Error recording manual entry")


def process_nfc_tap(uid: str, timestamp: str, event_id: Optional[str] = None) -> NfcTapResponse:
    """
    Process NFC tap using finite state machine as requested.
    Insert a new row for each tap based on the last activity.
    """
    try:
        if not uid or len(uid.strip()) == 0:
            raise HTTPException(422, "uid tidak boleh kosong")
        
        if not timestamp or len(timestamp.strip()) == 0:
            raise HTTPException(422, "timestamp tidak boleh kosong")
        
        uid = uid.strip()
        
        if is_tap_on_cooldown(uid):
            logger.info(f"[NFC] TOO FAST TAP: uid={uid}")
            return NfcTapResponse(
                success=False,
                code="TOO_FAST_TAP",
                message="Kartu baru saja dipindai"
            )
        
        if not event_id:
            event = get_active_event()
            if not event:
                return NfcTapResponse(
                    success=False,
                    code="NO_ACTIVE_EVENT",
                    message="Tidak ada event aktif"
                )
            event_id = event["id"]

        def fetch_last_activity():
            return supabase_admin.table("visitors") \
                .select("*") \
                .eq("uid", uid) \
                .eq("event_id", event_id) \
                .order("waktu_masuk", desc=True) \
                .limit(1) \
                .execute()
        
        last_activity_res = execute_with_retry(fetch_last_activity, is_admin=True)
        last_activity = last_activity_res.data[0] if last_activity_res.data else None
        
        if not last_activity:
            next_status = "di_dalam"
            action_label = "CHECK_IN"
            msg = "Pengunjung berhasil masuk"
            
            insert_data = {
                "event_id": event_id,
                "uid": uid,
                "waktu_masuk": timestamp,
                "status": next_status,
                "nama": "Tamu"
            }
            def execute_insert():
                return supabase_admin.table("visitors").insert(insert_data).execute()
            execute_with_retry(execute_insert, is_admin=True)
        else:
            last_status = last_activity.get("status")
            record_id = last_activity.get("id")
            
            if last_status == "di_dalam":
                next_status = "keluar"
                action_label = "CHECK_OUT"
                msg = "Pengunjung berhasil keluar"
                
                update_data = {
                    "status": next_status,
                    "waktu_keluar": timestamp
                }
            else:
                next_status = "di_dalam"
                action_label = "CHECK_IN"
                msg = "Pengunjung berhasil masuk kembali"
                
                update_data = {
                    "status": next_status,
                    "waktu_masuk": timestamp,
                    "waktu_keluar": None
                }
                
            def execute_update():
                return supabase_admin.table("visitors").update(update_data).eq("id", record_id).execute()
            execute_with_retry(execute_update, is_admin=True)

        update_tap_cooldown(uid)
        
        aksi_val = "masuk" if next_status == "di_dalam" else "keluar"
        return NfcTapResponse(
            success=True,
            code=f"{action_label}_SUCCESS",
            action=action_label,
            aksi=aksi_val,
            message=msg,
            data=NfcTapData(
                uid=uid, 
                status="INSIDE" if next_status == "di_dalam" else "OUTSIDE",
                aksi=aksi_val
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[NFC] UNEXPECTED ERROR: {str(e)}")
        return NfcTapResponse(
            success=False,
            code="INTERNAL_SERVER_ERROR",
            message="Terjadi kesalahan server"
        )


def get_recent_activity(event_id: Optional[str] = None, limit: int = 10) -> List[dict]:
    """Get recent visitor activities. Returns empty list on error."""
    try:
        logger.debug(f"[ACTIVITY] Fetching recent activity: event_id={event_id}, limit={limit}")
        
        if not event_id:
            event = get_active_event()
            if not event:
                logger.debug(f"[ACTIVITY] No active event, returning empty list")
                return []
            event_id = event["id"]
            logger.debug(f"[ACTIVITY] Using active event: {event_id}")

        try:
            logger.debug(f"[ACTIVITY] Fetching {limit} recent activities")
            
            def fetch_recent():
                return supabase_admin.table("visitors") \
                    .select("id, nama, status, waktu_masuk, waktu_keluar") \
                    .eq("event_id", event_id) \
                    .order("waktu_masuk", desc=True) \
                    .limit(limit) \
                    .execute()

            res = execute_with_retry(fetch_recent, is_admin=True)

            activities = []
            for log in res.data or []:
                try:
                    activities.append({
                        "id": log.get("id"),
                        "nama": log.get("nama"),
                        "status": log.get("status"),
                        "waktu": log.get("waktu_keluar") if log.get("status") == "keluar" else log.get("waktu_masuk")
                    })
                except Exception as item_err:
                    logger.warning(f"[ACTIVITY] Failed to parse activity item: {str(item_err)}")
                    continue

            logger.debug(f"[ACTIVITY] ✅ Found {len(activities)} activities")
            return activities
        
        except Exception as db_err:
            logger.error(f"[ACTIVITY] Query failed: {str(db_err)}")
            return []

    except Exception as e:
        logger.error(f"[ACTIVITY] Unexpected error: {str(e)}")
        return []
