from app.db.supabase import supabase, supabase_admin
from fastapi import HTTPException


def list_artisans(status: str = None, kota: str = None, kategori: str = None, q: str = None):
    """List artisans with optional filters."""
    try:
        query = supabase_admin.table("artisans").select("*")

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
        res = supabase_admin.table("artisans").select("*").eq("id", artisan_id).single().execute()
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

        res = supabase_admin.table("artisans").update(update_data).eq("id", artisan_id).execute()
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
        res = supabase_admin.table("event_artisans") \
            .select("*, events(*)") \
            .eq("artisan_id", artisan_id) \
            .execute()
            
        data = res.data or []
        formatted_events = []
        for item in data:
            event = item.get("events") or {}
            formatted_events.append({
                "id": item.get("id"),
                "event_id": item.get("event_id"),
                "nama": event.get("nama", "Unknown Event"),
                "tanggal": event.get("tanggal", ""),
                "jam_mulai": event.get("jam_mulai", ""),
                "jam_selesai": event.get("jam_selesai", ""),
                "posisi_event": item.get("stand_id", ""),
                "assigned_by": item.get("assigned_by", "")
            })
        return formatted_events

    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan events: {str(e)}")


def get_artisan_qris(artisan_id: str):
    """Get artisan QRIS code."""
    try:
        res = supabase_admin.table("artisans").select("qris_url, qris_updated_at").eq("id", artisan_id).single().execute()
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
