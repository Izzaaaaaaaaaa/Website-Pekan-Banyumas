from app.db.supabase import supabase
from fastapi import HTTPException
from app.schemas.dashboard_schema import DashboardStats


# 🔥 STATS PER EVENT (OPTIMIZED)
def get_dashboard_stats(event_id: str):
    # hitung masuk
    masuk = supabase.table("gate_logs") \
        .select("*", count="exact") \
        .eq("event_id", event_id) \
        .eq("gate_type", "masuk") \
        .execute()

    # hitung keluar
    keluar = supabase.table("gate_logs") \
        .select("*", count="exact") \
        .eq("event_id", event_id) \
        .eq("gate_type", "keluar") \
        .execute()

    total_masuk = masuk.count or 0
    total_keluar = keluar.count or 0

    return DashboardStats(
        total_masuk=total_masuk,
        total_keluar=total_keluar,
        di_dalam=total_masuk - total_keluar
    )


# 🔥 RECENT ACTIVITY PER EVENT
def get_recent_activity(event_id: str, limit: int = 10):
    res = supabase.table("gate_logs") \
        .select("id, gate_type, scan_time, users(nama)") \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .limit(limit) \
        .execute()

    if not res.data:
        return []

    # mapping biar clean
    return [
        {
            "id": log["id"],
            "nama": log["users"]["nama"] if log.get("users") else None,
            "status": log["gate_type"],
            "waktu": log["scan_time"]
        }
        for log in res.data
    ]