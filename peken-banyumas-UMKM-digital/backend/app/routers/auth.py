"""
auth.py — Artisan auth router (UMKM-2: Supabase Auth)

Endpoint yang tersisa setelah migrasi:
  GET  /api/auth/me/status  — cek artisans.status setelah login Supabase
  POST /api/auth/register   — daftarkan artisan baru via Supabase Admin SDK

Login / lupa-password / reset-password semuanya Supabase-direct di FE
— tidak perlu backend endpoint untuk alur itu.
"""

from fastapi import APIRouter, HTTPException, status, Request, Depends

from app.schemas.auth import RegisterSchema
from app.services import auth_service
from app.models.model import MessageResponse
from app.db.supabase import db_select, supabase_anon
from app.middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Shared token verifier ─────────────────────────────────────────────────────
def _resolve_user_from_token(request: Request):
    """
    Verifikasi Supabase JWT dari header Authorization menggunakan anon key client.
    Service role key tidak bisa memverifikasi user token.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header tidak ditemukan",
        )
    token = auth_header.split(" ", 1)[1]
    try:
        res = supabase_anon.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")
        return res.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid atau sesi berakhir")


# ── GET /api/auth/me/status ───────────────────────────────────────────────────
@router.get("/me/status")
def me_status(request: Request):
    """
    Cek status artisan dari tabel artisans.
    Dipanggil FE setelah supabase.auth.signInWithPassword berhasil,
    sebelum redirect ke dashboard.
    Mengembalikan: { status, nama, email, user_id }
    """
    user = _resolve_user_from_token(request)
    user_id = user.id

    artisan = db_select("artisans", filters={"id": user_id}, single=True)
    if not artisan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artisan tidak ditemukan. Pastikan akun sudah terdaftar.",
        )

    return {
        "status":  artisan.get("status", "pending"),
        "nama":    artisan.get("pemilik", ""),
        "email":   artisan.get("email", ""),
        "user_id": user_id,
    }


# ── POST /api/auth/register ───────────────────────────────────────────────────
@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterSchema):
    """
    Daftarkan artisan baru.
    Atomik: Supabase Auth create_user → users_profile → artisans.
    Status default 'pending' — admin harus aktivasi.
    """
    try:
        return auth_service.register(body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
