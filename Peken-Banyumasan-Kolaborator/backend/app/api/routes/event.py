from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.event_service import get_events

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("")
def list_events(_: dict = Depends(get_current_user)) -> dict:
    return {"data": get_events()}
