from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    user_id: str
    role: str


class UserResponse(BaseModel):
    id: str
    nama: str
    email: EmailStr
    role: str


class ProfileUpdate(BaseModel):
    """Update custom profile fields only. Nama/email handled by Supabase."""
    jabatan: Optional[str] = None
    extra: Optional[dict] = None  # Additional custom fields


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str
