"""Convenience builders for the response envelope (plan Section 24.11).

Use `success(data, message=None)` in routers to wrap your payload.
Use `error_payload(message, errors=None)` only from exception handlers;
in regular code, raise the appropriate `AppError` subclass instead.

These return plain `dict` (not Pydantic models) so they work uniformly
across `JSONResponse` and `Envelope[T]` response models.
"""

from __future__ import annotations

from typing import Any


def success(data: Any = None, message: str | None = None) -> dict[str, Any]:
    """Build a success envelope dict.

        >>> success({"id": 1})
        {'status': 'success', 'message': None, 'data': {'id': 1}}
        >>> success(None, message="Berhasil disimpan")
        {'status': 'success', 'message': 'Berhasil disimpan', 'data': None}
    """
    return {"status": "success", "message": message, "data": data}


def error_payload(
    message: str,
    errors: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    """Build an error envelope dict.

    `errors` is only populated for 422 validation failures. For other
    status codes, leave it None.

        >>> error_payload("Sesi Anda telah berakhir")
        {'status': 'error', 'message': 'Sesi Anda telah berakhir', 'data': None}
        >>> error_payload("Validasi gagal", {"email": ["wajib diisi"]})
        {'status': 'error', 'message': 'Validasi gagal', 'data': None, 'errors': {'email': ['wajib diisi']}}
    """
    payload: dict[str, Any] = {"status": "error", "message": message, "data": None}
    if errors:
        payload["errors"] = errors
    return payload


__all__ = ["error_payload", "success"]
