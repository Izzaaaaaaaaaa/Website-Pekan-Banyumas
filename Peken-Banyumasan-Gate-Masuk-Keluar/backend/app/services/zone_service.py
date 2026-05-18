from app.db.supabase import supabase
from fastapi import HTTPException


def get_global_zones():
    """Get global venue zone layout."""
    try:
        res = supabase.table("zones").select("*").execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error fetching zones: {str(e)}")


def save_global_zones(zones: list):
    """Save global venue zone layout."""
    try:
        # Delete all existing zones
        supabase.table("zones").delete().neq("id", "").execute()

        # Insert new zones
        for zone in zones:
            supabase.table("zones").insert(zone).execute()

        return {"message": "Zone layout berhasil disimpan"}

    except Exception as e:
        raise HTTPException(500, f"Error saving zones: {str(e)}")


def get_event_zones(event_id: str):
    """Get zones for an event with occupancy info."""
    try:
        # Get event's zone assignments
        zones_res = supabase.table("zones").select("*").execute()
        zones = zones_res.data or []

        # Get occupancy for this event
        occupancy = {}
        artisans_res = supabase.table("event_artisans") \
            .select("stand_id") \
            .eq("event_id", event_id) \
            .eq("status_request", "approved") \
            .execute()

        occupied_stands = [a.get("stand_id") for a in (artisans_res.data or [])]

        # Add occupancy info to zones
        for zone in zones:
            zone["occupied"] = occupied_stands

        return zones

    except Exception as e:
        raise HTTPException(500, f"Error fetching event zones: {str(e)}")


def assign_artisan_stand(event_id: str, artisan_id: str, stand_id: str):
    """Assign artisan to a stand."""
    try:
        # Check if artisan is already assigned to event
        res = supabase.table("event_artisans") \
            .select("*") \
            .eq("event_id", event_id) \
            .eq("artisan_id", artisan_id) \
            .single() \
            .execute()

        if not res.data:
            raise HTTPException(404, "Artisan tidak terdaftar di event ini")

        # Update stand assignment
        supabase.table("event_artisans") \
            .update({"stand_id": stand_id}) \
            .eq("event_id", event_id) \
            .eq("artisan_id", artisan_id) \
            .execute()

        return {"message": "Stand berhasil diassign"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error assigning stand: {str(e)}")
