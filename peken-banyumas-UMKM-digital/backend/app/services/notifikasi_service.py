import uuid
from datetime import datetime, timezone
from app.db.supabase import db_select, db_insert, db_update


def get_notifikasi(user_id: str) -> list:
    return db_select("notifikasi", filters={"user_id": user_id})


def mark_read(user_id: str, notif_id: str) -> dict:
    # langsung update tanpa select dulu — hindari RLS issue pada maybe_single
    result = db_update("notifikasi", {"id": notif_id, "user_id": user_id}, {"read": True})
    return result[0] if result else {}


def mark_all_read(user_id: str) -> dict:
    notifs = db_select("notifikasi", filters={"user_id": user_id})
    for n in notifs:
        if not n.get("read"):
            db_update("notifikasi", {"id": n["id"]}, {"read": True})
    return {"message": "Semua notifikasi ditandai sudah dibaca"}


def create_notifikasi(
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    link: str = None,
    detail: dict = None,
) -> dict:
    """
    Buat notifikasi baru.
    Field name: 'message' (bukan 'desc'), 'read' (bukan 'dibaca').
    type: open TEXT — validated by backend per role, no DB CHECK.
    """
    data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "read": False,
        "link": link,
        "detail": detail or {},
    }
    return db_insert("notifikasi", data)
