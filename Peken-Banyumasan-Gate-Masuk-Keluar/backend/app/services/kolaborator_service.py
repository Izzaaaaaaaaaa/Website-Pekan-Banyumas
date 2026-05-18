from app.db.supabase import supabase
from fastapi import HTTPException


def list_kolaborators(status: str = None, kota: str = None, q: str = None, page: int = 1, per_page: int = 20):
    """List kolaborators with optional filters."""
    try:
        query = supabase.table("kolaborators").select("*")

        if status:
            query = query.eq("status", status)
        if kota:
            query = query.eq("kota", kota)
        if q:
            query = query.or_(f"nama.ilike.%{q}%,bio.ilike.%{q}%")

        res = query.order("updated_at", desc=True).execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error listing kolaborators: {str(e)}")


def get_kolaborator(kolaborator_id: str):
    """Get kolaborator details."""
    try:
        res = supabase.table("kolaborators").select("*").eq("id", kolaborator_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Kolaborator tidak ditemukan")
        return res.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator: {str(e)}")


def update_kolaborator(kolaborator_id: str, data: dict):
    """Update kolaborator."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return get_kolaborator(kolaborator_id)

        res = supabase.table("kolaborators").update(update_data).eq("id", kolaborator_id).execute()
        if not res.data:
            raise HTTPException(404, "Kolaborator tidak ditemukan")
        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating kolaborator: {str(e)}")


def update_kolaborator_status(kolaborator_id: str, status: str):
    """Update kolaborator status."""
    return update_kolaborator(kolaborator_id, {"status": status})


def get_kolaborator_events(kolaborator_id: str):
    """Get events this kolaborator is assigned to."""
    try:
        res = supabase.table("event_kolaborators") \
            .select("*") \
            .eq("kolaborator_id", kolaborator_id) \
            .execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator events: {str(e)}")


def get_kolaborator_stories(kolaborator_id: str):
    """Get kolaborator's stories."""
    try:
        res = supabase.table("aktivitas") \
            .select("*") \
            .eq("user_id", kolaborator_id) \
            .order("created_at", desc=True) \
            .execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator stories: {str(e)}")
