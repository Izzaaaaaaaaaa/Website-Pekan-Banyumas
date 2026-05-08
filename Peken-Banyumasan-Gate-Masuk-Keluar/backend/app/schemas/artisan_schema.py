from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class Artisan(BaseModel):
    id: str
    email: Optional[str] = None
    username: str
    slug: str
    nama_usaha: str
    pemilik: str
    no_hp: str  # Admin-only
    kota: str
    deskripsi: str
    foto_url: Optional[str] = None
    cover_url: Optional[str] = None
    qris_url: Optional[str] = None
    qris_updated_at: Optional[datetime] = None
    kategori_usaha: List[str] = []
    status: str  # aktif, pending, suspended, rejected
    komisi_persen: float = 0
    tanggal_daftar: date
    total_penjualan: float = 0  # Computed
    komisi_terkumpul: float = 0  # Computed
    internal_notes: str = ""  # Admin-only
    updated_at: datetime


class ArtisanUpdate(BaseModel):
    username: Optional[str] = None
    nama_usaha: Optional[str] = None
    pemilik: Optional[str] = None
    no_hp: Optional[str] = None
    kota: Optional[str] = None
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None
    cover_url: Optional[str] = None
    qris_url: Optional[str] = None
    kategori_usaha: Optional[List[str]] = None
    status: Optional[str] = None
    komisi_persen: Optional[float] = None
    internal_notes: Optional[str] = None


class ArtisanListResponse(BaseModel):
    id: str
    nama_usaha: str
    username: str
    pemilik: str
    status: str
    kota: str
    kategori_usaha: List[str]
    foto_url: Optional[str] = None
    slug: str


class ArtisanFinance(BaseModel):
    id: str
    nominal: float
    jenis: str  # masuk or keluar
    keterangan: str
    created_at: datetime


class ArtisanQRIS(BaseModel):
    qris_url: Optional[str] = None
    updated_at: Optional[datetime] = None
