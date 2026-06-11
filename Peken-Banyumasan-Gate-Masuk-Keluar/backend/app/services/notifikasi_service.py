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


def mark_notifikasi_read(notifikasi_id: str, user_id: str = None):
    """Mark notification as read. Column is `read` (NOT `baca`) per schema.
    Scoped to the owner when user_id is given (jangan bisa menandai punya orang)."""
    try:
        q = supabase_admin.table("notifikasi").update({"read": True}).eq("id", notifikasi_id)
        if user_id:
            q = q.eq("user_id", user_id)
        res = q.execute()
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
            .update({"read": True}) \
            .eq("user_id", user_id) \
            .execute()

        count = len(res.data) if res.data else 0
        return {"message": f"{count} notifikasi telah ditandai dibaca"}

    except Exception as e:
        raise HTTPException(500, f"Error marking all notifikasi read: {str(e)}")


# ── Creation helpers ─────────────────────────────────────────────────────────
# Dipanggil dari mutasi event (assign/approve/reject/update/remove) supaya
# kolaborator & artisan benar-benar menerima notifikasi di portal mereka.
# Sengaja NEVER raise: gagal kirim notifikasi tidak boleh menggagalkan
# mutasi utamanya (mis. akun seed tanpa baris auth.users akan kena FK).

def create_notifikasi(user_id: str, type: str, title: str, message: str,
                      link: str = None, detail: dict = None):
    """Insert one notification row for a user. Swallows every error."""
    if not user_id:
        return
    try:
        supabase_admin.table("notifikasi").insert({
            "user_id": user_id,
            "type": type,
            "title": title,
            "message": message,
            "link": link,
            "detail": detail,
        }).execute()
    except Exception:
        pass


def create_notifikasi_bulk(user_ids, type: str, title: str, message: str,
                           link: str = None):
    """Insert the same notification for many users. Swallows every error."""
    rows = [{
        "user_id": uid,
        "type": type,
        "title": title,
        "message": message,
        "link": link,
    } for uid in {u for u in (user_ids or []) if u}]
    if not rows:
        return
    try:
        supabase_admin.table("notifikasi").insert(rows).execute()
    except Exception:
        # Fallback: satu-per-satu supaya satu FK error tidak membatalkan semua
        for row in rows:
            try:
                supabase_admin.table("notifikasi").insert(row).execute()
            except Exception:
                pass
