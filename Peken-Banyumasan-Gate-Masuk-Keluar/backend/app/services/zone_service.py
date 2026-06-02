from app.db.supabase import supabase_admin
from fastapi import HTTPException


def get_global_zones():
    """Get global venue zone layout."""
    try:
        res = supabase_admin.table("zones").select("*").execute()
        return res.data or []

    except Exception as e:
        raise HTTPException(500, f"Error fetching zones: {str(e)}")


def save_global_zones(zones: list):
    """Save global venue zone layout."""
    try:
        # Delete all existing zones
        supabase_admin.table("zones").delete().neq("id", "").execute()

        # Insert new zones
        if zones:
            supabase_admin.table("zones").insert(zones).execute()

        return {"message": "Zone layout berhasil disimpan"}

    except Exception as e:
        raise HTTPException(500, f"Error saving zones: {str(e)}")


def get_event_zones(event_id: str):
    """Get zones for an event with occupancy info."""
    try:
        # Get all zones
        zones_res = supabase_admin.table("zones").select("*").execute()
        zones = zones_res.data or []

        # Get occupancy for this event
        artisans_res = supabase_admin.table("event_artisans") \
            .select("stand_id, artisan_id, artisans(nama_usaha)") \
            .eq("event_id", event_id) \
            .eq("status_request", "approved") \
            .execute()

        # Build occupancy map: stand_id → artisan info
        occupied_map = {}
        for a in (artisans_res.data or []):
            stand_id = a.get("stand_id")
            if stand_id:
                artisan_info = a.get("artisans") or {}
                occupied_map[stand_id] = {
                    "artisan_id": a.get("artisan_id"),
                    "nama_usaha": artisan_info.get("nama_usaha", "—")
                }

        # Add occupancy info to zones
        for zone in zones:
            stands = zone.get("stands", [])
            for stand in stands:
                stand_id = stand.get("id")
                if stand_id and stand_id in occupied_map:
                    stand["occupied"] = True
                    stand["artisan"] = occupied_map[stand_id]
                else:
                    stand["occupied"] = False

        return zones

    except Exception as e:
        raise HTTPException(500, f"Error fetching event zones: {str(e)}")


def assign_artisan_stand(event_id: str, artisan_id: str, stand_id: str):
    """Assign artisan to a stand."""
    try:
        # Check if stand is already occupied by another artisan
        existing = supabase_admin.table("event_artisans") \
            .select("artisan_id") \
            .eq("event_id", event_id) \
            .eq("stand_id", stand_id) \
            .execute()

        if existing.data:
            existing_artisan = existing.data[0].get("artisan_id")
            if existing_artisan != artisan_id:
                raise HTTPException(400, f"Posisi {stand_id} sudah ditempati oleh usaha lain.")

        # Check if artisan is already assigned to event
        res = supabase_admin.table("event_artisans") \
            .select("*") \
            .eq("event_id", event_id) \
            .eq("artisan_id", artisan_id) \
            .single() \
            .execute()

        if not res.data:
            raise HTTPException(404, "Artisan tidak terdaftar di event ini")

        # Update stand assignment
        supabase_admin.table("event_artisans") \
            .update({"stand_id": stand_id}) \
            .eq("event_id", event_id) \
            .eq("artisan_id", artisan_id) \
            .execute()

        return {"message": "Stand berhasil diassign"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error assigning stand: {str(e)}")
