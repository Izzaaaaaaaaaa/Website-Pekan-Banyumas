"""
tests/test_smoke.py
───────────────────
Smoke tests for the Kolaborator backend (KOL-3).

Coverage:
  - Root & health endpoints (no auth required)
  - Login guard: every protected endpoint rejects requests with no token (401)
    and rejects non-kolaborator role (403)
  - Protected endpoints: GET requests with a valid kolaborator token → not 401/403
  - Register: schema validation (missing fields → 422)
  - /test/db removed: must be 404

These tests run fully offline — supabase client and JWT verification are mocked
in conftest.py. They are SMOKE tests, not integration tests, so they only assert
status-code contracts, not payload shapes.
"""

import pytest
from unittest.mock import patch, MagicMock


# =============================================================================
# 1.  Root & health — public, no auth needed
# =============================================================================

def test_root_ok(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["message"] == "Backend Kolaborator is running"


def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# =============================================================================
# 2.  KOL-1 verification: /test/db must be gone
# =============================================================================

def test_test_db_removed(client):
    r = client.get("/test/db")
    assert r.status_code == 404, (
        "/test/db debug endpoint must be removed (KOL-1). "
        f"Got {r.status_code} instead."
    )


# =============================================================================
# 3.  Login guard — no token → FastAPI HTTPBearer returns 403 when Authorization
#     header is absent (auto_error=True default). This is correct RFC-7235
#     behaviour; FastAPI uses 403 not 401 for missing Bearer.
# =============================================================================

PROTECTED_GETS = [
    "/api/dashboard/stats",
    "/api/events",
    "/api/events/my-requests",
    "/api/kolaborator/me",
    "/api/kolaborator/me/portofolio",
    "/api/kolaborator/me/story",
    "/api/notifikasi",
    "/api/pengaturan",
]


@pytest.mark.parametrize("path", PROTECTED_GETS)
def test_no_token_returns_403(client, path):
    """Missing Authorization header → HTTPBearer auto_error=True → 403."""
    r = client.get(path)
    assert r.status_code == 403, (
        f"Expected 403 for {path} without token, got {r.status_code}"
    )


# =============================================================================
# 4.  Login guard — wrong role (artisan) → 403
# =============================================================================

ARTISAN_PAYLOAD = {
    "sub": "00000000-0000-0000-0000-000000000099",
    "email": "artisan@peken.id",
    "app_metadata": {"role": "artisan", "status": "aktif"},
    "user_metadata": {"nama": "Test Artisan"},
}


@pytest.mark.parametrize("path", PROTECTED_GETS)
def test_wrong_role_returns_403(client, path):
    with patch(
        "app.api.deps.verify_supabase_token",
        return_value=ARTISAN_PAYLOAD,
    ):
        r = client.get(path, headers={"Authorization": "Bearer artisan-token"})
    assert r.status_code == 403, (
        f"Expected 403 for {path} with artisan role, got {r.status_code}"
    )


# =============================================================================
# 5.  Authenticated GET — valid kolaborator token → data returned (not 401/403)
# =============================================================================

@pytest.mark.parametrize("path", PROTECTED_GETS)
def test_authed_gets_not_401_403(authed_client, path):
    r = authed_client.get(path)
    assert r.status_code not in (401, 403), (
        f"Authenticated GET {path} returned {r.status_code} — auth guard broken"
    )


# =============================================================================
# 6.  Register — schema validation (no live Supabase needed)
# =============================================================================

def test_register_missing_fields_returns_422(client):
    """Missing required fields → FastAPI/Pydantic returns 422 Unprocessable Entity."""
    r = client.post("/api/auth/register", json={})
    assert r.status_code == 422


def test_register_invalid_email_returns_422(client):
    r = client.post("/api/auth/register", json={
        "email": "not-an-email",
        "password": "pass1234",
        "nama": "Test",
        "kota": "Purwokerto",
        "subsektor": ["Kuliner"],
    })
    assert r.status_code == 422


# =============================================================================
# 7.  Profile update — PATCH schema validation
# =============================================================================

def test_profile_update_empty_body_not_500(authed_client):
    """Empty PATCH body must not crash the server (422 or 200 are both valid)."""
    r = authed_client.patch("/api/kolaborator/me", json={})
    assert r.status_code != 500


# =============================================================================
# 8.  Story CRUD — unauthenticated → 401; authenticated → not 401/403
# =============================================================================

def test_story_list_no_token(client):
    r = client.get("/api/kolaborator/me/story")
    assert r.status_code == 403  # HTTPBearer: missing token → 403


def test_story_list_authed(authed_client):
    r = authed_client.get("/api/kolaborator/me/story")
    assert r.status_code not in (401, 403)


def test_story_delete_no_token(client):
    r = client.delete("/api/kolaborator/me/story/00000000-0000-0000-0000-000000000001")
    assert r.status_code == 403  # HTTPBearer: missing token → 403


# =============================================================================
# 9.  Portofolio CRUD — smoke
# =============================================================================

def test_portofolio_list_authed(authed_client):
    r = authed_client.get("/api/kolaborator/me/portofolio")
    assert r.status_code not in (401, 403)


# =============================================================================
# 10. Event apply (POST kolaborator-requests) — no token → 401
# =============================================================================

def test_event_apply_no_token(client):
    r = client.post(
        "/api/events/00000000-0000-0000-0000-000000000001/kolaborator-requests",
        json={"peran": "peserta"},
    )
    assert r.status_code == 403  # HTTPBearer: missing token → 403
