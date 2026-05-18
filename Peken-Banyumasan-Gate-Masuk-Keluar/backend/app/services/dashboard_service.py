from app.db.supabase import supabase
from fastapi import HTTPException
from datetime import datetime
from app.schemas.dashboard_schema import Stats, Visitor, VisitorTapResponse


def get_active_event():
    """Get current active/berlangsung event."""
    res = supabase.table("events") \
        .select("*") \
        .eq("status", "berlangsung") \
        .limit(1) \
        .execute()

    return res.data[0] if res.data else None


def get_dashboard_stats(event_id: str = None):
    """Get visitor statistics for dashboard."""
    try:
        if not event_id:
            event = get_active_event()
            if not event:
                raise HTTPException(404, "Tidak ada event yang sedang berlangsung")
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

        # Get gate logs for stats
        logs_res = supabase.table("gate_logs") \
            .select("aksi") \
            .eq("event_id", event_id) \
            .execute()

        logs = logs_res.data if logs_res.data else []

        total_masuk = len([l for l in logs if l["aksi"] == "masuk"])
        total_keluar = len([l for l in logs if l["aksi"] == "keluar"])
        di_dalam = total_masuk - total_keluar

        return Stats(
            di_dalam=di_dalam,
            total_masuk=total_masuk,
            total_keluar=total_keluar,
            total_harian=total_masuk,  # Daily total = total entries
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
        query = supabase.table("gate_logs").select("*")

        if event_id:
            query = query.eq("event_id", event_id)

        if tanggal:
            # Filter by date (YYYY-MM-DD)
            query = query.gte("waktu_masuk", f"{tanggal}T00:00:00") \
                        .lt("waktu_masuk", f"{tanggal}T23:59:59")

        res = query.order("waktu_masuk", desc=True).execute()

        visitors = []
        for log in res.data or []:
            visitor = Visitor(
                id=log.get("id"),
                nama=log.get("nama"),
                waktu_masuk=log.get("waktu_masuk"),
                waktu_keluar=log.get("waktu_keluar"),
                status="di_dalam" if log.get("aksi") == "masuk" and not log.get("waktu_keluar") else "keluar"
            )
            visitors.append(visitor)

        return visitors

    except Exception as e:
        raise HTTPException(500, f"Error listing visitors: {str(e)}")


def manual_visitor_entry(aksi: str, event_id: str = None):
    """Record a manual visitor entry without NFC tap."""
    try:
        if not event_id:
            event = get_active_event()
            if not event:
                raise HTTPException(404, "Tidak ada event yang sedang berlangsung")
            event_id = event["id"]

        # Create gate log entry
        res = supabase.table("gate_logs").insert({
            "event_id": event_id,
            "aksi": aksi,  # masuk or keluar
            "waktu_masuk": datetime.utcnow().isoformat(),
            "nama": "Manual Entry"
        }).execute()

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

        # Look up visitor by NFC UID
        visitor_res = supabase.table("nfc_cards") \
            .select("visitor_id, nama") \
            .eq("uid", uid) \
            .single() \
            .execute()

        if not visitor_res.data:
            raise HTTPException(404, "Kartu NFC tidak terdaftar")

        visitor_data = visitor_res.data
        visitor_id = visitor_data.get("visitor_id")
        nama = visitor_data.get("nama")

        # Check current visitor status (last entry)
        last_entry = supabase.table("gate_logs") \
            .select("aksi, waktu_masuk") \
            .eq("event_id", event_id) \
            .eq("visitor_id", visitor_id) \
            .order("waktu_masuk", desc=True) \
            .limit(1) \
            .execute()

        # Determine action: if last was masuk, then keluar. Otherwise masuk.
        last_aksi = last_entry.data[0].get("aksi") if last_entry.data else None
        aksi = "keluar" if last_aksi == "masuk" else "masuk"

        # Record the tap
        log_res = supabase.table("gate_logs").insert({
            "event_id": event_id,
            "visitor_id": visitor_id,
            "uid": uid,
            "aksi": aksi,
            "waktu_masuk": timestamp,
            "nama": nama
        }).execute()

        if not log_res.data:
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

        res = supabase.table("gate_logs") \
            .select("id, nama, aksi, waktu_masuk") \
            .eq("event_id", event_id) \
            .order("waktu_masuk", desc=True) \
            .limit(limit) \
            .execute()

        activities = []
        for log in res.data or []:
            activities.append({
                "id": log.get("id"),
                "nama": log.get("nama"),
                "status": log.get("aksi"),
                "waktu": log.get("waktu_masuk")
            })

        return activities

    except Exception as e:
        return []
