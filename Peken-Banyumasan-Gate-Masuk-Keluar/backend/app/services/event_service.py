from app.db.supabase import supabase
from fastapi import HTTPException
from app.schemas.event_schema import EventResponse


# GET ALL EVENTS
def get_events():
    res = supabase.table("events") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    return [EventResponse(**e) for e in res.data]


# GET EVENT BY ID
def get_event_by_id(event_id: str):
    res = supabase.table("events") \
        .select("*") \
        .eq("id", event_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Event tidak ditemukan")

    return EventResponse(**res.data[0])


# CREATE EVENT
def create_event(data):
    res = supabase.table("events").insert({
        "nama": data["nama"],
        "deskripsi": data.get("deskripsi"),
        "lokasi": data.get("lokasi"),
        "tanggal_mulai": data.get("tanggal_mulai"),
        "tanggal_selesai": data.get("tanggal_selesai"),
        "jam_mulai": data.get("jam_mulai"),
        "jam_selesai": data.get("jam_selesai"),
        "kapasitas": data.get("kapasitas"),
        "status": data.get("status", "draft")
    }).execute()

    return {
        "message": "Event berhasil dibuat",
        "data": res.data
    }


# UPDATE EVENT
def update_event(event_id: str, data):
    res = supabase.table("events") \
        .update(data) \
        .eq("id", event_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Event tidak ditemukan atau gagal update")

    return {
        "message": "Event berhasil diupdate",
        "data": res.data
    }


# DELETE EVENT
def delete_event(event_id: str):
    res = supabase.table("events") \
        .delete() \
        .eq("id", event_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Event tidak ditemukan")

    return {"message": "Event berhasil dihapus"}