from app.db.supabase import supabase
from fastapi import HTTPException
from app.schemas.dashboard_schema import DashboardStats
from app.services.event_service import get_active_event


def get_dashboard_stats(event_id: str = None):
    try:
        if not event_id:
            event = get_active_event()

            if not event:
                return DashboardStats(
                    total_masuk=0,
                    total_keluar=0,
                    di_dalam=0
                )

            event_id = event["id"]

        # 🔥 ambil semua data dulu (lebih stabil)
        res = supabase.table("gate_logs") \
            .select("gate_type") \
            .eq("event_id", event_id) \
            .execute()

        data = res.data if res.data else []

        total_masuk = len([d for d in data if d["gate_type"] == "masuk"])
        total_keluar = len([d for d in data if d["gate_type"] == "keluar"])

        return DashboardStats(
            total_masuk=total_masuk,
            total_keluar=total_keluar,
            di_dalam=total_masuk - total_keluar
        )

    except Exception as e:
        print("ERROR DASHBOARD STATS:", e)

        return DashboardStats(
            total_masuk=0,
            total_keluar=0,
            di_dalam=0
        )

def get_recent_activity(event_id: str = None, limit: int = 10):
    try:
        if not event_id:
            event = get_active_event()

            if not event:
                return []

            event_id = event["id"]

        res = supabase.table("gate_logs") \
            .select("id, gate_type, scan_time, users_profile(nama)") \
            .eq("event_id", event_id) \
            .order("scan_time", desc=True) \
            .limit(limit) \
            .execute()

        data = res.data if res.data else []

        return [
            {
                "id": log.get("id"),
                "nama": log.get("users_profile", {}).get("nama"),
                "status": log.get("gate_type"),
                "waktu": log.get("scan_time")
            }
            for log in data
        ]

    except Exception as e:
        print("ERROR ACTIVITY:", e)
        return []