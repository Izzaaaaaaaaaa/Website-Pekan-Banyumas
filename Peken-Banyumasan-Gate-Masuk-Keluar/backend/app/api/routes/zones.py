from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user, get_admin_only
from app.services import zone_service
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/zones", tags=["zones"])


@router.get("", response_model=dict)
def get_global_zones(user=Depends(get_current_user)):
    """Get global venue zone layout."""
    try:
        zones = zone_service.get_global_zones()
        return success_response(zones)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.put("", response_model=dict)
def save_global_zones(
    data: dict,
    user=Depends(get_admin_only)
):
    """Save global zone layout (admin only)."""
    try:
        zones = data.get("zones", [])
        result = zone_service.save_global_zones(zones)
        return success_response(None, message=result.get("message"))
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/events/{id}", response_model=dict)
def get_event_zones(id: str, user=Depends(get_current_user)):
    """Get zones for event with occupancy info."""
    try:
        zones = zone_service.get_event_zones(id)
        return success_response(zones)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
