from pydantic import BaseModel
from typing import Optional


class TambahStokSchema(BaseModel):
    """Sesuai DB stok v2.3.0 — artisan_id diambil dari JWT, bukan dari body."""
    nama: str
    harga: float
    stok: int
    kategori: str = ""
    satuan: str = "pcs"
    deskripsi: str = ""
    stok_min: int = 5  # default minimum 5


class EditStokSchema(BaseModel):
    nama: Optional[str] = None
    harga: Optional[float] = None
    stok: Optional[int] = None
    kategori: Optional[str] = None
    satuan: Optional[str] = None
    deskripsi: Optional[str] = None
    stok_min: Optional[int] = None
