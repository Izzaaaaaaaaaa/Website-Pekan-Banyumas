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


def mark_notification_read(user_payload: dict, notif_id: str) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"message": "Unauthorized"}

    supabase.table("notifications").update({"read": True}).eq("id", notif_id).eq("user_id", user_id).execute()
    return {"id": notif_id, "read": True}


def mark_all_read(user_payload: dict) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"count": 0}

    unread = supabase.table("notifications").select("id").eq("user_id", user_id).eq("read", False).execute()
    count = len(unread.data or [])
    supabase.table("notifications").update({"read": True}).eq("user_id", user_id).execute()
    return {"count": count}
