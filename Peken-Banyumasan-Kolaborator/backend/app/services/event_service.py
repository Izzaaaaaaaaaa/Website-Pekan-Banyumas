"""
Event service — Kolaborator event consumer slice.

Kolaborators can browse published/berlangsung events, view details,
request to join (kolaborator_requests), and list their own requests.
"""

from datetime import date

from app.db.supabase import supabase, supabase_admin


def _status_efektif(ev: dict) -> str:
    """Date-derived display status. Computed per-request, NEVER stored.

    Rules (per openapi-colab.yaml v2.4.2):
    - If DB status == 'selesai' → 'selesai'
    - If tanggal < today        → 'selesai'
    - If tanggal == today       → 'berlangsung'
    - Otherwise                 → raw status ('published' or 'berlangsung')
    """
    s, tgl = ev.get("status"), ev.get("tanggal")  # tanggal is 'YYYY-MM-DD'
    if s == "selesai":
        return "selesai"
    if tgl:
        today = date.today().isoformat()
        if tgl < today:
            return "selesai"
        if tgl == today:
            return "berlangsung"
    return s  # 'published' or 'berlangsung'


def get_events(user_payload: dict | None = None) -> list[dict]:
    """GET /api/events — list events scoped to published/berlangsung/selesai."""
    client = supabase_admin or supabase

    result = (
        client.table("events")
        .select("*")
        .in_("status", ["published", "berlangsung", "selesai"])
        .order("tanggal", desc=True)
        .execute()
    )
    events = result.data or []

    # status is sent RAW (the spec forbids renaming 'published').
    # status_efektif is the display derivation.
    for ev in events:
        ev["status_efektif"] = _status_efektif(ev)

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
            ev["request_status"] = status               # new contract (spec)
            ev["pending_request"] = status == "pending"  # transitional; drop later
            ev["pending_peran"] = req.get("peran")       # transitional; drop later
            ev["terdaftar"] = status == "approved"
            ev["peran"] = req.get("peran")
        elif reg:
            ev["request_status"] = None
            ev["pending_request"] = False
            ev["terdaftar"] = True
            ev["peran"] = reg.get("peran")
        else:
            ev["request_status"] = None
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
    # Do NOT rename status. Only add the display derivation.
    data["status_efektif"] = _status_efektif(data)
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
        # Notifikasi: admin diberi tahu ada permintaan baru (inbox DB, bukan
        # hanya badge lokal di Gate), requester dapat konfirmasi terkirim.
        try:
            from app.services.notification_service import create_notifikasi, notify_admins
            ev = client.table("events").select("nama").eq("id", event_id).limit(1).execute()
            ev_nama = (ev.data[0].get("nama") if ev.data else None) or "event"
            kol = client.table("kolaborators").select("nama").eq("id", user_id).limit(1).execute()
            kol_nama = (kol.data[0].get("nama") if kol.data else None) or "Kolaborator"
            notify_admins("event_request",
                          "Permintaan bergabung baru",
                          f"{kol_nama} mengajukan bergabung sebagai {peran} di event '{ev_nama}'.")
            create_notifikasi(user_id, "event_request_sent",
                              "Permintaan terkirim",
                              f"Permintaan bergabung di event '{ev_nama}' terkirim — menunggu konfirmasi admin.",
                              link="/event")
        except Exception:
            pass
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
