from fastapi import APIRouter, Query, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import traceback

from app.services.dashboard_service import (
    get_dashboard_stats,
    list_visitors,
    manual_visitor_entry,
    process_nfc_tap
)
from app.api.deps import get_current_user
from app.schemas.dashboard_schema import Stats, Visitor, VisitorTapResponse, NfcTapResponse
from app.utils.response import success_response, error_response
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
        if event_id:
            try:
                UUID(event_id)
            except ValueError:
                logger.error(f"[STATS] Invalid event_id query parameter: {event_id}")
                raise HTTPException(
                    status_code=422,
                    detail=error_response(
                        "event_id tidak valid",
                        422,
                        {"event_id": ["event_id harus berupa UUID yang valid"]}
                    )
                )

        stats = get_dashboard_stats(event_id)
        return success_response(jsonable_encoder(stats))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STATS] Error fetching dashboard stats: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(500, detail=error_response("Gagal mengambil statistik dashboard", 500))


@router.get("/visitors", response_model=dict)
def get_visitors(
    tanggal: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None),
    limit: Optional[int] = Query(50),
    user=Depends(get_current_user)
):
    """List visitors with optional date, event filtering, and limit."""
    try:
        if tanggal:
            try:
                datetime.strptime(tanggal, "%Y-%m-%d")
            except ValueError:
                logger.error(f"[VISITORS] Invalid tanggal query parameter: {tanggal}")
                raise HTTPException(
                    status_code=422,
                    detail=error_response(
                        "tanggal tidak valid",
                        422,
                        {"tanggal": ["tanggal harus dengan format YYYY-MM-DD"]}
                    )
                )

        if event_id:
            try:
                UUID(event_id)
            except ValueError:
                logger.error(f"[VISITORS] Invalid event_id query parameter: {event_id}")
                raise HTTPException(
                    status_code=422,
                    detail=error_response(
                        "event_id tidak valid",
                        422,
                        {"event_id": ["event_id harus berupa UUID yang valid"]}
                    )
                )

        visitors = list_visitors(tanggal, event_id, limit)
        logger.info(f"📊 GET VISITORS - tanggal={tanggal}, event_id={event_id}, limit={limit}, count={len(visitors)}")
        if not visitors:
            return success_response([], message="Belum ada visitor hari ini")
        return success_response(jsonable_encoder(visitors))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[VISITORS] Error getting visitors: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(500, detail=error_response("Gagal mengambil visitor", 500))


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
    """
    Process NFC tap for visitor entry/exit.
    
    Professional response format with structured data.
    """
    try:
        uid = data.get("uid")
        timestamp = data.get("timestamp")
        event_id = data.get("event_id")

        if not uid or not timestamp:
            logger.warning(f"[NFC] Missing required fields: uid={bool(uid)}, timestamp={bool(timestamp)}")
            raise HTTPException(
                status_code=422,
                detail=error_response(
                    "uid dan timestamp wajib diisi",
                    422,
                    {"uid": ["uid wajib diisi"], "timestamp": ["timestamp wajib diisi"]}
                )
            )

        logger.info("========================================")
        logger.info(f"🔖 NFC TAP - UID: {uid}")
        logger.info(f"   Timestamp: {timestamp}")
        logger.info(f"   Event ID: {event_id or 'auto-detect'}")
        logger.info(f"   User: {user.get('email', 'unknown')}")
        
        # Process NFC tap with new professional response format
        tap_result: NfcTapResponse = process_nfc_tap(uid, timestamp, event_id)
        
        # Determine HTTP status code based on response
        if not tap_result.success:
            if tap_result.code == "TOO_FAST_TAP":
                http_status = status.HTTP_429_TOO_MANY_REQUESTS
            elif tap_result.code == "NO_ACTIVE_EVENT":
                http_status = status.HTTP_404_NOT_FOUND
            elif tap_result.code in ["INVALID_EVENT_ID", "INTERNAL_SERVER_ERROR"]:
                http_status = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                http_status = status.HTTP_400_BAD_REQUEST
            
            logger.warning(f"   ⚠️  Result: {tap_result.code} - {tap_result.message}")
            logger.info("========================================")
            
            raise HTTPException(
                status_code=http_status,
                detail=jsonable_encoder(tap_result)
            )
        
        # Success response
        action_label = "CHECK_IN" if tap_result.action == "CHECK_IN" else "CHECK_OUT"
        status_icon = "🟢" if tap_result.action == "CHECK_IN" else "🔴"
        
        logger.info(f"   ✅ {status_icon} Action: {action_label}")
        logger.info(f"   UID: {tap_result.data.uid}")
        logger.info(f"   Status: {tap_result.data.status}")
        logger.info("========================================")
        
        return jsonable_encoder(tap_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"   ❌ UNEXPECTED ERROR in NFC tap")
        logger.info("========================================")
        
        raise HTTPException(
            status_code=500,
            detail=jsonable_encoder(NfcTapResponse(
                success=False,
                code="INTERNAL_SERVER_ERROR",
                message="Terjadi kesalahan server"
            ))
        )
