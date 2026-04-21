from app.db.supabase import supabase


def get_notifications(user_payload: dict) -> list[dict]:
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
