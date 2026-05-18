from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from app.api.deps import get_current_user, get_admin_only
from app.services import report_service
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=dict)
def get_report(
    event_id: Optional[str] = Query(None),
    tanggal: Optional[str] = Query(None),
    user=Depends(get_admin_only)
):
    """Get visitor report (admin only)."""
    try:
        report = report_service.get_visitor_report(event_id, tanggal)
        return success_response(report)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/export", response_model=dict)
def export_report(
    format: str = Query(...),
    event_id: Optional[str] = Query(None),
    tanggal: Optional[str] = Query(None),
    user=Depends(get_admin_only)
):
    """Export visitor report as file (admin only)."""
    try:
        if format not in ["excel", "pdf"]:
            raise HTTPException(422, detail=error_response(
                "format harus 'excel' atau 'pdf'",
                422
            ))

        csv_data = report_service.export_visitor_report_csv(event_id, tanggal)
        return success_response(csv_data)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/artisan", response_model=dict)
def get_artisan_report(
    event_id: Optional[str] = Query(None),
    user=Depends(get_admin_only)
):
    """Get artisan revenue report (admin only)."""
    try:
        rows = report_service.get_artisan_report(event_id)
        return success_response(rows)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/accumulation", response_model=dict)
def get_accumulation_report(
    event_id: Optional[str] = Query(None),
    user=Depends(get_admin_only)
):
    """Get event accumulation report (admin only)."""
    try:
        rows = report_service.get_accumulation_report(event_id)
        return success_response(rows)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
