from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.event import DaftarEventSchema, ChangeStandSchema
from app.services import event_service
from app.models.model import EventItem, ArtisanRequestItem, MessageResponse
from app.middleware import get_current_user
from typing import List

router = APIRouter(prefix="/event", tags=["Event"])


@router.get("", response_model=List[EventItem])
def get_events():
    """Daftar event published/berlangsung/selesai — publik, tidak perlu login."""
    return event_service.get_all_events()


@router.get("/saya")
def get_event_saya(user=Depends(get_current_user)):
    """Semua request + registrasi event milik artisan ini."""
    return event_service.get_registrasi_artisan(user["sub"])


@router.get("/{event_id}/stands")
def get_stands(event_id: str):
    """Ketersediaan stand per event — cross-ref zones.stands[].id."""
    return event_service.get_stand_availability(event_id)


@router.post("/daftar", response_model=ArtisanRequestItem, status_code=status.HTTP_201_CREATED)
def daftar_event(body: DaftarEventSchema, user=Depends(get_current_user)):
    """
    Artisan mendaftar ke event → insert ke artisan_requests (status: pending).
    Admin yang approve/reject → pindah ke event_artisans.
    """
    try:
        return event_service.daftar_event(user["sub"], body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/ubah-stand")
def ubah_stand(body: ChangeStandSchema, user=Depends(get_current_user)):
    """
    Artisan minta ubah posisi stand (hanya jika sudah approved).
    Set status_request='pending_change' di event_artisans.
    """
    try:
        return event_service.request_change_stand(user["sub"], body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
