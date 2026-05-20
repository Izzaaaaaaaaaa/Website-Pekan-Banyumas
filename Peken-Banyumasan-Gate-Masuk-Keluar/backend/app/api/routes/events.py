from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.api.deps import get_current_user, get_admin_only
from app.services import event_service
from app.schemas.event_schema import EventCreate, EventUpdate, Event
from app.utils.response import success_response, error_response
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/api/events", tags=["events-crud"])


@router.get("", response_model=dict)
def list_events(
    status: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """List all events."""
    try:
        events = event_service.list_events(status)
        return success_response(events)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}", response_model=dict)
def get_event(
    id: str,
    user=Depends(get_current_user)
):
    """Get event details."""
    try:
        event = event_service.get_event(id)
        return success_response(event)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("", response_model=dict)
def create_event(
    data: EventCreate,
    user=Depends(get_admin_only)
):
    """Create new event (admin only)."""
    try:
        event = event_service.create_event(jsonable_encoder(data))
        return success_response(event, message="Event berhasil dibuat")
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.put("/{id}", response_model=dict)
def update_event(
    id: str,
    data: EventUpdate,
    user=Depends(get_admin_only)
):
    """Update event (admin only)."""
    try:
        clean_data = jsonable_encoder(data, exclude_none=True)
        if not clean_data:
            return success_response(None, message="Tidak ada data yang diupdate")

        event = event_service.update_event(id, clean_data)
        return success_response(event, message="Event berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/status", response_model=dict)
def update_event_status(
    id: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Update event status (admin only)."""
    try:
        status = data.get("status")
        if not status:
            raise HTTPException(422, detail=error_response(
                "status wajib diisi",
                422,
                {"status": ["status wajib diisi"]}
            ))

        event = event_service.update_event(id, {"status": status})
        return success_response(event, message="Status event berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.delete("/{id}", response_model=dict)
def delete_event(
    id: str,
    user=Depends(get_admin_only)
):
    """Delete event (admin only)."""
    try:
        event_service.delete_event(id)
        return success_response(None, message="Event berhasil dihapus")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


# ── Event ↔ Kolaborator relations ─────────────────

@router.get("/{id}/kolaborator", response_model=dict)
def get_event_kolaborators(
    id: str,
    user=Depends(get_current_user)
):
    """Get kolaborators assigned to event."""
    try:
        kolabs = event_service.get_event_kolaborators(id)
        return success_response(kolabs)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("/{id}/kolaborator", response_model=dict)
def assign_kolaborator(
    id: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Assign kolaborator to event (admin only)."""
    try:
        result = event_service.assign_kolaborator(id, data)
        return success_response(result, message="Kolaborator berhasil diassign ke event")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/kolaborator/{kid}", response_model=dict)
def update_event_kolaborator(
    id: str,
    kid: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Update kolaborator assignment (admin only)."""
    try:
        result = event_service.update_event_kolaborator(id, kid, data)
        return success_response(result, message="Kolaborator berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.delete("/{id}/kolaborator/{kid}", response_model=dict)
def remove_kolaborator(
    id: str,
    kid: str,
    user=Depends(get_admin_only)
):
    """Remove kolaborator from event (admin only)."""
    try:
        event_service.remove_kolaborator(id, kid)
        return success_response(None, message="Kolaborator berhasil dihapus dari event")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


# ── Event ↔ Artisan relations ────────────────────

@router.get("/{id}/artisan", response_model=dict)
def get_event_artisans(
    id: str,
    user=Depends(get_current_user)
):
    """Get artisans assigned to event."""
    try:
        artisans = event_service.get_event_artisans(id)
        return success_response(artisans)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("/{id}/artisan", response_model=dict)
def assign_artisan(
    id: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Assign artisan to event (admin only)."""
    try:
        result = event_service.assign_artisan(id, data)
        return success_response(result, message="Artisan berhasil diassign ke event")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/artisan/{aid}", response_model=dict)
def update_event_artisan(
    id: str,
    aid: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Update artisan assignment (admin only)."""
    try:
        result = event_service.update_event_artisan(id, aid, data)
        return success_response(result, message="Artisan berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.delete("/{id}/artisan/{aid}", response_model=dict)
def remove_artisan(
    id: str,
    aid: str,
    user=Depends(get_admin_only)
):
    """Remove artisan from event (admin only)."""
    try:
        event_service.remove_artisan(id, aid)
        return success_response(None, message="Artisan berhasil dihapus dari event")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


# ── Artisan request approval ──────────────────────

@router.get("/{id}/artisan-requests", response_model=dict)
def get_artisan_requests(
    id: str,
    user=Depends(get_admin_only)
):
    """Get pending artisan self-join requests (admin only)."""
    try:
        requests = event_service.get_artisan_requests(id)
        return success_response(requests)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/artisan-requests/{rid}", response_model=dict)
def respond_artisan_request(
    id: str,
    rid: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Approve or reject artisan request (admin only)."""
    try:
        action = data.get("action")
        if action not in ["approve", "reject"]:
            raise HTTPException(422, detail=error_response(
                "action harus 'approve' atau 'reject'",
                422,
                {"action": ["action harus 'approve' atau 'reject'"]}
            ))

        result = event_service.respond_artisan_request(id, rid, action)
        return success_response(result, message=f"Permintaan artisan berhasil {action}d")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


# ── Kolaborator request approval ──────────────────

@router.get("/{id}/kolaborator-requests", response_model=dict)
def get_kolaborator_requests(
    id: str,
    user=Depends(get_admin_only)
):
    """Get pending kolaborator self-join requests (admin only)."""
    try:
        requests = event_service.get_kolaborator_requests(id)
        return success_response(requests)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/kolaborator-requests/{rid}", response_model=dict)
def respond_kolaborator_request(
    id: str,
    rid: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Approve or reject kolaborator request (admin only)."""
    try:
        action = data.get("action")
        if action not in ["approve", "reject"]:
            raise HTTPException(422, detail=error_response(
                "action harus 'approve' atau 'reject'",
                422,
                {"action": ["action harus 'approve' atau 'reject'"]}
            ))

        result = event_service.respond_kolaborator_request(id, rid, action)
        return success_response(result, message=f"Permintaan kolaborator berhasil {action}d")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
