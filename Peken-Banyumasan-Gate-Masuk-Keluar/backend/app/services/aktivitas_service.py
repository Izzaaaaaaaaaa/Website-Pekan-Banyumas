from app.db.supabase import supabase
from fastapi import HTTPException


def list_aktivitas(q: str = None, limit: int = 50):
    """List all stories for admin moderation."""
    try:
        query = supabase.table("aktivitas").select("*")

        if q:
            query = query.or_(f"konten.ilike.%{q}%")

        res = query.order("created_at", desc=True).limit(limit).execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error listing aktivitas: {str(e)}")


def delete_aktivitas(aktivitas_id: str):
    """Delete a story (moderation)."""
    try:
        res = supabase.table("aktivitas").delete().eq("id", aktivitas_id).execute()
        return {"message": "Cerita berhasil dihapus"}

    except Exception as e:
        raise HTTPException(500, f"Error deleting aktivitas: {str(e)}")
