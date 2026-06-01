import uuid
from app.db.supabase import db_select, db_insert, db_update
from app.schemas.event import DaftarEventSchema, ChangeStandSchema


def get_all_events() -> list:
    """
    Ambil event dengan status published | berlangsung | selesai.
    'upcoming' BUKAN status valid di DB — tidak dipakai.
    """
    events = db_select("events")
    return [e for e in events if e.get("status") in {"published", "berlangsung", "selesai"}]


def get_event_by_id(event_id: str) -> dict:
    return db_select("events", filters={"id": event_id}, single=True)


def get_registrasi_artisan(artisan_id: str) -> list:
    """
    Gabungkan artisan_requests (pending) + event_artisans (approved/rejected).
    Keduanya ditampilkan di tab 'Usaha Saya' di frontend.
    """
    requests  = db_select("artisan_requests",  filters={"artisan_id": artisan_id})
    approved  = db_select("event_artisans",    filters={"artisan_id": artisan_id})
    return requests + approved


def daftar_event(artisan_id: str, body: DaftarEventSchema) -> dict:
    """
    Insert ke artisan_requests (bukan langsung ke event_artisans).
    UNIQUE (event_id, artisan_id) — backend hard-delete rejected rows untuk allow re-request.
    Stand validity di-cross-check ke zones.stands[].id.
    """
    # cek sudah ada request pending/approved
    existing = db_select(
        "artisan_requests",
        filters={"event_id": body.event_id, "artisan_id": artisan_id},
        single=True,
    )
    if existing:
        raise ValueError("Kamu sudah punya request untuk event ini")

    # cek sudah approved di event_artisans
    approved = db_select(
        "event_artisans",
        filters={"event_id": body.event_id, "artisan_id": artisan_id},
        single=True,
    )
    if approved:
        raise ValueError("Kamu sudah terdaftar di event ini")

    # validasi stand tersedia (cross-ref zones.stands[].id)
    _validate_stand(body.event_id, body.posisi_event)

    event = get_event_by_id(body.event_id)
    if not event:
        raise ValueError("Event tidak ditemukan")

    data = {
        "id": str(uuid.uuid4()),
        "event_id": body.event_id,
        "artisan_id": artisan_id,
        "posisi_event": body.posisi_event,
        "status_request": "pending",
        "assigned_by": "self",
    }
    return db_insert("artisan_requests", data)


def request_change_stand(artisan_id: str, body: ChangeStandSchema) -> dict:
    """
    Artisan minta ubah posisi stand.
    Hanya bisa jika status_request='approved' di event_artisans.
    Set status_request='pending_change' dan isi change_request.
    """
    reg = db_select(
        "event_artisans",
        filters={"id": body.artisan_request_id, "artisan_id": artisan_id},
        single=True,
    )
    if not reg:
        raise ValueError("Data registrasi tidak ditemukan")

    if reg.get("status_request") != "approved":
        raise ValueError("Hanya registrasi yang sudah disetujui yang bisa minta ubah stand")

    result = db_update(
        "event_artisans",
        {"id": body.artisan_request_id},
        {
            "change_request": body.posisi_baru,
            "status_request": "pending_change",
        },
    )
    return result[0] if result else {}


def get_stand_availability(event_id: str) -> list:
    """
    Kembalikan semua zone + stands dengan flag occupied.
    Stand occupied = ada di event_artisans WHERE status_request='approved'.
    """
    zones = db_select("zones")

    # ambil stand yang sudah terisi (approved)
    approved = db_select("event_artisans", filters={"event_id": event_id})
    occupied_stands = {
        r["stand_id"]
        for r in approved
        if r.get("status_request") == "approved" and r.get("stand_id")
    }

    result = []
    for zone in zones:
        stands = zone.get("stands", [])
        for stand in stands:
            stand["occupied"] = stand["id"] in occupied_stands
        result.append({**zone, "stands": stands})

    return result


def _validate_stand(event_id: str, stand_id: str) -> None:
    """
    Validasi stand_id ada di zones.stands[].id dan belum terisi.
    Raises ValueError jika tidak valid.
    """
    zones = db_select("zones")
    all_stand_ids = {
        s["id"]
        for zone in zones
        for s in zone.get("stands", [])
    }
    if stand_id not in all_stand_ids:
        raise ValueError(f"Stand '{stand_id}' tidak ditemukan")

    # cek sudah terisi
    occupied = db_select(
        "event_artisans",
        filters={"event_id": event_id, "stand_id": stand_id},
        single=True,
    )
    if occupied and occupied.get("status_request") == "approved":
        raise ValueError(f"Stand '{stand_id}' sudah terisi, pilih stand lain")
