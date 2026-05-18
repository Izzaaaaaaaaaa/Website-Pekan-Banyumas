from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user, get_current_user_id
from app.services import notifikasi_service
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/notifikasi", tags=["notifikasi"])


@router.get("", response_model=dict)
def list_notifikasi(
    user=Depends(get_current_user),
    user_id: str = Depends(get_current_user_id)
):
    """Get notifications for current user."""
    try:
        notifikasi = notifikasi_service.list_notifikasi(user_id)
        return success_response(notifikasi)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/baca", response_model=dict)
def mark_read(
    id: str,
    user=Depends(get_current_user)
):
    """Mark notification as read."""
    try:
        notif = notifikasi_service.mark_notifikasi_read(id)
        return success_response(notif)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/baca-semua", response_model=dict)
def mark_all_read(
    user=Depends(get_current_user),
    user_id: str = Depends(get_current_user_id)
):
    """Mark all notifications as read."""
    try:
        result = notifikasi_service.mark_all_notifikasi_read(user_id)
        return success_response(None, message=result.get("message"))
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
