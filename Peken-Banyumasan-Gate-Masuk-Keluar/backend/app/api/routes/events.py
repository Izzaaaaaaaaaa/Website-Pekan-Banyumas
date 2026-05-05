from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user

# SERVICES
from app.services.event_service import (
    get_events,
    get_event_by_id,
    create_event,
    update_event,
    delete_event,
    get_event_detail,
    get_active_event,
    set_active_event  # 🔥 TAMBAHAN
)

# SCHEMAS
from app.schemas.event_schema import (
    EventCreate,
    EventUpdate,
    EventDetailResponse
)

router = APIRouter(prefix="/events", tags=["Events"])


# =========================
# 🔥 ACTIVE EVENT (HARUS PALING ATAS)
# =========================
@router.get("/active")
def active_event(user=Depends(get_current_user)):
    event = get_active_event()

    if not event:
        raise HTTPException(404, "Tidak ada event aktif")

    return event


# =========================
# 🔥 EVENT DETAIL
# =========================
@router.get("/{id}/detail", response_model=EventDetailResponse)
def detail(id: str, user=Depends(get_current_user)):
    return get_event_detail(id)


# =========================
# GET ALL EVENTS
# =========================
@router.get("/")
def get_all(user=Depends(get_current_user)):
    return get_events()


# =========================
# GET EVENT BY ID (HARUS DI BAWAH)
# =========================
@router.get("/{id}")
def get_one(id: str, user=Depends(get_current_user)):
    return get_event_by_id(id)


# =========================
# CREATE EVENT
# =========================
@router.post("/")
def create(data: EventCreate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh membuat event")

    return create_event(data.dict())


# =========================
# UPDATE EVENT
# =========================
@router.put("/{id}")
def update(id: str, data: EventUpdate, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh update event")

    clean_data = data.dict(exclude_none=True)

    if not clean_data:
        raise HTTPException(400, "Tidak ada data yang diupdate")

    return update_event(id, clean_data)


# =========================
# 🔥 ACTIVATE EVENT (PENTING BANGET)
# =========================
@router.patch("/{id}/activate")
def activate_event(id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh mengaktifkan event")

    return set_active_event(id)


# =========================
# DELETE EVENT
# =========================
@router.delete("/{id}")
def delete(id: str, user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Hanya admin yang boleh hapus event")

    return delete_event(id)