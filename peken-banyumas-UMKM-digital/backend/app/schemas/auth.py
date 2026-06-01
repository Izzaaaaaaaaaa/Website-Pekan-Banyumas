from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class RegisterSchema(BaseModel):
    """
    Sesuai schema DB artisans v2.3.0.
    username: required, lowercase alphanumeric + dash, 3–32 char.
    kategori_usaha: UMKM 9 categories (array).
    """
    nama_usaha: str                         # artisans.nama_usaha
    pemilik: str                            # artisans.pemilik
    email: EmailStr
    username: str                           # artisans.username — UNIQUE
    password: str
    no_hp: Optional[str] = ""
    kota: Optional[str] = ""
    kategori_usaha: list[str] = []          # artisans.kategori_usaha TEXT[]
    deskripsi: Optional[str] = ""


class OtpRequestSchema(BaseModel):
    phone: str
    purpose: str = "password_reset"         # password_reset | verify | register


class OtpVerifySchema(BaseModel):
    phone: str
    code: str
    purpose: str = "password_reset"


class ResetPasswordSchema(BaseModel):
    """Dipakai setelah OTP diverifikasi — simpan token dari otp verify step."""
    phone: str
    code: str
    new_password: str


class ChangePasswordSchema(BaseModel):
    password_lama: str
    password_baru: str
    konfirmasi: str
