from pydantic import BaseModel
from typing import Optional

class MemberCreate(BaseModel):
    nama: str
    email: str
    card_uid: Optional[str] = None

class MemberUpdate(BaseModel):
    nama: Optional[str] = None
    email: Optional[str] = None