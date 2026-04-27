from app.db.supabase import supabase
from fastapi import HTTPException
from app.schemas.event_schema import EventResponse
from datetime import date


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

def get_event_detail(event_id: str):
    # 1. ambil event
    event_res = supabase.table("events") \
        .select("*") \
        .eq("id", event_id) \
        .single() \
        .execute()

    if not event_res.data:
        return {"error": "Event tidak ditemukan"}

    event = event_res.data

    # 2. ambil logs
    logs = supabase.table("gate_logs") \
        .select("id, gate_type, scan_time, users(nama)") \
        .eq("event_id", event_id) \
        .order("scan_time", desc=True) \
        .limit(10) \
        .execute().data

    # 3. hitung stats
    total_masuk = sum(1 for l in logs if l["gate_type"] == "masuk")
    total_keluar = sum(1 for l in logs if l["gate_type"] == "keluar")

    # 4. format activity
    activities = []
    for log in logs:
        activities.append({
            "id": log["id"],
            "gate_type": log["gate_type"],
            "scan_time": log["scan_time"],
            "nama": log["users"]["nama"] if log.get("users") else None
        })

    return {
        "id": event["id"],
        "nama": event["nama"],
        "deskripsi": event.get("deskripsi"),
        "lokasi": event.get("lokasi"),
        "tanggal_mulai": event.get("tanggal_mulai"),
        "tanggal_selesai": event.get("tanggal_selesai"),
        "status": event.get("status"),

        "stats": {
            "total_masuk": total_masuk,
            "total_keluar": total_keluar,
            "di_dalam": total_masuk - total_keluar
        },

        "activities": activities
    }

def get_active_event():
    today = date.today().isoformat()

    res = supabase.table("events") \
        .select("*") \
        .lte("tanggal_mulai", today) \
        .gte("tanggal_selesai", today) \
        .limit(1) \
        .execute()

    if not res.data:
        return None

    return res.data[0]


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