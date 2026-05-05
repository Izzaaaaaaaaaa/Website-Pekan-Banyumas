from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.deps import get_current_user
from app.services.story_service import get_stories

router = APIRouter(prefix="/stories", tags=["Stories"])


@router.get("")
def list_stories(user: dict = Depends(get_current_user)):
    return JSONResponse(
        content={"status": "success", "message": None, "data": get_stories(user)},
    )
