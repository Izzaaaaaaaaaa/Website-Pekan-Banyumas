from app.db.supabase import supabase

# GET ALL EVENTS
def get_events():
    res = supabase.table("events") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    return res.data


# GET EVENT BY ID
def get_event_by_id(event_id: str):
    res = supabase.table("events") \
        .select("*") \
        .eq("id", event_id) \
        .single() \
        .execute()

    return res.data


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

    return res.data


def update_event(event_id: str, data):
    try:
        print("EVENT ID:", event_id)
        print("DATA:", data)

        res = supabase.table("events") \
            .update(data) \
            .eq("id", event_id) \
            .execute()

        print("RESPONSE:", res)

        # ❗ kalau tidak ada data yang keupdate
        if not res.data:
            return {
                "error": "Event tidak ditemukan atau gagal update"
            }

        return {
            "message": "Event berhasil diupdate",
            "data": res.data
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            "error": "Server error",
            "detail": str(e)
        }


# DELETE EVENT
def delete_event(event_id: str):
    supabase.table("events") \
        .delete() \
        .eq("id", event_id) \
        .execute()

    return {"message": "Event berhasil dihapus"}