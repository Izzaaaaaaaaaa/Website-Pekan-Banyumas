from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.story_service import get_stories

router = APIRouter(prefix="/stories", tags=["Stories"])


@router.get("")
def list_stories(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_stories(user)}
