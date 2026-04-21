from app.db.supabase import supabase


def get_dashboard_stats() -> dict:
    events_total = supabase.table("events").select("id", count="exact").execute().count or 0
    stories_total = supabase.table("stories").select("id", count="exact").execute().count or 0

    return {
        "events_total": events_total,
        "stories_total": stories_total,
    }
