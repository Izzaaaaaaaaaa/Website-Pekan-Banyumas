from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.profile_service import get_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("")
def profile(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_profile(user)}
