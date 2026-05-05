"""
Event routes — Kolaborator event consumer slice.

Matches OpenAPI paths:
  GET  /api/events
  GET  /api/events/my-requests
  GET  /api/events/{id}
  POST /api/events/{id}/kolaborator-requests
"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.event_service import get_event_detail, get_events, get_my_requests, request_event_join

router = APIRouter(prefix="/events", tags=["Events"])


def _envelope(data, message: str | None = None, status_code: int = 200):
    return JSONResponse(
        status_code=status_code,
        content={"status": "success", "message": message, "data": data},
    )


def _error_envelope(message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={"status": "error", "message": message, "data": None},
    )


@router.get("")
def list_events(user: dict = Depends(get_current_user)):
    return _envelope(get_events(user))


@router.get("/my-requests")
def my_requests(user: dict = Depends(get_current_user)):
    return _envelope(get_my_requests(user))


@router.get("/{event_id}")
def detail(event_id: str, user: dict = Depends(get_current_user)):
    data = get_event_detail(event_id)
    if not data:
        return _error_envelope("Event tidak ditemukan", 404)
    return _envelope(data)


class JoinRequest(BaseModel):
    peran: str = "peserta"


@router.post("/{event_id}/kolaborator-requests")
def request_join(event_id: str, payload: JoinRequest, user: dict = Depends(get_current_user)):
    result = request_event_join(user, event_id, payload.peran)
    if "error" in result:
        status_code = result.get("status_code", 409)
        return _error_envelope(result["error"], status_code)
    return _envelope(
        result,
        message="Permintaan bergabung terkirim, menunggu persetujuan admin",
    )
