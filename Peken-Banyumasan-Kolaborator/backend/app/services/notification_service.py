"""
Notification service — per-user notification inbox.

Maps to the `notifikasi` table. Field name is `read` (NOT `dibaca`).
"""

from app.db.supabase import supabase, supabase_admin


def get_notifications(user_payload: dict) -> list[dict]:
    """GET /api/notifikasi — list per-user notifications sorted DESC."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    client = supabase_admin or supabase
    result = (
        client.table("notifikasi")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def mark_notification_read(user_payload: dict, notif_id: str) -> dict:
    """PATCH /api/notifikasi/{id}/baca — mark one notification as read."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"message": "Unauthorized"}

    client = supabase_admin or supabase
    client.table("notifikasi").update({"read": True}).eq("id", notif_id).eq("user_id", user_id).execute()
    return {"id": notif_id, "read": True}


def mark_all_read(user_payload: dict) -> dict:
    """PATCH /api/notifikasi/baca-semua — mark all notifications as read."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"count": 0}

    client = supabase_admin or supabase
    unread = client.table("notifikasi").select("id").eq("user_id", user_id).eq("read", False).execute()
    count = len(unread.data or [])
    client.table("notifikasi").update({"read": True}).eq("user_id", user_id).execute()
    return {"count": count}
