from fastapi import APIRouter, Query, Depends, HTTPException
from typing import List, Optional

from app.services.dashboard_service import (
    get_dashboard_stats,
    list_visitors,
    manual_visitor_entry,
    process_nfc_tap
)
from app.api.deps import get_current_user
from app.schemas.dashboard_schema import Stats, Visitor, VisitorTapResponse
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/dashboard/stats", response_model=dict)
def get_stats(
    event_id: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get live visitor stats."""
    try:
        stats = get_dashboard_stats(event_id)
        return success_response(stats)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.get("/visitors", response_model=dict)
def get_visitors(
    tanggal: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """List visitors with optional date and event filtering."""
    try:
        visitors = list_visitors(tanggal, event_id)
        return success_response(visitors)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("/visitors/manual", response_model=dict)
def manual_entry(
    data: dict,
    user=Depends(get_current_user)
):
    """Record manual visitor entry."""
    try:
        result = manual_visitor_entry(
            aksi=data.get("aksi"),
            event_id=data.get("event_id")
        )
        return success_response(None, message=result.get("message"))
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("/visitors/tap", response_model=dict)
def nfc_tap(
    data: dict,
    user=Depends(get_current_user)
):
    """Process NFC tap for visitor entry/exit."""
    try:
        uid = data.get("uid")
        timestamp = data.get("timestamp")
        event_id = data.get("event_id")

        if not uid or not timestamp:
            raise HTTPException(422, detail=error_response(
                "uid dan timestamp wajib diisi",
                422,
                {"uid": ["uid wajib diisi"], "timestamp": ["timestamp wajib diisi"]}
            ))

        result = process_nfc_tap(uid, timestamp, event_id)
        message = f"Selamat datang, {result.nama}!" if result.aksi == "masuk" else f"Sampai jumpa, {result.nama}!"
        return success_response(result.dict(), message=message)
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
