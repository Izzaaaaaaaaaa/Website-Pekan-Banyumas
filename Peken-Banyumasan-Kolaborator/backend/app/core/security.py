from fastapi.security import HTTPBearer
from app.db.supabase import supabase

security = HTTPBearer(auto_error=False)


def verify_supabase_token(token: str) -> dict | None:
    """
    Memverifikasi token JWT dari Supabase secara aman menggunakan API get_user().
    Ini mendukung semua algoritma JWT (HS256, RS256, ES256) yang dipakai Supabase
    tanpa perlu menebak kunci rahasia secara lokal.
    """
    try:
        res = supabase.auth.get_user(token)
        if not res.user:
            return None
            
        return {
            "sub": res.user.id,
            "email": res.user.email,
            "app_metadata": res.user.app_metadata,
            "user_metadata": res.user.user_metadata,
            "user_id": res.user.id,
        }
    except Exception:
        return None
