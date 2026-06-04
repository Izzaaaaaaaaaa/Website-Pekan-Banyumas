from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.notifikasi import MarkReadSchema
from app.services import notifikasi_service
from app.models.model import NotifikasiItem, MessageResponse
from app.middleware import get_current_user
from typing import List

router = APIRouter(prefix="/notifikasi", tags=["Notifikasi"])


@router.get("", response_model=List[NotifikasiItem])
def get_notifikasi(user=Depends(get_current_user)):
    return notifikasi_service.get_notifikasi(user["sub"])


@router.post("/read", response_model=NotifikasiItem)
def mark_read(body: MarkReadSchema, user=Depends(get_current_user)):
    try:
        return notifikasi_service.mark_read(user["sub"], body.notif_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/read-all", response_model=MessageResponse)
def mark_all_read(user=Depends(get_current_user)):
    return notifikasi_service.mark_all_read(user["sub"])
