"""
Supabase JWT verification.

The frontend uses Supabase Auth (signInWithPassword) and sends the
Supabase-issued access_token as `Authorization: Bearer <token>`.
This module verifies that token using the project's JWT secret.
"""

from jose import JWTError, jwt

from app.core.config import SUPABASE_JWT_SECRET


def verify_supabase_token(token: str) -> dict | None:
    """Decode and verify a Supabase JWT.

    Returns the full JWT payload on success, or None on any failure.
    The payload contains:
        sub          — UUID of the auth.users row
        email        — user's email
        app_metadata — { role, status, ... }
        user_metadata — { nama, ... }
    """
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={
                "verify_aud": False,  # Supabase JWTs use 'authenticated' audience
            },
        )
        return payload
    except JWTError:
        return None
