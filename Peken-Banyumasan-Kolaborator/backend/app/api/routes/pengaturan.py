from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.utils import _envelope
from app.services.settings_service import get_settings

router = APIRouter(prefix="/pengaturan", tags=["Pengaturan"])


@router.get("")
def settings(user: dict = Depends(get_current_user)):
    """GET /api/pengaturan — return user-specific app settings."""
    return _envelope(get_settings(user))
