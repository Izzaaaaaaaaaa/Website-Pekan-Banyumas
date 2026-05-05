from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.deps import get_current_user
from app.services.profile_service import get_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("")
def profile(user: dict = Depends(get_current_user)):
    data = get_profile(user)
    return JSONResponse(
        content={"status": "success", "message": None, "data": data},
    )
