from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class Kolaborator(BaseModel):
    id: str
    email: Optional[str] = None
    nama: str
    kota: str
    bio: str
    no_hp: str  # Admin-only field
    internal_notes: str  # Admin-only field
    foto_url: Optional[str] = None
    cover_url: Optional[str] = None
    subsektor: List[str] = []
    status: str  # aktif, pending, suspended, rejected
    tanggal_daftar: date
    total_karya: int = 0
    total_story: int = 0
    total_event: int = 0
    slug: str
    updated_at: datetime


class KolaboratorUpdate(BaseModel):
    nama: Optional[str] = None
    kota: Optional[str] = None
    bio: Optional[str] = None
    no_hp: Optional[str] = None
    internal_notes: Optional[str] = None
    foto_url: Optional[str] = None
    cover_url: Optional[str] = None
    subsektor: Optional[List[str]] = None
    status: Optional[str] = None


class KolaboratorListResponse(BaseModel):
    id: str
    nama: str
    kota: str
    status: str
    subsektor: List[str]
    foto_url: Optional[str] = None
    slug: str


class KolaboratorPortoItem(BaseModel):
    id: str
    nama: str
    deskripsi: Optional[str] = None
    featured: bool = False


class KolaboratorStoryItem(BaseModel):
    id: str
    konten: str
    media_url: Optional[str] = None
    created_at: datetime
