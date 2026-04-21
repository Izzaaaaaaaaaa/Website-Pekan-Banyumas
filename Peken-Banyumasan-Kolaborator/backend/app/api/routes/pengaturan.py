from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.settings_service import get_settings

router = APIRouter(prefix="/pengaturan", tags=["Pengaturan"])


@router.get("")
def settings(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_settings(user)}
