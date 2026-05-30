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
        .in_("status", ["published", "berlangsung", "selesai"])
        .order("tanggal", desc=True)
        .execute()
    )
    events = result.data or []

    # Frontend Kolaborator uses status vocabulary: upcoming|berlangsung|selesai.
    for ev in events:
        if ev.get("status") == "published":
            ev["status"] = "upcoming"

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

    # Also consider direct registrations (admin-assigned) in event_kolaborators.
    regs_result = (
        client.table("event_kolaborators")
        .select("event_id, peran, status_kehadiran")
        .eq("kolaborator_id", user_id)
        .neq("status_kehadiran", "dibatalkan")
        .execute()
    )
    regs = regs_result.data or []
    reg_by_event = {r["event_id"]: r for r in regs if r.get("event_id")}

    for ev in events:
        ev_id = ev.get("id")
        req = req_by_event.get(ev_id)
        reg = reg_by_event.get(ev_id)

        if req:
            status = req.get("status", "pending")
            ev["pending_request"] = status == "pending"
            ev["pending_peran"] = req.get("peran")
            ev["terdaftar"] = status == "approved"
            ev["peran"] = req.get("peran")
        elif reg:
            ev["pending_request"] = False
            ev["terdaftar"] = True
            ev["peran"] = reg.get("peran")
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

    data = result.data[0]
    if data.get("status") == "published":
        data["status"] = "upcoming"
    return data


def request_event_join(user_payload: dict, event_id: str, peran: str) -> dict:
    """POST /api/events/{id}/kolaborator-requests — request to join event.

    Rules:
      - If already registered (event_kolaborators) → block.
      - If already has pending/approved request → block.
      - If last request was rejected → allow re-request.
    """
    user_id = user_payload.get("user_id")
    if not user_id:
        return {"error": "Unauthorized"}

    peran = (peran or "peserta").strip().lower()
    if peran not in {"peserta", "performer"}:
        peran = "peserta"

    client = supabase_admin or supabase

    # 1) Already registered (e.g., admin assigned) → cannot request again.
    existing_reg = (
        client.table("event_kolaborators")
        .select("id, status_kehadiran")
        .eq("event_id", event_id)
        .eq("kolaborator_id", user_id)
        .limit(1)
        .execute()
    )
    if existing_reg.data and (existing_reg.data[0].get("status_kehadiran") != "dibatalkan"):
        return {"error": "Anda sudah terdaftar di event ini", "status_code": 409}

    # 2) Existing request → block if pending/approved.
    existing_req = (
        client.table("kolaborator_requests")
        .select("id, status")
        .eq("event_id", event_id)
        .eq("kolaborator_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if existing_req.data:
        last_status = (existing_req.data[0].get("status") or "pending").strip().lower()
        if last_status in {"pending", "approved"}:
            return {"error": "Anda sudah mengirim permintaan untuk event ini", "status_code": 409}

    insert_data = {
        "event_id": event_id,
        "kolaborator_id": user_id,
        "peran": peran,
        "status": "pending",
    }
    result = client.table("kolaborator_requests").insert(insert_data).execute()
    if result.data:
        return {
            "id": result.data[0].get("id"),
            "status": "pending",
            "peran": peran,
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
