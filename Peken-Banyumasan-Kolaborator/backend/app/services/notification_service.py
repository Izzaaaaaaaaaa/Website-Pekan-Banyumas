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


# ── Creation helper ──────────────────────────────────────────────────────────
# Dipakai event_service untuk memberi tahu admin saat ada permintaan bergabung
# baru. NEVER raises — gagal kirim notifikasi tidak boleh menggagalkan aksi
# utamanya.

def create_notifikasi(user_id: str, type: str, title: str, message: str,
                      link: str = None):
    if not user_id:
        return
    try:
        client = supabase_admin or supabase
        client.table("notifikasi").insert({
            "user_id": user_id,
            "type": type,
            "title": title,
            "message": message,
            "link": link,
        }).execute()
    except Exception:
        pass


def notify_admins(type: str, title: str, message: str, link: str = None):
    """Insert the same notification for every admin (users_profile.role='admin')."""
    try:
        client = supabase_admin or supabase
        admins = client.table("users_profile").select("id").eq("role", "admin").execute()
        rows = [{
            "user_id": a["id"], "type": type, "title": title,
            "message": message, "link": link,
        } for a in (admins.data or []) if a.get("id")]
        if rows:
            client.table("notifikasi").insert(rows).execute()
    except Exception:
        pass
