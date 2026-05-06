"""
Event service — Kolaborator event consumer slice.

Kolaborators can browse published/berlangsung events, view details,
request to join (kolaborator_requests), and list their own requests.
"""

from app.db.supabase import supabase, supabase_admin


def get_events(user_payload: dict | None = None) -> list[dict]:
    """GET /api/events — list events scoped to published/berlangsung."""
    client = supabase_admin or supabase

    result = (
        client.table("events")
        .select("*")
        .in_("status", ["published", "berlangsung"])
        .order("tanggal", desc=True)
        .execute()
    )
    events = result.data or []

    # Enrich with kolaborator's own request status
    user_id = user_payload.get("user_id") if user_payload else None
    if not user_id:
        return events

    requests_result = (
        client.table("kolaborator_requests")
        .select("id, event_id, peran, status")
        .eq("kolaborator_id", user_id)
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
            ev["terdaftar"] = status == "approved"
            ev["peran"] = req.get("peran")
        else:
            ev["pending_request"] = False
            ev["terdaftar"] = False

    return events


def get_event_detail(event_id: str) -> dict:
    """GET /api/events/{id} — event detail."""
    client = supabase_admin or supabase
    result = client.table("events").select("*").eq("id", event_id).limit(1).execute()
    if not result.data:
        return {}

    return result.data[0]


def request_event_join(user_payload: dict, event_id: str, peran: str) -> dict:
    """POST /api/events/{id}/kolaborator-requests — request to join event."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"error": "Unauthorized"}

    client = supabase_admin or supabase

    # Check for existing request (prevent duplicate)
    existing = (
        client.table("kolaborator_requests")
        .select("id, status")
        .eq("event_id", event_id)
        .eq("kolaborator_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return {"error": "Anda sudah mengirim permintaan untuk event ini", "status_code": 409}

    insert_data = {
        "event_id": event_id,
        "kolaborator_id": user_id,
        "peran": peran or "peserta",
        "status": "pending",
    }
    result = client.table("kolaborator_requests").insert(insert_data).execute()
    if result.data:
        return {
            "id": result.data[0].get("id"),
            "status": "pending",
            "peran": peran or "peserta",
        }
    return {"status": "pending", "event_id": event_id, "peran": peran}


def get_my_requests(user_payload: dict) -> list[dict]:
    """GET /api/events/my-requests — list own event join request history."""
    user_id = user_payload.get("user_id")
    if not user_id:
        return []

    client = supabase_admin or supabase
    result = (
        client.table("kolaborator_requests")
        .select("event_id, peran, status")
        .eq("kolaborator_id", user_id)
        .execute()
    )
    return result.data or []
