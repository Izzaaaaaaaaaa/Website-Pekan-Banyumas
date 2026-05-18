from pydantic import BaseModel
from typing import List, Optional


class Stand(BaseModel):
    id: str
    label: str


class Zone(BaseModel):
    id: str
    zona: str
    label: str
    warna: str
    stands: List[Stand] = []
    occupied: List[str] = []  # stand IDs that are occupied


class ZoneSaveRequest(BaseModel):
    zones: List[dict]
