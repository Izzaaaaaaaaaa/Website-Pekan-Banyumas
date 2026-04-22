from pydantic import BaseModel
from typing import Optional

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