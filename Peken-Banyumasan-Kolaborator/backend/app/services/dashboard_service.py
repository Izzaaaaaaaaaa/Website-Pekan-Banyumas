"""
Dashboard service — stats for the kolaborator dashboard.
"""

from app.db.supabase import supabase, supabase_admin


def get_dashboard_stats(user_payload: dict | None = None) -> dict:
    """Return summary stats for the dashboard."""
    client = supabase_admin or supabase

    events_total = client.table("events").select("id", count="exact").execute().count or 0
    stories_total = client.table("stories").select("id", count="exact").eq("status", "aktif").execute().count or 0

    return {
        "events_total": events_total,
        "stories_total": stories_total,
    }
