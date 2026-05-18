from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


class Petugas(BaseModel):
    id: str
    email: EmailStr
    nama: str
    jabatan: Optional[str] = None
    status: str  # aktif, pending, suspended
    created_at: datetime
    updated_at: datetime


class PetugasCreate(BaseModel):
    email: EmailStr
    nama: str
    jabatan: Optional[str] = None


class PetugasUpdate(BaseModel):
    nama: Optional[str] = None
    jabatan: Optional[str] = None
    status: Optional[str] = None


class PetugasStatusUpdate(BaseModel):
    status: str


class PetugasResetPassword(BaseModel):
    mode: str  # 'send_reset_email' or 'generate_temp'
