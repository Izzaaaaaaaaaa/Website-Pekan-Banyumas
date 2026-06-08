"""
model.py — Pydantic response models untuk Artisan API.
Semua field name dan type mengikuti DB schema v2.3.0.
"""

from pydantic import BaseModel
from typing import Optional, List, Any


# ── AUTH ──────────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    nama: str
    email: str
    role: str  # artisan


class MessageResponse(BaseModel):
    message: str


# ── ARTISAN PROFIL ────────────────────────────────────────────────────────────
class ProfilResponse(BaseModel):
    """
    Profil artisan sendiri — ada email & no_hp.
    TIDAK expose: password_hash, internal_notes, komisi_persen,
                  total_penjualan, komisi_terkumpul.
    """
    id: str
    username: str
    slug: str
    nama_usaha: str
    pemilik: str
    email: Optional[str] = None
    no_hp: str
    kota: str
    deskripsi: str
    foto_url: Optional[str] = None
    cover_url: Optional[str] = None
    qris_url: Optional[str] = None
    qris_updated_at: Optional[str] = None
    kategori_usaha: List[str] = []
    status: str
    tanggal_daftar: Optional[str] = None
    updated_at: Optional[str] = None


class QrisResponse(BaseModel):
    """Return setelah update QRIS — sesuai OpenAPI artisan yaml 830–842."""
    qris_url: str
    updated_at: str


# ── STOK ──────────────────────────────────────────────────────────────────────
class StokItem(BaseModel):
    id: str
    artisan_id: str
    nama: str
    harga: float
    stok: int
    kategori: str
    satuan: str
    deskripsi: str
    stok_min: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── KAS ───────────────────────────────────────────────────────────────────────
class KasItem(BaseModel):
    id: str
    artisan_id: str
    jenis: str              # masuk | keluar
    kategori: str
    pelanggan: Optional[str] = None
    barang: Optional[str] = None
    qty: float              # NUMERIC(10,2) — bisa pecahan misal 0.5 kg
    metode: str             # tunai | qris
    ket: str
    nominal: float
    tgl: str                # DATE WIB YYYY-MM-DD
    saldo_after: Optional[float] = 0.0  # dihitung backend on-the-fly, tidak disimpan di DB
    bukti_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── RIWAYAT TRANSAKSI ─────────────────────────────────────────────────────────
class RiwayatItem(BaseModel):
    id: str
    artisan_id: str
    pelanggan: Optional[str] = None
    barang: str
    qty: float
    total: float
    metode: str             # tunai | qris
    tgl: str
    created_at: Optional[str] = None


# ── PROMO ─────────────────────────────────────────────────────────────────────
class PromoItem(BaseModel):
    id: str
    artisan_id: str
    nama: str
    produk: str
    diskon: float           # 0–100 persen
    kategori: str
    deskripsi: str
    berlaku_start: str      # DATE WIB YYYY-MM-DD
    berlaku_end: str
    aktif: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── EVENT ─────────────────────────────────────────────────────────────────────
class EventItem(BaseModel):
    id: str
    nama: str
    tanggal: str            # DATE WIB YYYY-MM-DD
    tanggal_selesai: str
    jam_mulai: str          # HH:MM WIB
    jam_selesai: str
    lokasi: str
    status: str             # draft | published | berlangsung | selesai
    kapasitas: Optional[int] = None   # NULL = unlimited
    peserta_count: int
    deskripsi: str
    konten_lengkap: Optional[str] = None
    subsektor: List[str] = []
    banner_url: Optional[str] = None
    galeri: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ArtisanRequestItem(BaseModel):
    """Request pendaftaran event dari artisan — tabel artisan_requests."""
    id: str
    event_id: str
    artisan_id: str
    posisi_event: Optional[str] = None   # stand_id yang diminta
    status_request: str     # pending | pending_change | approved | rejected
    change_request: Optional[str] = None
    assigned_by: str        # selalu 'self' untuk artisan_requests
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class EventArtisanItem(BaseModel):
    """Artisan yang sudah approved di event — tabel event_artisans."""
    id: str
    event_id: str
    artisan_id: str
    stand_id: Optional[str] = None
    posisi_event: Optional[str] = None
    status_request: str
    assigned_by: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── ZONE / STAND ──────────────────────────────────────────────────────────────
class ZoneItem(BaseModel):
    id: str
    zona: str               # 'A', 'B', 'C', 'P'
    label: str
    warna: str
    urutan: int
    stands: List[Any] = []  # [{id, label, kategori, occupied}]


# ── NOTIFIKASI ────────────────────────────────────────────────────────────────
class NotifikasiItem(BaseModel):
    id: str
    user_id: str
    type: str               # artisan_request_approved | system | dll
    title: str
    message: str            # bukan 'desc'
    read: bool              # bukan 'dibaca'
    link: Optional[str] = None
    detail: Optional[Any] = None
    created_at: Optional[str] = None
