"""FastAPI dependency factories for auth.

Two layers:

1. `make_get_current_user(secret, supabase_url)` — returns a FastAPI
   dependency that verifies the Bearer JWT (HS256 via the per-app secret,
   or ES256/RS256 via the project JWKS). Each backend builds its own
   `get_current_user` from this factory in `app/core/dependencies.py`:

       # app/core/dependencies.py
       from peken_common.auth.dependencies import make_get_current_user, require_role
       from app.config import settings

       get_current_user = make_get_current_user(
           settings.SUPABASE_JWT_SECRET, settings.SUPABASE_URL
       )
       require_admin = require_role(get_current_user, "admin")

2. `require_role(get_current_user, *roles)` — returns a dependency that
   enforces (a) role match, (b) status == "aktif" (or None — applies to
   freshly-issued tokens before metadata is set).

NOTE: this module does NOT use `from __future__ import annotations`.

Rationale: FastAPI reads `Depends(...)` metadata from `Annotated[X, Depends(Y)]`
at runtime via `typing.get_type_hints`. PEP 563 stringifies annotations,
and `Depends(get_current_user)` inside a closure cannot round-trip through
that stringification — the metadata gets lost and FastAPI treats the param
as a request body field. Keep this module annotation-runtime to preserve
dependency injection.
"""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Header

from peken_common.auth.jwt import CurrentUser, decode_jwt
from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import ForbiddenError, UnauthorizedError

# A dependency callable that yields a CurrentUser. Used as the input to
# `require_role` so peken_common is decoupled from per-app settings.
CurrentUserDep = Callable[..., Awaitable[CurrentUser]] | Callable[..., CurrentUser]


def make_get_current_user(jwt_secret: str, supabase_url: str = "") -> CurrentUserDep:
    """Build a FastAPI dependency that verifies the Bearer JWT.

    `jwt_secret` verifies legacy HS256 tokens. `supabase_url` is the Supabase
    project URL — it locates the JWKS used to verify modern ES256/RS256
    access tokens, so pass it for any backend that authenticates real users.

    Returns a coroutine usable as `Depends(get_current_user)`.
    """
    jwks_url = (
        f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        if supabase_url
        else None
    )

    async def get_current_user(
        authorization: Annotated[str | None, Header()] = None,
    ) -> CurrentUser:
        if not authorization or not authorization.startswith("Bearer "):
            raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            raise UnauthorizedError(ErrorMessages.SESSION_EXPIRED)
        return decode_jwt(token, jwt_secret, jwks_url)

    return get_current_user


# Statuses that pass the gate. `None` covers tokens issued before
# `app_metadata.status` is mirrored (race window during register).
_ALLOWED_STATUSES: frozenset[str | None] = frozenset({None, "aktif"})


def require_role(
    get_current_user: CurrentUserDep,
    *allowed_roles: str,
) -> Callable[..., CurrentUser]:
    """Build a dependency that asserts the user's role and active status.

    Pass at least one allowed role. Example:

        require_admin = require_role(get_current_user, "admin")
        require_admin_or_petugas = require_role(get_current_user, "admin", "petugas")
        require_artisan = require_role(get_current_user, "artisan")
    """
    if not allowed_roles:
        raise ValueError("require_role needs at least one allowed role")
    allowed = frozenset(allowed_roles)

    def dep(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.role not in allowed:
            raise ForbiddenError(ErrorMessages.FORBIDDEN)
        if user.status not in _ALLOWED_STATUSES:
            # Surface a more specific message for non-aktif statuses where useful.
            msg = {
                "pending": ErrorMessages.ACCOUNT_PENDING,
                "suspended": ErrorMessages.ACCOUNT_SUSPENDED,
                "rejected": ErrorMessages.ACCOUNT_REJECTED,
                "disabled": ErrorMessages.ACCOUNT_NOT_ACTIVE,
            }.get(user.status or "", ErrorMessages.ACCOUNT_NOT_ACTIVE)
            raise ForbiddenError(msg)
        return user

    return dep


__all__ = ["CurrentUserDep", "make_get_current_user", "require_role"]
