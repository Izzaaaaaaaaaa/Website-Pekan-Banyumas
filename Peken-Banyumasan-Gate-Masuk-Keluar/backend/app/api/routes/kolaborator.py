from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.api.deps import get_current_user, get_admin_only
from app.services import kolaborator_service
from app.schemas.kolaborator_schema import KolaboratorUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/kolaborator", tags=["kolaborator-management"])


@router.get("", response_model=dict)
def list_kolaborators(
    status: Optional[str] = Query(None),
    kota: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """List kolaborators."""
    try:
        kolabs = kolaborator_service.list_kolaborators(status, kota, q)
        return success_response(kolabs)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}", response_model=dict)
def get_kolaborator(id: str, user=Depends(get_current_user)):
    """Get kolaborator details."""
    try:
        kolab = kolaborator_service.get_kolaborator(id)
        return success_response(kolab)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}", response_model=dict)
def update_kolaborator(
    id: str,
    data: KolaboratorUpdate,
    user=Depends(get_admin_only)
):
    """Update kolaborator (admin only)."""
    try:
        kolab = kolaborator_service.update_kolaborator(id, data.dict(exclude_unset=True))
        return success_response(kolab, message="Kolaborator berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/status", response_model=dict)
def update_status(
    id: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Update kolaborator status (admin only)."""
    try:
        status = data.get("status")
        kolab = kolaborator_service.update_kolaborator_status(id, status)
        return success_response(kolab, message="Status berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/events", response_model=dict)
def get_events(id: str, user=Depends(get_current_user)):
    """Get events kolaborator is assigned to."""
    try:
        events = kolaborator_service.get_kolaborator_events(id)
        return success_response(events)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/stories", response_model=dict)
def get_stories(id: str, user=Depends(get_current_user)):
    """Get kolaborator's stories."""
    try:
        stories = kolaborator_service.get_kolaborator_stories(id)
        return success_response(stories)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/portofolio", response_model=dict)
def get_portofolio(id: str, user=Depends(get_current_user)):
    """Get kolaborator's portofolio."""
    try:
        portofolio = kolaborator_service.get_kolaborator_portofolio(id)
        return success_response(portofolio)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}/portofolio/{pid}", response_model=dict)
def feature_portofolio(
    id: str,
    pid: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Toggle featured status of portofolio (admin only)."""
    try:
        featured = data.get("featured", False)
        result = kolaborator_service.feature_kolaborator_portofolio(id, pid, featured)
        return success_response(result, message="Status featured berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.delete("/{id}/portofolio/{pid}", response_model=dict)
def delete_portofolio(
    id: str,
    pid: str,
    user=Depends(get_admin_only)
):
    """Delete a portofolio (admin only)."""
    try:
        kolaborator_service.delete_kolaborator_portofolio(id, pid)
        return success_response(None, message="Karya berhasil dihapus")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
