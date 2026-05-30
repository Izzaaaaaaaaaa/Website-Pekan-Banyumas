"""Supabase Storage operations (upload / delete / public URL).

Used by UMKM backend for QRIS image upload to the `qris` bucket
(plan §12). The supabase-py storage client is sync; wrap in
`asyncio.to_thread()` for FastAPI compatibility.

Backend authenticates with service_role → bypasses bucket-level RLS,
so the BE can write to any path in any bucket. Per-app should:

1. Ensure the target bucket exists (created via Supabase UI / migration).
2. Validate content-type + size at the service layer BEFORE calling
   `upload()` (this wrapper does not enforce those constraints).
"""

from __future__ import annotations

import asyncio
from typing import Any

from supabase import Client, create_client


class SupabaseStorageClient:
    """Wrapper around `supabase.Client.storage`. Lifespan-scoped — one
    per app, reused across requests.
    """

    def __init__(self, url: str, service_role_key: str) -> None:
        if not url or not service_role_key:
            raise ValueError(
                "SupabaseStorageClient requires `url` and `service_role_key` "
                "(the anon key cannot bypass bucket RLS)"
            )
        self._client: Client = create_client(url, service_role_key)

    async def upload(
        self,
        bucket: str,
        path: str,
        data: bytes,
        *,
        content_type: str = "application/octet-stream",
        upsert: bool = True,
    ) -> str:
        """Upload bytes to `bucket/path`. Returns the public URL.

        `upsert=True` replaces existing objects at the same path (used
        for QRIS — each artisan has at most one QRIS file).
        """

        def _call() -> str:
            file_options: dict[str, Any] = {
                "content-type": content_type,
                "upsert": "true" if upsert else "false",
            }
            # supabase-py declares FileOptions TypedDict but accepts plain dict at runtime
            self._client.storage.from_(bucket).upload(
                path=path,
                file=data,
                file_options=file_options,  # type: ignore[arg-type]
            )
            return self._client.storage.from_(bucket).get_public_url(path)

        return await asyncio.to_thread(_call)

    async def delete(self, bucket: str, path: str) -> None:
        """Remove a single object. No-op if the path doesn't exist."""

        def _call() -> None:
            self._client.storage.from_(bucket).remove([path])

        await asyncio.to_thread(_call)

    def get_public_url(self, bucket: str, path: str) -> str:
        """Return the public URL without an I/O round-trip (synchronous,
        no asyncio.to_thread needed)."""
        return self._client.storage.from_(bucket).get_public_url(path)


__all__ = ["SupabaseStorageClient"]
