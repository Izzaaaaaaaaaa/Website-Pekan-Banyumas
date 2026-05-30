"""structlog JSON logger configuration (plan Section 11).

One call per process: `configure_logging(level="INFO")` in `main.py`
before any logger is acquired. Output is JSON-per-line on stdout, which
HF Spaces / Cloud Run / Fly.io all capture as structured log entries.

Conventions:
- Use `structlog.get_logger()` everywhere; never `print()`.
- Bind request-scoped context (request_id, user_id) in middleware so
  every log line within a request carries the same correlation id.
"""

from __future__ import annotations

import logging
import sys
from typing import Final

import structlog

_VALID_LEVELS: Final[set[str]] = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}


def configure_logging(level: str = "INFO") -> None:
    """Initialize structlog + stdlib logging.

    Idempotent: safe to call multiple times (e.g., in test fixtures).

    `level` is the minimum level emitted. Anything below is dropped.
    """
    level_up = level.upper()
    if level_up not in _VALID_LEVELS:
        raise ValueError(f"Invalid log level: {level!r}. Expected one of {_VALID_LEVELS}.")
    numeric = getattr(logging, level_up)

    # Configure stdlib so libraries that use logging (asyncpg, supabase, etc.)
    # flow through stdout at the requested level.
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=numeric,
        force=True,
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(numeric),
        context_class=dict,
        cache_logger_on_first_use=True,
    )


__all__ = ["configure_logging"]
