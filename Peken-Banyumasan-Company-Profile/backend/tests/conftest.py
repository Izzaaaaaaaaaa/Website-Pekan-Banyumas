"""Pytest fixtures for the CP backend.

Strategy: FastAPI TestClient + dependency overrides at the SERVICE level.
No real DB needed — each test provides a stub service that returns
canned data. This isolates HTTP-layer tests from infrastructure.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.api.v1.deps import (
    get_company_profile_service,
    get_public_event_service,
    get_public_karya_service,
    get_public_profile_service,
    get_public_program_service,
    get_public_stats_service,
)
from app.core.dependencies import get_db_session
from app.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    """Vanilla TestClient. Each test overrides the deps it needs."""
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def fake_session() -> AsyncMock:
    """A no-op AsyncSession stub. Used by `/health` which calls
    `session.execute(text('SELECT 1'))` — the mock simply succeeds.
    """
    s = AsyncMock()
    s.execute = AsyncMock(return_value=AsyncMock())
    return s


@pytest.fixture
def override_session(fake_session: AsyncMock) -> Iterator[AsyncMock]:
    """Override `get_db_session` to yield the fake session."""

    async def _override() -> Any:
        yield fake_session

    app.dependency_overrides[get_db_session] = _override
    yield fake_session


def _override_service(dep: Any, stub: Any) -> None:
    """Helper: register a stub service for a dep."""
    app.dependency_overrides[dep] = lambda: stub


@pytest.fixture
def stub_company_profile_service() -> Iterator[AsyncMock]:
    stub = AsyncMock()
    _override_service(get_company_profile_service, stub)
    yield stub


@pytest.fixture
def stub_event_service() -> Iterator[AsyncMock]:
    stub = AsyncMock()
    _override_service(get_public_event_service, stub)
    yield stub


@pytest.fixture
def stub_karya_service() -> Iterator[AsyncMock]:
    stub = AsyncMock()
    _override_service(get_public_karya_service, stub)
    yield stub


@pytest.fixture
def stub_profile_service() -> Iterator[AsyncMock]:
    stub = AsyncMock()
    _override_service(get_public_profile_service, stub)
    yield stub


@pytest.fixture
def stub_program_service() -> Iterator[AsyncMock]:
    stub = AsyncMock()
    _override_service(get_public_program_service, stub)
    yield stub


@pytest.fixture
def stub_stats_service() -> Iterator[AsyncMock]:
    stub = AsyncMock()
    _override_service(get_public_stats_service, stub)
    yield stub
