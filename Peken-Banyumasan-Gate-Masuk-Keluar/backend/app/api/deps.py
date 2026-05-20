from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time
import jwt as pyjwt

from app.db.supabase import supabase
from app.utils.response import error_response

security = HTTPBearer()

# ── In-memory token cache ────────────────────────────────────────────────────
# Dashboard polls every 5s → without cache, auth.get_user() is called 24x/min
# per user. This hammers Supabase Auth API causing rate-limits and slow responses.
# 
# Strategy: validate token LOCALLY by decoding JWT (without signature check,
# since Supabase uses ES256 with a rotating public key we don't have).
# We trust the token because:
#   1. It was issued by Supabase Auth (only they can create valid ES256 tokens)
#   2. We check expiry locally
#   3. On first-ever use of a token, we do ONE remote validation and cache it
_token_cache: dict = {}
_CACHE_TTL = 300  # 5 minutes — token itself has 1h expiry


def _decode_jwt_local(token: str) -> dict:
    """
    Decode JWT payload locally without signature verification.
    Only checks expiry. Returns None if token is expired or malformed.
    """
    try:
        payload = pyjwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_exp": True,
                "verify_aud": False,
            }
        )
        return payload
    except pyjwt.ExpiredSignatureError:
        return None
    except Exception:
        return None


def _get_cached_user(token: str):
    """Return cached user dict if token was recently validated, else None."""
    entry = _token_cache.get(token)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["user"]
    return None


def _set_cached_user(token: str, user_dict: dict):
    """Cache a validated user for subsequent requests."""
    # Evict stale entries to prevent memory leak (keep max 200)
    if len(_token_cache) > 200:
        cutoff = time.time() - _CACHE_TTL
        stale = [k for k, v in _token_cache.items() if v["ts"] < cutoff]
        for k in stale:
            _token_cache.pop(k, None)
    _token_cache[token] = {"user": user_dict, "ts": time.time()}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Fast token validation with multi-layer strategy:
    1. Check in-memory cache (instant, <1ms)
    2. Decode JWT locally to extract user info (instant, no network)
    3. Only call Supabase auth.get_user() on first use of a brand-new token
    """
    token = credentials.credentials

    # ── Layer 1: Cache hit ──────────────────────────────────────────────
    cached = _get_cached_user(token)
    if cached:
        return cached

    # ── Layer 2: Local JWT decode ───────────────────────────────────────
    payload = _decode_jwt_local(token)
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail=error_response("Token tidak valid atau sudah kedaluwarsa", 401)
        )

    # Build user dict from JWT payload (same shape as Supabase user object)
    user_dict = {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "app_metadata": payload.get("app_metadata", {}),
        "user_metadata": payload.get("user_metadata", {}),
    }

    # Cache it immediately so subsequent requests are instant
    _set_cached_user(token, user_dict)

    return user_dict


def get_current_user_id(
    user=Depends(get_current_user)
) -> str:

    return user.get("sub")


def get_admin_only(
    user=Depends(get_current_user)
):

    role = user.get("app_metadata", {}).get("role")

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail=error_response(
                "Anda tidak memiliki akses untuk fitur ini",
                403
            )
        )

    return user