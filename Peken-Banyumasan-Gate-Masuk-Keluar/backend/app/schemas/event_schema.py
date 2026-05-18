from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class EventBase(BaseModel):
    nama: str
    tanggal: date
    tanggal_selesai: date
    jam_mulai: str  # HH:MM format
    jam_selesai: str  # HH:MM format
    lokasi: str
    status: str = "draft"  # draft, published, berlangsung, selesai
    kapasitas: Optional[int] = None
    deskripsi: str = ""
    konten_lengkap: Optional[str] = None
    subsektor: List[str] = []
    banner_url: Optional[str] = None
    galeri: List[str] = []


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    nama: Optional[str] = None
    tanggal: Optional[date] = None
    tanggal_selesai: Optional[date] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    lokasi: Optional[str] = None
    status: Optional[str] = None
    kapasitas: Optional[int] = None
    deskripsi: Optional[str] = None
    konten_lengkap: Optional[str] = None
    subsektor: Optional[List[str]] = None
    banner_url: Optional[str] = None
    galeri: Optional[List[str]] = None


class Event(EventBase):
    id: str
    peserta_count: int = 0
    created_at: datetime
    updated_at: datetime


class EventKolaborator(BaseModel):
    id: str
    event_id: str
    kolaborator_id: str
    peran: str  # performer, panitia, peserta
    status_kehadiran: str  # terdaftar, hadir, tidak_hadir, dibatalkan
    assigned_by: str  # admin or self
    created_at: datetime
    updated_at: datetime


class EventKolaboratorAssign(BaseModel):
    kolaborator_id: str
    peran: str = "peserta"
    status_kehadiran: str = "terdaftar"


class EventArtisan(BaseModel):
    id: str
    event_id: str
    artisan_id: str
    stand_id: Optional[str] = None
    posisi_event: Optional[str] = None
    status_request: str  # pending, pending_change, approved, rejected
    assigned_by: str  # admin or self
    created_at: datetime
    updated_at: datetime


class EventArtisanAssign(BaseModel):
    artisan_id: str
    stand_id: Optional[str] = None
    posisi_event: Optional[str] = None


class ArtisanRequest(BaseModel):
    id: str
    event_id: str
    artisan_id: str
    posisi_event: Optional[str] = None
    status_request: str  # pending, pending_change, approved, rejected
    change_request: Optional[str] = None
    assigned_by: str  # always 'self'
    created_at: datetime
    updated_at: datetime


class ArtisanRequestResponse(BaseModel):
    action: str  # approve or reject
    change_request: Optional[str] = None


class KolaboratorRequest(BaseModel):
    id: str
    event_id: str
    kolaborator_id: str
    peran: str
    status: str  # pending, approved, rejected
    created_at: datetime
    updated_at: datetime
