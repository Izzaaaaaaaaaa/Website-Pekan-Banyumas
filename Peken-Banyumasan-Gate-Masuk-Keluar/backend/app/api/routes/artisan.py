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


@router.get("/{id}/kas", response_model=dict)
def get_kas(
    id: str, 
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    user=Depends(get_admin_only)
):
    """Get artisan cashflow."""
    try:
        kas = artisan_service.get_artisan_kas(id, from_date, to_date)
        return success_response(kas)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/riwayat", response_model=dict)
def get_riwayat(
    id: str, 
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    user=Depends(get_admin_only)
):
    """Get artisan transaction history."""
    try:
        riwayat = artisan_service.get_artisan_riwayat(id, from_date, to_date)
        return success_response(riwayat)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/promo", response_model=dict)
def get_promo(id: str, user=Depends(get_admin_only)):
    """Get artisan promos."""
    try:
        promo = artisan_service.get_artisan_promo(id)
        return success_response(promo)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}/stok", response_model=dict)
def get_stok(id: str, user=Depends(get_admin_only)):
    """Get artisan inventory."""
    try:
        stok = artisan_service.get_artisan_stok(id)
        return success_response(stok)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))

@router.get("/{id}/requests", response_model=dict)
def get_artisan_requests(id: str, user=Depends(get_current_user)):
    """Get artisan's pending event requests."""
    try:
        requests = artisan_service.get_artisan_requests(id)
        return success_response(requests)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
