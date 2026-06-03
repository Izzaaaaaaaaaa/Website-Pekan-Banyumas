from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.api.deps import get_current_user, get_admin_only
from app.services import petugas_service
from app.schemas.petugas_schema import PetugasCreate, PetugasUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/petugas", tags=["petugas"])


@router.get("", response_model=dict)
def list_petugas(
    status: Optional[str] = Query(None),
    user=Depends(get_admin_only)
):
    """List petugas accounts (admin only)."""
    try:
        petugas = petugas_service.list_petugas(status)
        return success_response(petugas)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/{id}", response_model=dict)
def get_petugas(id: str, user=Depends(get_admin_only)):
    """Get petugas details (admin only)."""
    try:
        petugas = petugas_service.get_petugas(id)
        return success_response(petugas)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("", response_model=dict)
def create_petugas(
    data: PetugasCreate,
    user=Depends(get_admin_only)
):
    """Create petugas account (admin only)."""
    try:
        petugas = petugas_service.create_petugas(
            email=data.email,
            nama=data.nama,
            password=data.password,
            jabatan=data.jabatan
        )
        return success_response(petugas, message="Akun petugas berhasil dibuat")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.patch("/{id}", response_model=dict)
def update_petugas(
    id: str,
    data: PetugasUpdate,
    user=Depends(get_admin_only)
):
    """Update petugas (admin only)."""
    try:
        petugas = petugas_service.update_petugas(id, data.dict(exclude_unset=True))
        return success_response(petugas, message="Petugas berhasil diupdate")
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
    """Update petugas status (admin only)."""
    try:
        status = data.get("status")
        petugas = petugas_service.update_petugas_status(id, status)
        return success_response(petugas, message="Status berhasil diupdate")
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.delete("/{id}", response_model=dict)
def delete_petugas(id: str, user=Depends(get_admin_only)):
    """Delete petugas (admin only)."""
    try:
        result = petugas_service.delete_petugas(id)
        return success_response(result)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("/{id}/reset-password", response_model=dict)
def reset_password(
    id: str,
    data: dict,
    user=Depends(get_admin_only)
):
    """Reset petugas password (admin only)."""
    try:
        mode = data.get("mode", "send_reset_email")
        result = petugas_service.reset_petugas_password(id, mode)
        return success_response(result, message=result.get("message", "Password berhasil direset"))
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
