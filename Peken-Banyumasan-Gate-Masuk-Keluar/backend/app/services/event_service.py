from app.db.supabase import supabase, supabase_admin
from fastapi import HTTPException
from datetime import datetime


def list_events(status: str = None):
    """List all events."""
    try:
        query = supabase_admin.table("events").select("*")
        if status:
            query = query.eq("status", status)
        res = query.order("tanggal", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error listing events: {str(e)}")


def get_event(event_id: str):
    """Get event details."""
    try:
        res = supabase_admin.table("events").select("*").eq("id", event_id).single().execute()
        if not res.data:
            raise HTTPException(404, "Event tidak ditemukan")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching event: {str(e)}")


def create_event(data: dict):
    """Create new event."""
    try:
        res = supabase_admin.table("events").insert(data).execute()
        if not res.data:
            raise HTTPException(500, "Gagal membuat event")
        return res.data[0]
    except Exception as e:
        raise HTTPException(500, f"Error creating event: {str(e)}")


def update_event(event_id: str, data: dict):
    """Update event."""
    try:
        res = supabase_admin.table("events").update(data).eq("id", event_id).execute()
        if not res.data:
            raise HTTPException(404, "Event tidak ditemukan")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating event: {str(e)}")


def delete_event(event_id: str):
    """Delete event."""
    try:
        res = supabase_admin.table("events").delete().eq("id", event_id).execute()
        return {"message": "Event berhasil dihapus"}
    except Exception as e:
        raise HTTPException(500, f"Error deleting event: {str(e)}")


# Event ↔ Kolaborator relations

def get_event_kolaborators(event_id: str):
    """Get kolaborators assigned to event."""
    try:
        res = supabase_admin.table("event_kolaborators").select("*").eq("event_id", event_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching event kolaborators: {str(e)}")


def assign_kolaborator(event_id: str, data: dict):
    """Assign kolaborator to event."""
    try:
        insert_data = {
            "event_id": event_id,
            "kolaborator_id": data.get("kolaborator_id"),
            "peran": data.get("peran", "peserta"),
            "status_kehadiran": data.get("status_kehadiran", "terdaftar"),
            "assigned_by": "admin"
        }
        res = supabase_admin.table("event_kolaborators").insert(insert_data).execute()
        if not res.data:
            raise HTTPException(500, "Gagal assign kolaborator")
        return res.data[0]
    except Exception as e:
        raise HTTPException(500, f"Error assigning kolaborator: {str(e)}")


def update_event_kolaborator(event_id: str, kolab_id: str, data: dict):
    """Update kolaborator assignment."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        res = supabase_admin.table("event_kolaborators").update(update_data).eq("id", kolab_id).eq("event_id", event_id).execute()
        if not res.data:
            raise HTTPException(404, "Kolaborator assignment tidak ditemukan")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating kolaborator: {str(e)}")


def remove_kolaborator(event_id: str, kolab_id: str):
    """Remove kolaborator from event."""
    try:
        res = supabase_admin.table("event_kolaborators").delete().eq("id", kolab_id).eq("event_id", event_id).execute()
        return {"message": "Kolaborator removed"}
    except Exception as e:
        raise HTTPException(500, f"Error removing kolaborator: {str(e)}")


# Event ↔ Artisan relations

def get_event_artisans(event_id: str):
    """Get artisans assigned to event."""
    try:
        res = supabase_admin.table("event_artisans").select("*").eq("event_id", event_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching event artisans: {str(e)}")


def assign_artisan(event_id: str, data: dict):
    """Assign artisan to event."""
    try:
        stand_id = data.get("stand_id")
        if stand_id:
            existing = supabase_admin.table("event_artisans").select("id").eq("event_id", event_id).eq("stand_id", stand_id).execute()
            if existing.data:
                raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain.")

        insert_data = {
            "event_id": event_id,
            "artisan_id": data.get("artisan_id"),
            "stand_id": stand_id,
            "status_request": "approved",
            "assigned_by": "admin"
        }
        res = supabase_admin.table("event_artisans").insert(insert_data).execute()
        if not res.data:
            raise HTTPException(500, "Gagal assign artisan")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error assigning artisan: {str(e)}")


def update_event_artisan(event_id: str, artisan_id: str, data: dict):
    """Update artisan assignment."""
    try:
        update_data = {k: v for k, v in data.items() if v is not None}
        
        stand_id = update_data.get("stand_id")
        if stand_id:
            existing = supabase_admin.table("event_artisans").select("artisan_id").eq("event_id", event_id).eq("stand_id", stand_id).execute()
            if existing.data and existing.data[0].get("artisan_id") != artisan_id:
                raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain.")

        res = supabase_admin.table("event_artisans").update(update_data).eq("artisan_id", artisan_id).eq("event_id", event_id).execute()
        if not res.data:
            raise HTTPException(404, "Artisan assignment tidak ditemukan")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating artisan: {str(e)}")


def remove_artisan(event_id: str, artisan_id: str):
    """Remove artisan from event."""
    try:
        res = supabase_admin.table("event_artisans").delete().eq("artisan_id", artisan_id).eq("event_id", event_id).execute()
        return {"message": "Artisan removed"}
    except Exception as e:
        raise HTTPException(500, f"Error removing artisan: {str(e)}")


# Artisan request handling

def get_artisan_requests(event_id: str):
    """Get pending artisan self-join requests."""
    try:
        res = supabase_admin.table("artisan_requests").select("*").eq("event_id", event_id).neq("status_request", "rejected").execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(500, f"Error fetching artisan requests: {str(e)}")


def respond_artisan_request(event_id: str, request_id: str, action: str):
    """Approve or reject artisan request."""
    try:
        if action == "approve":
            # Move to event_artisans
            req_res = supabase_admin.table("artisan_requests").select("*").eq("id", request_id).single().execute()
            if not req_res.data:
                raise HTTPException(404, "Request tidak ditemukan")

            req = req_res.data
            stand_id = req.get("posisi_event")
            
            if stand_id:
                existing = supabase_admin.table("event_artisans").select("id").eq("event_id", event_id).eq("stand_id", stand_id).execute()
                if existing.data:
                    raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain. Mohon tolak atau minta ganti posisi.")

            insert_data = {
                "event_id": event_id,
                "artisan_id": req.get("artisan_id"),
                "stand_id": stand_id,
                "status_request": "approved",
                "assigned_by": "self"
            }
            supabase_admin.table("event_artisans").insert(insert_data).execute()
            # Delete request
            supabase_admin.table("artisan_requests").delete().eq("id", request_id).execute()
            return {"message": "Request approved"}
        else:  # reject
            # Hard delete to allow re-request
            supabase_admin.table("artisan_requests").delete().eq("id", request_id).execute()
            return {"message": "Request rejected"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error responding to request: {str(e)}")


# Kolaborator request handling

def get_kolaborator_requests(event_id: str):
    """Get pending kolaborator self-join requests."""
    try:
        res = supabase_admin.table("event_kolaborators").select("*").eq("event_id", event_id).eq("assigned_by", "self").execute()
        # Filter to "pending" status
        return [k for k in (res.data or []) if k.get("status_kehadiran") == "terdaftar"]
    except Exception as e:
        raise HTTPException(500, f"Error fetching kolaborator requests: {str(e)}")


def respond_kolaborator_request(event_id: str, request_id: str, action: str):
    """Approve or reject kolaborator request."""
    try:
        if action == "approve":
            supabase_admin.table("event_kolaborators").update({"status_kehadiran": "terdaftar"}).eq("id", request_id).execute()
            return {"message": "Request approved"}
        else:  # reject
            supabase_admin.table("event_kolaborators").delete().eq("id", request_id).execute()
            return {"message": "Request rejected"}
    except Exception as e:
        raise HTTPException(500, f"Error responding to request: {str(e)}")


def get_active_event():
    """Get currently active event."""
    try:
        res = supabase_admin.table("events").select("*").eq("status", "active").single().execute()
        return res.data
    except Exception:
        return None
