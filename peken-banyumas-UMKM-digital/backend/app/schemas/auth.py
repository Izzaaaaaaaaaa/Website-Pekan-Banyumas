from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterSchema(BaseModel):
    """
    Schema pendaftaran artisan baru.
    username: unik, huruf kecil + angka + underscore, 4–30 karakter.
    kategori_usaha: array string (fnb, kriya, fashion, lainnya, dll).
    password: diteruskan ke Supabase Admin create_user — minimal 6 karakter.
    """
    nama_usaha: str
    pemilik: str
    email: EmailStr
    username: str
    password: str
    no_hp: Optional[str] = ""
    kota: Optional[str] = ""
    kategori_usaha: list[str] = []
    deskripsi: Optional[str] = ""


class ChangePasswordSchema(BaseModel):
    """Ganti password dari halaman Pengaturan."""
    password_lama: str   # dipakai FE untuk re-auth sebelum call endpoint ini
    password_baru: str
    konfirmasi: str
