"""
tests/conftest.py
─────────────────
Shared fixtures for Kolaborator backend smoke tests.

Strategy:
  - Uses FastAPI TestClient (httpx-backed, no running server needed).
  - Mocks `verify_supabase_token` so tests never need a real Supabase JWT.
  - Mocks the supabase client table calls with MagicMock so tests never
    hit the real DB.
  - Two fixtures:
      client          — unauthenticated (no Authorization header)
      authed_client   — has Authorization: Bearer <fake-token>
                        The token resolves to a fixture kolaborator user.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Canonical test user (what verify_supabase_token will return)
# ---------------------------------------------------------------------------
FAKE_USER_ID = "00000000-0000-0000-0000-000000000001"
FAKE_JWT_PAYLOAD = {
    "sub": FAKE_USER_ID,
    "email": "test@peken.id",
    "app_metadata": {"role": "kolaborator", "status": "aktif"},
    "user_metadata": {"nama": "Test Kolaborator"},
}

FAKE_TOKEN = "fake-kolaborator-jwt"


# ---------------------------------------------------------------------------
# Supabase mock factory
# Builds a mock supabase client where .table(x).select(...).eq(...).execute()
# returns a result object with .data = []  by default.
# Individual tests can override the mock for specific tables.
# ---------------------------------------------------------------------------
def _make_supabase_mock():
    """Build a MagicMock supabase client that won't crash on any chained call.

    MagicMock auto-creates child mocks for any attribute access, so most chains
    work out of the box. We only need to wire .execute() to return an object with
    .data = [] so routes don't raise AttributeError when reading result.data.
    """
    mock = MagicMock()
    result = MagicMock()
    result.data = []
    result.count = 0

    # Wire the most common supabase-py call chains used by the routes
    tbl = mock.table.return_value
    tbl.select.return_value.execute.return_value = result
    tbl.select.return_value.eq.return_value.execute.return_value = result
    tbl.select.return_value.eq.return_value.limit.return_value.execute.return_value = result
    tbl.select.return_value.limit.return_value.execute.return_value = result
    tbl.select.return_value.maybe_single.return_value.execute.return_value = result
    tbl.insert.return_value.execute.return_value = result
    tbl.update.return_value.eq.return_value.execute.return_value = result
    tbl.delete.return_value.eq.return_value.execute.return_value = result
    mock.rpc.return_value.execute.return_value = result
    return mock


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def client():
    """Unauthenticated TestClient."""
    with patch("app.db.supabase.supabase", _make_supabase_mock()):
        from app.main import app
        with TestClient(app, raise_server_exceptions=True) as c:
            yield c


@pytest.fixture(scope="module")
def authed_client():
    """Authenticated TestClient — token resolves to a fixture kolaborator user."""
    with (
        patch("app.db.supabase.supabase", _make_supabase_mock()),
        patch(
            # Patch where verify_supabase_token is *used* (imported into deps),
            # not where it is defined (security.py). This is the standard Python
            # mock pattern for imported names.
            "app.api.deps.verify_supabase_token",
            return_value=FAKE_JWT_PAYLOAD,
        ),
    ):
        from app.main import app
        with TestClient(app, raise_server_exceptions=True) as c:
            c.headers.update({"Authorization": f"Bearer {FAKE_TOKEN}"})
            yield c
