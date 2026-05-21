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
from app.db.supabase import supabase
from fastapi.encoders import jsonable_encoder
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/dashboard/stats", response_model=dict)
def get_stats(
    event_id: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Get live visitor stats."""
    try:
        stats = get_dashboard_stats(event_id)
        return success_response(jsonable_encoder(stats))
    except HTTPException as e:
        print(f"ERROR DASHBOARD: {e.detail}")
        if isinstance(e.detail, dict) and "success" in e.detail:
            raise
        raise HTTPException(e.status_code, detail=error_response(str(e.detail), e.status_code))
    except Exception as e:
        print(f"ERROR DASHBOARD: {str(e)}")
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
        logger.info(f"📊 GET VISITORS - tanggal={tanggal}, event_id={event_id}, count={len(visitors)}")
        return success_response(jsonable_encoder(visitors))
    except HTTPException as e:
        print(f"ERROR VISITORS: {e.detail}")
        if isinstance(e.detail, dict) and "success" in e.detail:
            raise
        raise HTTPException(e.status_code, detail=error_response(str(e.detail), e.status_code))
    except Exception as e:
        print(f"ERROR VISITORS: {str(e)}")
        logger.error(f"Error getting visitors: {str(e)}")
        raise HTTPException(500, detail=error_response(str(e), 500))


@router.post("/visitors/manual", response_model=dict)
def manual_entry(
    data: dict,
    user=Depends(get_current_user)
):
    """Record manual visitor entry."""
    try:
        aksi = data.get("aksi")
        event_id = data.get("event_id")
        logger.info("========================================")
        logger.info(f"📋 INPUT MANUAL - Aksi: {aksi}")
        logger.info(f"   Event ID: {event_id}")
        logger.info(f"   User: {user.get('email', 'unknown')}")
        
        result = manual_visitor_entry(aksi=aksi, event_id=event_id)
        
        logger.info(f"   ✅ Berhasil: {result.get('message')}")
        logger.info("========================================")
        return success_response(result, message=result.get("message"))
    except HTTPException as e:
        logger.error(f"   ❌ Gagal input manual: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"   ❌ Error input manual: {str(e)}")
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

        logger.info("========================================")
        logger.info(f"🔖 TAP NFC - UID: {uid}")
        logger.info(f"   Timestamp: {timestamp}")
        logger.info(f"   Event ID: {event_id or 'auto-detect'}")
        logger.info(f"   User: {user.get('email', 'unknown')}")
        
        result = process_nfc_tap(uid, timestamp, event_id)
        message = f"Selamat datang, {result.nama}!" if result.aksi == "masuk" else f"Sampai jumpa, {result.nama}!"
        
        aksi_icon = "🟢 MASUK" if result.aksi == "masuk" else "🔴 KELUAR"
        logger.info(f"   ✅ Aksi: {aksi_icon}")
        logger.info(f"   Nama: {result.nama}")
        logger.info(f"   Status: {result.status}")
        logger.info(f"   Response: {result.dict()}")
        logger.info("========================================")
        
        return success_response(result.dict(), message=message)
    except HTTPException as e:
        logger.error(f"   ❌ Gagal tap NFC: {e.detail}")
        raise
    except Exception as e:
        logger.exception(f"   ❌ Error tap NFC")
        raise HTTPException(500, detail=error_response(f"Error processing NFC tap: {str(e)}", 500))
        raise HTTPException(500, detail=error_response(str(e), 500))
