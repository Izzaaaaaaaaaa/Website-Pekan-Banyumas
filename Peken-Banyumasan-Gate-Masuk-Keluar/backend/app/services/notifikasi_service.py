from app.db.supabase import supabase_admin
from fastapi import HTTPException


def list_notifikasi(user_id: str = None):
    """List notifications for user."""
    try:
        query = supabase_admin.table("notifikasi").select("*")

        if user_id:
            query = query.eq("user_id", user_id)

        res = query.order("created_at", desc=True).execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error listing notifikasi: {str(e)}")


def mark_notifikasi_read(notifikasi_id: str):
    """Mark notification as read."""
    try:
        res = supabase_admin.table("notifikasi").update({"baca": True}).eq("id", notifikasi_id).execute()
        if not res.data:
            raise HTTPException(404, "Notifikasi tidak ditemukan")
        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error marking notifikasi read: {str(e)}")


def mark_all_notifikasi_read(user_id: str):
    """Mark all notifications as read for user."""
    try:
        res = supabase_admin.table("notifikasi") \
            .update({"baca": True}) \
            .eq("user_id", user_id) \
            .execute()

        count = len(res.data) if res.data else 0
        return {"message": f"{count} notifikasi telah ditandai dibaca"}

    except Exception as e:
        raise HTTPException(500, f"Error marking all notifikasi read: {str(e)}")
