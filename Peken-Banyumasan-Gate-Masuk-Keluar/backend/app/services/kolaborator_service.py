from app.db.supabase import supabase, supabase_admin
from fastapi import HTTPException


def list_kolaborators(status: str = None, kota: str = None, q: str = None, page: int = 1, per_page: int = 20):
    """List kolaborators with optional filters."""
    try:
        query = supabase_admin.table("kolaborators").select("*")

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
        res = supabase_admin.table("kolaborators").select("*").eq("id", kolaborator_id).single().execute()
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

        res = supabase_admin.table("kolaborators").update(update_data).eq("id", kolaborator_id).execute()
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


def delete_kolaborator(kolaborator_id: str):
    """Delete kolaborator."""
    try:
        # Delete from Supabase auth (will cascade to profile if configured)
        supabase_admin.auth.admin.delete_user(kolaborator_id)
        # Also try to delete the record in case auth didn't cascade or user is missing from auth
        supabase_admin.table("kolaborators").delete().eq("id", kolaborator_id).execute()
        return {"message": "Kolaborator berhasil dihapus"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting kolaborator: {str(e)}")


def get_kolaborator_events(kolaborator_id: str):
    """Get events this kolaborator is assigned to."""
    try:
        res = supabase_admin.table("event_kolaborators") \
            .select("*, events(*)") \
            .eq("kolaborator_id", kolaborator_id) \
            .execute()
        
        events_list = []
        for ek in (res.data or []):
            event_data = ek.pop("events", {}) or {}
            merged = {**event_data, **ek}
            events_list.append(merged)
            
        return events_list

    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator events: {str(e)}")


def get_kolaborator_stories(kolaborator_id: str):
    """Get kolaborator's stories."""
    try:
        res = supabase_admin.table("stories") \
            .select("*") \
            .eq("author_type", "kolaborator") \
            .eq("author_id", kolaborator_id) \
            .order("created_at", desc=True) \
            .execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator stories: {str(e)}")


def get_kolaborator_portofolio(kolaborator_id: str):
    """Get kolaborator portofolio (karya)."""
    try:
        res = supabase_admin.table("karya").select("*").eq("owner_type", "kolaborator").eq("owner_id", kolaborator_id).order("created_at", desc=True).execute()
        
        # map subsektor to kategori for frontend
        portofolios = []
        for p in (res.data or []):
            p["kategori"] = p.get("subsektor")
            portofolios.append(p)
        return portofolios
    except Exception as e:
        raise HTTPException(500, f"Error fetching portofolio: {str(e)}")


def feature_kolaborator_portofolio(kolaborator_id: str, portofolio_id: str, featured: bool):
    """Toggle featured status of a portofolio."""
    try:
        res = supabase_admin.table("karya").update({"featured": featured}).eq("id", portofolio_id).eq("owner_id", kolaborator_id).execute()
        if not res.data:
            raise HTTPException(404, "Karya tidak ditemukan")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating portofolio: {str(e)}")


def delete_kolaborator_portofolio(kolaborator_id: str, portofolio_id: str):
    """Delete a portofolio."""
    try:
        res = supabase_admin.table("karya").delete().eq("id", portofolio_id).eq("owner_id", kolaborator_id).execute()
        return {"message": "Karya berhasil dihapus"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting portofolio: {str(e)}")

def get_kolaborator_requests(kolaborator_id: str):
    """Get pending kolaborator requests across all events."""
    try:
        # Try new table first
        try:
            res = supabase_admin.table("kolaborator_requests") \
                .select("*, events(nama, tanggal, jam_mulai, jam_selesai)") \
                .eq("kolaborator_id", kolaborator_id) \
                .execute()
                
            reqs = []
            for row in (res.data or []):
                e_info = row.pop("events", None) or {}
                row["event_nama"] = e_info.get("nama", "—")
                row["tanggal"] = e_info.get("tanggal")
                row["jam_mulai"] = e_info.get("jam_mulai")
                row["jam_selesai"] = e_info.get("jam_selesai")
                reqs.append(row)
            return reqs
        except Exception:
            # Fallback to event_kolaborators table with status_kehadiran == 'pending'
            res = supabase_admin.table("event_kolaborators") \
                .select("*, events(nama, tanggal, jam_mulai, jam_selesai)") \
                .eq("kolaborator_id", kolaborator_id) \
                .eq("assigned_by", "self") \
                .execute()
                
            reqs = []
            for row in (res.data or []):
                if row.get("status_kehadiran") == "pending":
                    e_info = row.pop("events", None) or {}
                    row["event_nama"] = e_info.get("nama", "—")
                    row["tanggal"] = e_info.get("tanggal")
                    row["jam_mulai"] = e_info.get("jam_mulai")
                    row["jam_selesai"] = e_info.get("jam_selesai")
                    reqs.append(row)
            return reqs
    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator requests: {str(e)}")
