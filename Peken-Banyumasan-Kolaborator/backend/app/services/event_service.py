from app.db.supabase import supabase


def get_events() -> list[dict]:
    result = supabase.table("events").select("*").order("created_at", desc=True).execute()
    return result.data or []
