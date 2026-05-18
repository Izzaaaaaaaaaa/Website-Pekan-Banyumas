from jose import JWTError, jwt
from app.core.config import SUPABASE_JWT_SECRET


def verify_supabase_jwt(token: str):
    """
    Verify Supabase JWT token. Decodes and validates using SUPABASE_JWT_SECRET (HS256).
    Returns payload if valid, None otherwise.

    JWT payload expected: { sub: UUID, email, app_metadata: { role, status }, user_metadata: { nama } }
    """
    if not SUPABASE_JWT_SECRET:
        raise ValueError("SUPABASE_JWT_SECRET not configured")

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError as e:
        return None


def verify_token(token: str):
    """Alias for verify_supabase_jwt for backward compatibility."""
    return verify_supabase_jwt(token)
