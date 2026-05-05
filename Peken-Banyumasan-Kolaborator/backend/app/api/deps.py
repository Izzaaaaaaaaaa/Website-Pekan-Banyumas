"""
Shared FastAPI dependencies for JWT-protected endpoints.

The frontend sends a Supabase JWT as `Authorization: Bearer <token>`.
This dependency verifies it and extracts the user identity + role.
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import verify_supabase_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify Supabase JWT and return a normalised user dict.

    Returns:
        {
            "user_id": str (UUID),
            "email": str,
            "role": str,          # from app_metadata.role
            "status": str,        # from app_metadata.status
            "nama": str,          # from user_metadata.nama
        }

    Raises HTTPException 401 if the token is missing/invalid/expired.
    Raises HTTPException 403 if role is not 'kolaborator'.
    """
    token = credentials.credentials
    payload = verify_supabase_token(token)
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail={"status": "error", "message": "Sesi Anda telah berakhir", "data": None},
        )

    app_meta = payload.get("app_metadata") or {}
    user_meta = payload.get("user_metadata") or {}
    role = app_meta.get("role", "")

    if role != "kolaborator":
        raise HTTPException(
            status_code=403,
            detail={"status": "error", "message": "Akses ditolak", "data": None},
        )

    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email", ""),
        "role": role,
        "status": app_meta.get("status", "aktif"),
        "nama": user_meta.get("nama", ""),
    }
