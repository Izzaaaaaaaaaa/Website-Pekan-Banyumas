from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.utils import _envelope
from app.services.notification_service import get_notifications, mark_all_read, mark_notification_read

router = APIRouter(prefix="/notifikasi", tags=["Notifikasi"])




@router.get("")
def notifications(user: dict = Depends(get_current_user)):
    return _envelope(get_notifications(user))


@router.patch("/{notif_id}/baca")
def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    return _envelope(
        mark_notification_read(user, notif_id),
        message="Notifikasi ditandai sudah dibaca",
    )


@router.patch("/baca-semua")
def mark_read_all(user: dict = Depends(get_current_user)):
    return _envelope(
        mark_all_read(user),
        message="Semua notifikasi ditandai sudah dibaca",
    )
