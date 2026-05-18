from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class ReportFilter(BaseModel):
    event_id: str


class Report(BaseModel):
    nama: str
    tanggal_range: List[str]
    rows: List[dict]
    total_masuk: int
    total_keluar: int
    di_dalam: int


class ArtisanReportRow(BaseModel):
    id: str
    nama_usaha: str
    kategori: str
    omset: float
    komisi_persen: float
    transaksi: int
    event_count: int
    stand_terakhir: Optional[str] = None


class EventAccumRow(BaseModel):
    id: str
    nama: str
    tanggal: date
    status: str
    pengunjung: int
    artisan_count: int
    kolaborator_count: int
