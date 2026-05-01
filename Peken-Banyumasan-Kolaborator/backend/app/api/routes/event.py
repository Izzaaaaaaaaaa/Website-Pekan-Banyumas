from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.event_service import get_event_detail, get_events, get_my_requests, request_event_join

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("")
def list_events(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_events(user)}


@router.get("/my-requests")
def my_requests(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_my_requests(user)}


@router.get("/{event_id}")
def detail(event_id: str, _: dict = Depends(get_current_user)) -> dict:
    return {"data": get_event_detail(event_id)}


class JoinRequest(BaseModel):
    peran: str = "peserta"


@router.post("/{event_id}/kolaborator-requests")
def request_join(event_id: str, payload: JoinRequest, user: dict = Depends(get_current_user)) -> dict:
    return {"data": request_event_join(user, event_id, payload.peran)}
