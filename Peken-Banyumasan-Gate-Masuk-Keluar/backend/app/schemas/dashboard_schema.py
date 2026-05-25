from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class Stats(BaseModel):
    """Dashboard statistics for visitor counts."""
    di_dalam: int
    total_masuk: int
    total_keluar: int
    total_harian: int
    event_id: str
    nama_event: str


class Visitor(BaseModel):
    """Individual visitor record with entry/exit timestamps."""
    id: str
    nama: str
    waktu_masuk: datetime
    waktu_keluar: Optional[datetime] = None
    status: str  # di_dalam or keluar
    tipe_pengunjung: str = "manual"  # nfc or manual
    nfc_uid: Optional[str] = None
    nama_pengunjung: Optional[str] = None


class ActivityItem(BaseModel):
    nama: Optional[str]
    status: str
    waktu: str


# ──────────────────────────────────────────────────────────────────────
# Professional NFC Tap Response Format
# ──────────────────────────────────────────────────────────────────────

class NfcTapData(BaseModel):
    """Data payload for NFC tap response."""
    uid: str
    status: str  # INSIDE or OUTSIDE
    action: Optional[str] = None  # CHECK_IN or CHECK_OUT
    aksi: Optional[str] = None  # backward compatibility for frontend


class NfcTapResponse(BaseModel):
    """Professional NFC tap response with structured data."""
    success: bool
    code: str  # CHECK_IN_SUCCESS, CHECK_OUT_SUCCESS, TOO_FAST_TAP, etc
    action: Optional[str] = None  # CHECK_IN or CHECK_OUT
    aksi: Optional[str] = None  # backward compatibility for frontend
    message: str
    data: Optional[NfcTapData] = None


# Backward compatibility - keep old response format
class VisitorTapResponse(BaseModel):
    """Response from NFC tap - tells frontend what action happened."""
    aksi: str  # masuk or keluar
    nama: str
    status: str  # di_dalam or keluar
