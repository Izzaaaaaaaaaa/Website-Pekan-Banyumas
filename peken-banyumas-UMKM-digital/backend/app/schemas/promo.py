from pydantic import BaseModel, field_validator
from typing import Optional


class TambahPromoSchema(BaseModel):
    """Sesuai DB promo v2.3.0."""
    nama: str
    produk: str
    diskon: float           # 0–100 persen
    kategori: str = ""
    deskripsi: str = ""
    berlaku_start: str      # DATE YYYY-MM-DD
    berlaku_end: str
    aktif: bool = True

    @field_validator("diskon")
    @classmethod
    def validate_diskon(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("diskon harus antara 0 dan 100")
        return v


class EditPromoSchema(BaseModel):
    nama: Optional[str] = None
    produk: Optional[str] = None
    diskon: Optional[float] = None
    kategori: Optional[str] = None
    deskripsi: Optional[str] = None
    berlaku_start: Optional[str] = None
    berlaku_end: Optional[str] = None
    aktif: Optional[bool] = None
