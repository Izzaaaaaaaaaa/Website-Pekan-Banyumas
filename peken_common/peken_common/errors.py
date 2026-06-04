"""Application-level exception hierarchy + FastAPI handlers.

Every BE route that raises one of these gets a clean envelope response
with the right HTTP status. Pydantic `RequestValidationError` is also
mapped here (→ 422 with field-keyed `errors` dict).

Wire-up: each app calls `register_exception_handlers(app)` in `main.py`.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from peken_common.constants.error_messages import ErrorMessages
from peken_common.envelope import error_payload

if TYPE_CHECKING:
    pass


# ---------------------------------------------------------------------------
# Exception hierarchy
# ---------------------------------------------------------------------------


class AppError(Exception):
    """Base class for all BE-raised HTTP-mappable errors.

    Subclasses set `status_code` + a default `message_id`. Callers may
    override the message at the raise site for context (e.g.,
    `raise NotFoundError("Event tidak ditemukan")`).
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message_id: str = ErrorMessages.INTERNAL_ERROR

    def __init__(
        self,
        message: str | None = None,
        errors: dict[str, list[str]] | None = None,
    ) -> None:
        self.message: str = message or self.message_id
        self.errors: dict[str, list[str]] | None = errors
        super().__init__(self.message)


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    message_id = ErrorMessages.INVALID_REQUEST


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    message_id = ErrorMessages.SESSION_EXPIRED


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    message_id = ErrorMessages.FORBIDDEN


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    message_id = ErrorMessages.NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    message_id = ErrorMessages.DUPLICATE_REQUEST


class ValidationFailedError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    message_id = ErrorMessages.VALIDATION_FAILED


class NotImplementedStub(AppError):  # noqa: N818  (plan §14 mandates this name)
    """Raised by STUB endpoints (OTP, password reset by phone) per plan §14."""

    status_code = status.HTTP_501_NOT_IMPLEMENTED
    message_id = ErrorMessages.NOT_IMPLEMENTED


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def app_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Handler for `AppError` and subclasses."""
    assert isinstance(exc, AppError), "app_error_handler called with non-AppError"
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(exc.message, exc.errors),
    )


async def request_validation_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Handler for Pydantic `RequestValidationError` → 422.

    Flattens `loc` paths into `body.field.name` style and groups messages
    under the field key. `loc[0]` is the source ("body", "query", "path")
    and is dropped from the key.
    """
    assert isinstance(exc, RequestValidationError)
    errs: dict[str, list[str]] = {}
    for e in exc.errors():
        loc: tuple[Any, ...] = e.get("loc", ())
        key = ".".join(str(part) for part in loc[1:]) or "body"
        errs.setdefault(key, []).append(str(e.get("msg", "Invalid value")))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content=error_payload(ErrorMessages.VALIDATION_FAILED, errs),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Install handlers on a FastAPI app. Call once from `main.py`."""
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, request_validation_handler)


__all__ = [
    "AppError",
    "BadRequestError",
    "ConflictError",
    "ForbiddenError",
    "NotFoundError",
    "NotImplementedStub",
    "UnauthorizedError",
    "ValidationFailedError",
    "app_error_handler",
    "register_exception_handlers",
    "request_validation_handler",
]
