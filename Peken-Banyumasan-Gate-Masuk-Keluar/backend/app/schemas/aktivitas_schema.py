from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Aktivitas(BaseModel):
    id: str
    user_id: str
    nama_author: str
    konten: str
    media_url: Optional[str] = None
    tags: List[str] = []
    likes_count: int = 0
    created_at: datetime
    updated_at: datetime


class AktivitasList(BaseModel):
    id: str
    user_id: str
    nama_author: str
    konten: str
    media_url: Optional[str] = None
    created_at: datetime
