from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.notification_service import get_notifications

router = APIRouter(prefix="/notifikasi", tags=["Notifikasi"])


@router.get("")
def notifications(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_notifications(user)}
