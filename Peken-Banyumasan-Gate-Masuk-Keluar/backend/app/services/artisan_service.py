from app.db.supabase import supabase
from fastapi import HTTPException


def list_artisans(status: str = None, kota: str = None, kategori: str = None, q: str = None):
    """List artisans with optional filters."""
    try:
        query = supabase.table("artisans").select("*")

        if status:
            query = query.eq("status", status)
        if kota:
            query = query.eq("kota", kota)
        if kategori:
            query = query.contains("kategori_usaha", [kategori])
        if q:
            query = query.or_(f"nama_usaha.ilike.%{q}%,deskripsi.ilike.%{q}%")

        res = query.order("updated_at", desc=True).execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error listing artisans: {str(e)}")


def get_artisan(artisan_id: str):
    """Get artisan details."""
    try:
        res = supabase.table("artisans").select("*").eq("id", artisan_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Artisan tidak ditemukan")
        return res.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan: {str(e)}")


def update_artisan(artisan_id: str, data: dict):
    """Update artisan."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return get_artisan(artisan_id)

        res = supabase.table("artisans").update(update_data).eq("id", artisan_id).execute()
        if not res.data:
            raise HTTPException(404, "Artisan tidak ditemukan")
        return res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating artisan: {str(e)}")


def update_artisan_status(artisan_id: str, status: str):
    """Update artisan status."""
    return update_artisan(artisan_id, {"status": status})


def get_artisan_events(artisan_id: str):
    """Get events this artisan is assigned to."""
    try:
        res = supabase.table("event_artisans") \
            .select("*") \
            .eq("artisan_id", artisan_id) \
            .execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan events: {str(e)}")


def get_artisan_qris(artisan_id: str):
    """Get artisan QRIS code."""
    try:
        res = supabase.table("artisans").select("qris_url, qris_updated_at").eq("id", artisan_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Artisan tidak ditemukan")
        return {
            "qris_url": res.data.get("qris_url"),
            "updated_at": res.data.get("qris_updated_at")
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching QRIS: {str(e)}")
