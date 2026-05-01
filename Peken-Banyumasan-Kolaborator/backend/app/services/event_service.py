from app.db.supabase import supabase


def get_events(user_payload: dict | None = None) -> list[dict]:
    events_result = supabase.table("events").select("*").order("created_at", desc=True).execute()
    raw_events = events_result.data or []

    events = []
    for ev in raw_events:
        events.append({
            **ev,
            "tanggal": ev.get("tanggal_mulai"),
            "tanggal_mulai": ev.get("tanggal_mulai"),
            "tanggal_selesai": ev.get("tanggal_selesai"),
            "peserta_count": ev.get("peserta_count", 0),
            "banner_url": ev.get("banner_url"),
            "subsektor": ev.get("subsektor") or [],
            "lineup": ev.get("lineup") or [],
            "artisan": ev.get("artisan") or [],
        })

    user_id = user_payload.get("user_id") if user_payload else None
    if not user_id:
        return events

    requests_result = (
        supabase.table("event_requests")
        .select("id, event_id, peran, status")
        .eq("user_id", user_id)
        .execute()
    )
    requests = requests_result.data or []
    req_by_event = {r["event_id"]: r for r in requests if r.get("event_id")}

    for ev in events:
        req = req_by_event.get(ev.get("id"))
        if req:
            status = req.get("status", "pending")
            ev["pending_request"] = status == "pending"
            ev["pending_peran"] = req.get("peran")
            ev["terdaftar"] = status in {"approved", "accepted", "joined"}
            ev["peran"] = req.get("peran")
        else:
            ev["pending_request"] = False
            ev["terdaftar"] = False

    return events


def get_event_detail(event_id: str) -> dict:
    result = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    if not result.data:
        return {}

    ev = result.data[0]
    return {
        **ev,
        "tanggal": ev.get("tanggal_mulai"),
        "tanggal_mulai": ev.get("tanggal_mulai"),
        "tanggal_selesai": ev.get("tanggal_selesai"),
        "peserta_count": ev.get("peserta_count", 0),
        "banner_url": ev.get("banner_url"),
        "subsektor": ev.get("subsektor") or [],
        "lineup": ev.get("lineup") or [],
        "artisan": ev.get("artisan") or [],
    }


def request_event_join(user_payload: dict, event_id: str, peran: str) -> dict:
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"error": "Unauthorized"}

    insert_data = {
        "event_id": event_id,
        "user_id": user_id,
        "peran": peran,
        "status": "pending",
    }
    result = supabase.table("event_requests").insert(insert_data).execute()
    return result.data[0] if result.data else {"status": "pending", "event_id": event_id, "peran": peran}


def get_my_requests(user_payload: dict) -> list[dict]:
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    result = supabase.table("event_requests").select("event_id, peran, status").eq("user_id", user_id).execute()
    return result.data or []
