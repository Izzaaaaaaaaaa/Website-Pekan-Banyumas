from app.db.supabase import supabase

# STATS PER EVENT
def get_dashboard_stats(event_id: str):
    logs = supabase.table("gate_logs") \
        .select("gate_type") \
        .eq("event_id", event_id) \
        .execute().data

    total_masuk = sum(1 for l in logs if l["gate_type"] == "masuk")
    total_keluar = sum(1 for l in logs if l["gate_type"] == "keluar")

    return {
        "total_masuk": total_masuk,
        "total_keluar": total_keluar,
        "di_dalam": total_masuk - total_keluar
    }


# RECENT ACTIVITY PER EVENT
def get_recent_activity(event_id: str, limit: int = 10):
    logs = supabase.table("gate_logs") \
        .select("id, gate_type, scan_time, users(nama)") \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .limit(limit) \
        .execute()

    return logs.data