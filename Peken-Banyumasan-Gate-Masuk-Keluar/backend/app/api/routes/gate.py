from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gate_service import scan_nfc

router = APIRouter(prefix="/gate", tags=["Gate"])

class ScanRequest(BaseModel):
    card_uid: str

@router.post("/scan")
def scan(data: ScanRequest):
    return scan_nfc(data.card_uid)