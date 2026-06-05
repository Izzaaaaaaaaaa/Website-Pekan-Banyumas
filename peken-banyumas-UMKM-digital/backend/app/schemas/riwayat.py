from pydantic import BaseModel, field_validator
from typing import Optional


class TambahRiwayatSchema(BaseModel):
    pelanggan: Optional[str] = None
    barang: str
    qty: float = 1          # NUMERIC — bisa pecahan
    total: float
    metode: str = "tunai"   # tunai | qris
    tgl: str                # YYYY-MM-DD

    @field_validator("metode")
    @classmethod
    def validate_metode(cls, v: str) -> str:
        if v not in {"tunai", "qris"}:
            raise ValueError("metode harus 'tunai' atau 'qris'")
        return v
