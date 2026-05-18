from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.api.deps import get_current_user, get_admin_only
from app.services import artisan_service
from app.schemas.artisan_schema import ArtisanUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/artisan", tags=["artisan-management"])


@router.get("", response_model=dict)
def list_artisans(
    status: Optional[str] = Query(None),
    kota: Optional[str] = Query(None),
    kategori: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """List artisans."""
    try:
        artisans = artisan_service.list_artisans(status, kota, kategori, q)
        return success_response(artisans)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}", response_model=dict)
def get_artisan(id: str, user=Depends(get_current_user)):
    """Get artisan details."""
    try:
        artisan = artisan_service.get_artisan(id)
        return success_response(artisan)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}", response_model=dict)
def update_artisan(
    id: str,
    data: ArtisanUpdate,
    user=Depends(get_admin_only)
):
    """Update artisan (admin only)."""
    try:
        artisan = artisan_service.update_artisan(id, data.dict(exclude_unset=True))
        return success_response(artisan, message="Artisan berhasil diupdate")
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
    """Update artisan status (admin only)."""
    try:
        status = data.get("status")
        artisan = artisan_service.update_artisan_status(id, status)
        return success_response(artisan, message="Status berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/events", response_model=dict)
def get_events(id: str, user=Depends(get_current_user)):
    """Get events artisan is assigned to."""
    try:
        events = artisan_service.get_artisan_events(id)
        return success_response(events)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/qris", response_model=dict)
def get_qris(id: str, user=Depends(get_current_user)):
    """Get artisan QRIS code."""
    try:
        qris = artisan_service.get_artisan_qris(id)
        return success_response(qris)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
