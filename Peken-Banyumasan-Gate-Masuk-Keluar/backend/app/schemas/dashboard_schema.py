from pydantic import BaseModel
from typing import List, Optional
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


class VisitorTapResponse(BaseModel):
    """Response from NFC tap - tells frontend what action happened."""
    aksi: str  # masuk or keluar
    nama: str
    status: str  # di_dalam or keluar
