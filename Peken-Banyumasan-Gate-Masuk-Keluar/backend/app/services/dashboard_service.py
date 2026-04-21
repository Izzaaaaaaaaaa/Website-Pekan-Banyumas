from app.db.supabase import supabase

def get_dashboard_stats():
    logs = supabase.table("gate_logs").select("*").execute().data

    total_masuk = sum(1 for l in logs if l["gate_type"] == "masuk")
    total_keluar = sum(1 for l in logs if l["gate_type"] == "keluar")

    inside = total_masuk - total_keluar

    return {
        "total_masuk": total_masuk,
        "total_keluar": total_keluar,
        "di_dalam": inside
    }


def get_recent_activity(limit: int = 10):
    logs = supabase.table("gate_logs") \
        .select("*, users(nama)") \
        .order("scan_time", desc=True) \
        .limit(limit) \
        .execute()

    return logs.data