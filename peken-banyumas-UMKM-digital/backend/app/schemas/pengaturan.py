from pydantic import BaseModel, EmailStr
from typing import Optional


class UpdateProfilSchema(BaseModel):
    """
    Field yang boleh diupdate artisan sendiri.
    Tidak termasuk: komisi_persen, total_penjualan, internal_notes, status.
    """
    nama_usaha: Optional[str] = None
    pemilik: Optional[str] = None
    email: Optional[EmailStr] = None
    no_hp: Optional[str] = None
    kota: Optional[str] = None
    kategori_usaha: Optional[list[str]] = None
    deskripsi: Optional[str] = None
    foto_url: Optional[str] = None    # URL foto profil / logo dari Supabase Storage
    cover_url: Optional[str] = None   # URL cover/banner dari Supabase Storage


class UpdateQrisSchema(BaseModel):
    """
    Upload QRIS baru.
    qris_url: URL hasil upload ke Supabase Storage.
    Backend akan update artisans.qris_url dan trigger otomatis set qris_updated_at.
    """
    qris_url: str
