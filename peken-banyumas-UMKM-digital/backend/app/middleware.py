from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import supabase_anon

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Validasi Supabase JWT via API get_user() — tidak perlu JWT_SECRET.
    Kembalikan payload: { sub, email, role, nama }.

    Hanya artisan yang diizinkan masuk (role == 'artisan').
    Menggunakan supabase_anon (anon key) karena service role key tidak bisa
    memverifikasi user token via auth.get_user().
    """
    token = credentials.credentials
    try:
        res = supabase_anon.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak valid atau sesi sudah berakhir",
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sesi sudah berakhir",
        )

    user = res.user
    app_meta  = user.app_metadata  or {}
    user_meta = user.user_metadata or {}
    role = app_meta.get("role", "")

    if role != "artisan":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak — hanya artisan yang diizinkan",
        )

    return {
        "sub":   user.id,
        "email": user.email or "",
        "role":  role,
        "nama":  user_meta.get("nama", ""),
    }
