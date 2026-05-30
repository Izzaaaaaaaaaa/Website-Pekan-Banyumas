"""Peken Banyumasan shared library.

Provides envelope, errors, JWT auth, DB engine/session, storage wrapper,
shared Pydantic schemas, canonical constants (UMKM 9, BEKRAF 17),
and utility helpers consumed by all 4 FastAPI backends.

The public API is the re-exports below. Submodules are also importable
directly (`from peken_common.auth.jwt import decode_jwt`) — use whichever
is more readable at the call site.
"""

# Re-export the most commonly used names so app code can do, e.g.:
#     from peken_common import NotFoundError, success, configure_logging

from peken_common.envelope import error_payload, success
from peken_common.errors import (
    AppError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    NotImplementedStub,
    UnauthorizedError,
    ValidationFailedError,
    register_exception_handlers,
)
from peken_common.logging_setup import configure_logging
from peken_common.middleware import install_request_context_middleware, setup_cors

__version__ = "2.3.0"

__all__ = [
    "AppError",
    "BadRequestError",
    "ConflictError",
    "ForbiddenError",
    "NotFoundError",
    "NotImplementedStub",
    "UnauthorizedError",
    "ValidationFailedError",
    "__version__",
    "configure_logging",
    "error_payload",
    "install_request_context_middleware",
    "register_exception_handlers",
    "setup_cors",
    "success",
]
