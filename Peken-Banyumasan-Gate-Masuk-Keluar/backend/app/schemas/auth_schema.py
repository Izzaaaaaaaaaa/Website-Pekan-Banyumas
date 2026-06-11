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
    """Update own users_profile row. nama is accepted here so the DB table
    stays in sync with Supabase user_metadata (FE updates both); email is
    Supabase-Auth-only and intentionally NOT accepted."""
    nama: Optional[str] = None
    jabatan: Optional[str] = None
    extra: Optional[dict] = None  # Additional custom fields


class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str
