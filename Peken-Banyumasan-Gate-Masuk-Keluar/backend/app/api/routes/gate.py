from fastapi import APIRouter, Depends, Query
from app.services.gate_service import scan_nfc, get_gate_logs
from app.api.deps import get_current_user
from app.schemas.gate_schema import ScanRequest  # 🔥 import dari schema

router = APIRouter(prefix="/gate", tags=["Gate"])


@router.post("/scan")
def scan(data: ScanRequest):
    return scan_nfc(data.card_uid)


@router.get("/logs")
def logs(
    gate_type: str = Query(None),
    limit: int = Query(20),
    user=Depends(get_current_user)
):
    return get_gate_logs(gate_type, limit)