from pydantic import BaseModel
from typing import List, Optional

class DashboardStats(BaseModel):
    total_masuk: int
    total_keluar: int
    di_dalam: int


class ActivityItem(BaseModel):
    nama: Optional[str]
    status: str
    waktu: str