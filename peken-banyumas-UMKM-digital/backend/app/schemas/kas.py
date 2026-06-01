from pydantic import BaseModel, field_validator
from typing import Optional


METODE_VALID = {"tunai", "qris"}   # v2.2.2: 'transfer' dihapus sesuai FE & DB


class TambahKasSchema(BaseModel):
    """
    Sesuai DB kas v2.3.0:
    - qty: NUMERIC(10,2) — bisa pecahan (0.5 kg)
    - metode: tunai | qris  (transfer sudah dihapus di v2.2.2)
    - tgl: DATE WIB format YYYY-MM-DD
    - saldo_after dihitung backend, tidak dikirim dari FE
    """
    jenis: str                          # masuk | keluar
    kategori: str = ""
    pelanggan: Optional[str] = None
    barang: Optional[str] = None
    qty: float = 1                      # NUMERIC(10,2)
    metode: str = "tunai"               # tunai | qris
    ket: str = ""
    nominal: float
    tgl: str                            # YYYY-MM-DD
    bukti_url: Optional[str] = None

    @field_validator("jenis")
    @classmethod
    def validate_jenis(cls, v: str) -> str:
        if v not in {"masuk", "keluar"}:
            raise ValueError("jenis harus 'masuk' atau 'keluar'")
        return v

    @field_validator("metode")
    @classmethod
    def validate_metode(cls, v: str) -> str:
        if v not in METODE_VALID:
            raise ValueError(f"metode harus salah satu dari: {METODE_VALID}")
        return v


class EditKasSchema(BaseModel):
    jenis: Optional[str] = None
    kategori: Optional[str] = None
    pelanggan: Optional[str] = None
    barang: Optional[str] = None
    qty: Optional[float] = None
    metode: Optional[str] = None
    ket: Optional[str] = None
    nominal: Optional[float] = None
    tgl: Optional[str] = None
    bukti_url: Optional[str] = None

    @field_validator("metode")
    @classmethod
    def validate_metode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in METODE_VALID:
            raise ValueError(f"metode harus salah satu dari: {METODE_VALID}")
        return v
