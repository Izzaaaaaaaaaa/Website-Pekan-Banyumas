from pydantic import BaseModel
from typing import Optional
from typing import List, Optional


class EventCreate(BaseModel):
    nama: str
    deskripsi: Optional[str] = None
    lokasi: Optional[str] = None
    tanggal_mulai: Optional[str] = None
    tanggal_selesai: Optional[str] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    kapasitas: Optional[int] = None
    status: Optional[str] = "draft"


class EventUpdate(BaseModel):
    nama: Optional[str] = None
    deskripsi: Optional[str] = None
    lokasi: Optional[str] = None
    tanggal_mulai: Optional[str] = None
    tanggal_selesai: Optional[str] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    kapasitas: Optional[int] = None
    status: Optional[str] = None


# 🔥 TAMBAHKAN INI (PENTING)
class EventResponse(BaseModel):
    id: str
    nama: str
    lokasi: Optional[str]
    status: str
    
class EventStats(BaseModel):
    total_masuk: int
    total_keluar: int
    di_dalam: int


class EventActivity(BaseModel):
    id: str
    gate_type: str
    scan_time: str
    nama: Optional[str]


class EventDetailResponse(BaseModel):
    id: str
    nama: str
    deskripsi: Optional[str]
    lokasi: Optional[str]
    tanggal_mulai: Optional[str]
    tanggal_selesai: Optional[str]
    status: Optional[str]

    stats: EventStats
    activities: List[EventActivity]