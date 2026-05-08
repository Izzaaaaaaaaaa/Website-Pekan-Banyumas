from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Notifikasi(BaseModel):
    id: str
    user_id: str
    judul: str
    pesan: str
    tipe: str
    baca: bool = False
    created_at: datetime
    updated_at: datetime


class NotifikasiUpdate(BaseModel):
    baca: Optional[bool] = None
