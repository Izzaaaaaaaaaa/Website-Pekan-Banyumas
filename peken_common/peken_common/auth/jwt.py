"""Supabase JWT decoder.

Supabase Auth issues access tokens whose signing scheme depends on the
project's JWT configuration:

* **Asymmetric signing keys** (the modern default for new projects) — tokens
  are signed with ES256/RS256 and the public keys are published as a JWKS at
  ``<SUPABASE_URL>/auth/v1/.well-known/jwks.json``.
* **Legacy HS256** — tokens are signed with the shared project JWT secret.

This module verifies both, dispatching on the token's ``alg`` header. The
JWKS is fetched lazily and cached (10-minute TTL); a ``kid`` miss forces an
immediate refetch so signing-key rotation is picked up without a restart.

We DO NOT verify ``aud`` (Supabase puts "authenticated" there and we don't
care to gate on it — role is the access decision). We DO verify exp (jose
does this automatically when `verify_exp` defaults to True).

JWT payload shape (relevant fields):

    {
      "sub": "<user_id>",
      "exp": 1707000000,
      "email": "user@example.com",
      "role": "authenticated",
      "app_metadata": { "role": "admin", "status": "aktif" },
      "user_metadata": { "nama": "Budi" }
    }

`app_metadata.role` is OUR role (admin|petugas|artisan|kolaborator).
`role` at the top level is Supabase's internal role (always
"authenticated" for logged-in users) — we ignore it.
"""

from __future__ import annotations

import json
import time
import urllib.request

from jose import jwt
from pydantic import BaseModel, ConfigDict

from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import UnauthorizedError


class CurrentUser(BaseModel):
    """Decoded JWT claims relevant to authorization."""

    model_config = ConfigDict(extra="ignore", frozen=True)

    id: str
    email: str
    role: str
    status: str | None = None


# Asymmetric algorithms a Supabase project may use for access tokens. HS256 is
# handled separately (shared secret, no JWKS lookup).
_ASYMMETRIC_ALGS = frozenset({"ES256", "ES384", "ES512", "RS256", "RS384", "RS512"})

# JWKS cache: {jwks_url: (fetched_at_epoch, {kid: jwk})}. Supabase rotates
# signing keys rarely, so a 10-minute TTL keeps the hot path free of network
# I/O while still bounding staleness. A `kid` miss triggers an out-of-band
# refetch (see `_resolve_signing_key`).
_JWKS_TTL_SECONDS = 600
_jwks_cache: dict[str, tuple[float, dict[str, dict]]] = {}


def _fetch_jwks(jwks_url: str, *, force: bool = False) -> dict[str, dict]:
    """Fetch the project JWKS and return it as a ``{kid: jwk}`` map.

    Cached per URL for `_JWKS_TTL_SECONDS`. On a network/parse failure a
    previously cached value is reused rather than failing the request; only a
    cold miss raises `UnauthorizedError`.
    """
    now = time.time()
    cached = _jwks_cache.get(jwks_url)
    if cached is not None and not force and now - cached[0] < _JWKS_TTL_SECONDS:
        return cached[1]
    try:
        request = urllib.request.Request(jwks_url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = json.loads(response.read().decode("utf-8"))
        keys = {k["kid"]: k for k in raw.get("keys", []) if k.get("kid")}
    except Exception as exc:  # network / parse failure
        if cached is not None:
            return cached[1]
        raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED) from exc
    _jwks_cache[jwks_url] = (now, keys)
    return keys


def _resolve_signing_key(kid: str | None, jwks_url: str) -> dict:
    """Return the JWK whose ``kid`` matches the token header, refetching the
    JWKS once if the key is absent (covers rotation between cache refreshes)."""
    if not kid:
        raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
    keys = _fetch_jwks(jwks_url)
    if kid not in keys:
        keys = _fetch_jwks(jwks_url, force=True)
    key = keys.get(kid)
    if key is None:
        raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
    return key


def decode_jwt(token: str, secret: str, jwks_url: str | None = None) -> CurrentUser:
    """Decode + verify a Supabase access token.

    HS256 tokens are verified against `secret`; ES256/RS256 tokens are
    verified against the project's JWKS at `jwks_url`. Raises
    `UnauthorizedError` on any failure — invalid signature, expired,
    malformed, unknown algorithm, missing `sub`, or an asymmetric token
    received without a `jwks_url` configured.

    The caller is responsible for stripping the `Bearer ` prefix.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")
        if alg in _ASYMMETRIC_ALGS:
            if not jwks_url:
                raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
            key: str | dict = _resolve_signing_key(header.get("kid"), jwks_url)
        elif alg == "HS256":
            key = secret
        else:
            raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
        payload = jwt.decode(token, key, algorithms=[alg], options={"verify_aud": False})
        sub = payload.get("sub")
        if not sub:
            raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
    except UnauthorizedError:
        raise
    except Exception as exc:
        # Any failure verifying an untrusted token surfaces as 401, never 500.
        raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED) from exc

    app_meta = payload.get("app_metadata") or {}
    return CurrentUser(
        id=str(sub),
        email=str(payload.get("email") or ""),
        role=str(app_meta.get("role") or ""),
        status=app_meta.get("status"),
    )


__all__ = ["CurrentUser", "decode_jwt"]
