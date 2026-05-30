"""Supabase Admin SDK wrapper (plan Section 6.3).

The supabase-py admin client is synchronous; we wrap each call in
`asyncio.to_thread()` so it plays nicely with FastAPI's event loop.

Per-app instantiates a single `SupabaseAdminClient(url, service_role_key)`
in its `app/core/dependencies.py` (lifespan-scoped, not per-request).

Operations exposed:
- `create_user(email, password, app_metadata, user_metadata) -> dict`
- `update_user_metadata(user_id, app_metadata) -> dict`
- `set_banned_until(user_id, until)` — petugas disable mechanism
- `send_password_reset(email)` — magic link
- `delete_user(user_id)` — cascades to public.* via FK
- `update_password(user_id, password)` — admin-set temp password

All return the raw Supabase response dict; callers extract the bits they
need. Errors propagate as `supabase.AuthApiError` — callers should catch
and re-raise as `ConflictError` / `BadRequestError` with friendly
Bahasa Indonesia messages.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from supabase import Client, create_client


class SupabaseAdminClient:
    """Wrapper around `supabase.Client.auth.admin`.

    Instantiate once per app and reuse. The underlying httpx client
    pools connections internally.
    """

    def __init__(self, url: str, service_role_key: str) -> None:
        if not url or not service_role_key:
            raise ValueError(
                "SupabaseAdminClient requires both `url` and `service_role_key` "
                "(the anon key is NOT sufficient for admin operations)"
            )
        self._client: Client = create_client(url, service_role_key)

    # ----------------------------------------------------------------------
    # User lifecycle
    # ----------------------------------------------------------------------

    async def create_user(
        self,
        email: str,
        password: str,
        *,
        app_metadata: dict[str, Any] | None = None,
        user_metadata: dict[str, Any] | None = None,
        email_confirm: bool = True,
    ) -> dict[str, Any]:
        """Create a new Auth user. `email_confirm=True` skips the email
        verification step (BE owns the verification flow elsewhere).
        """

        def _call() -> dict[str, Any]:
            res = self._client.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": email_confirm,
                    "app_metadata": app_metadata or {},
                    "user_metadata": user_metadata or {},
                }
            )
            return _to_dict(res.user) if res.user else {}

        return await asyncio.to_thread(_call)

    async def update_user_metadata(
        self,
        user_id: str,
        app_metadata: dict[str, Any],
    ) -> dict[str, Any]:
        """Patch `app_metadata` (used for role/status sync).

        Keys in `app_metadata` are MERGED with existing values by
        Supabase; null a key to delete it.
        """

        def _call() -> dict[str, Any]:
            res = self._client.auth.admin.update_user_by_id(
                user_id, {"app_metadata": app_metadata}
            )
            return _to_dict(res.user) if res.user else {}

        return await asyncio.to_thread(_call)

    async def update_password(self, user_id: str, password: str) -> dict[str, Any]:
        """Admin-set a new password (used by petugas reset-password
        `temp_password` mode).
        """

        def _call() -> dict[str, Any]:
            res = self._client.auth.admin.update_user_by_id(user_id, {"password": password})
            return _to_dict(res.user) if res.user else {}

        return await asyncio.to_thread(_call)

    async def update_email(self, user_id: str, email: str) -> dict[str, Any]:
        """Admin-set a new email (used by petugas patch `email` field).

        Updates `auth.users.email` directly via the Admin SDK. Does NOT
        send a verification email (admin is authoritative). The caller
        is responsible for mirroring any DB-side email columns.
        """

        def _call() -> dict[str, Any]:
            res = self._client.auth.admin.update_user_by_id(
                user_id, {"email": email, "email_confirm": True}
            )
            return _to_dict(res.user) if res.user else {}

        return await asyncio.to_thread(_call)

    async def set_banned_until(self, user_id: str, until: datetime | None) -> dict[str, Any]:
        """Petugas disable mechanism (plan §15.2, Decision Log D-16).

        Pass `None` to UN-ban (clears banned_until). Supabase ignores the
        field when null; we explicitly send `"none"` as the string per
        the GoTrue admin API contract.
        """
        payload = "none" if until is None else until.isoformat()

        def _call() -> dict[str, Any]:
            res = self._client.auth.admin.update_user_by_id(
                user_id, {"ban_duration": payload}  # type: ignore[arg-type]
            )
            return _to_dict(res.user) if res.user else {}

        return await asyncio.to_thread(_call)

    async def delete_user(self, user_id: str) -> None:
        """Hard-delete an Auth user. Cascades to `public.users_profile`
        and downstream tables via FK ON DELETE CASCADE.
        """

        def _call() -> None:
            self._client.auth.admin.delete_user(user_id)

        await asyncio.to_thread(_call)

    # ----------------------------------------------------------------------
    # Password reset
    # ----------------------------------------------------------------------

    async def send_password_reset(self, email: str, redirect_to: str | None = None) -> None:
        """Send a magic-link password-reset email. The link redirects to
        `redirect_to` (FE deep link) after the user clicks it.
        """

        def _call() -> None:
            self._client.auth.reset_password_email(
                email, {"redirect_to": redirect_to} if redirect_to else None  # type: ignore[arg-type]
            )

        await asyncio.to_thread(_call)


def _to_dict(obj: Any) -> dict[str, Any]:
    """Convert a Supabase Pydantic-like response object to plain dict."""
    if obj is None:
        return {}
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if isinstance(obj, dict):
        return obj
    return {"raw": str(obj)}


__all__ = ["SupabaseAdminClient"]
