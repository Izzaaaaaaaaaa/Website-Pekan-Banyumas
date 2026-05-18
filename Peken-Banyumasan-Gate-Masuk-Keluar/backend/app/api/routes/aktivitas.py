from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.api.deps import get_current_user, get_admin_only
from app.services import aktivitas_service
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/aktivitas", tags=["aktivitas"])


@router.get("", response_model=dict)
def list_aktivitas(
    q: Optional[str] = Query(None),
    limit: int = Query(50),
    user=Depends(get_admin_only)
):
    """List all stories for admin moderation (admin only)."""
    try:
        aktivitas = aktivitas_service.list_aktivitas(q, limit)
        return success_response(aktivitas)
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.delete("/{id}", response_model=dict)
def delete_aktivitas(
    id: str,
    user=Depends(get_admin_only)
):
    """Delete story (admin only)."""
    try:
        result = aktivitas_service.delete_aktivitas(id)
        return success_response(None, message=result.get("message"))
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
