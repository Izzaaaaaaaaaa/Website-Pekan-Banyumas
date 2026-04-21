from app.db.supabase import supabase


def get_stories() -> list[dict]:
    result = supabase.table("stories").select("*").order("created_at", desc=True).execute()
    return result.data or []
