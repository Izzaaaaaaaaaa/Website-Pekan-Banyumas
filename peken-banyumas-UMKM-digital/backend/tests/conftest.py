"""
conftest.py — Shared fixtures untuk semua test.

Pendekatan:
  - Supabase DB calls di-mock via pytest-mock (patch db_select / db_insert / dll)
  - Auth middleware di-override via FastAPI dependency_overrides
  - Tidak ada koneksi real ke Supabase / internet
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# ── Patch Supabase client SEBELUM app di-import ───────────────────────────────
# Supabase client diinisialisasi saat module load — kalau env vars kosong akan
# raise RuntimeError. Patch dulu sebelum app diimport.
_mock_supabase  = MagicMock()
_mock_supabase_admin = MagicMock()
_mock_supabase_anon  = MagicMock()

import sys
import types

# Buat fake module app.db.supabase yang sudah berisi mock clients
_fake_db_mod = types.ModuleType("app.db.supabase")
_fake_db_mod.supabase        = _mock_supabase
_fake_db_mod.supabase_admin  = _mock_supabase_admin
_fake_db_mod.supabase_anon   = _mock_supabase_anon

# db_select / db_insert / db_update / db_delete — akan di-patch per test
# tapi sediakan default stub agar import tidak gagal
_fake_db_mod.db_select = MagicMock(return_value=[])
_fake_db_mod.db_insert = MagicMock(return_value={})
_fake_db_mod.db_update = MagicMock(return_value=[])
_fake_db_mod.db_delete = MagicMock(return_value=[])

sys.modules["app.db.supabase"] = _fake_db_mod

# Sekarang aman import app
from app.main import app
from app.middleware import get_current_user


# ── Artisan dummy yang dipakai di semua test ──────────────────────────────────
ARTISAN_ID   = "aaaaaaaa-0000-0000-0000-000000000001"
ARTISAN_USER = {
    "sub":   ARTISAN_ID,
    "email": "artisan@test.com",
    "role":  "artisan",
    "nama":  "Artisan Test",
}


def _override_auth():
    """Dependency override — skip Supabase token verify, return artisan dummy."""
    return ARTISAN_USER


@pytest.fixture(autouse=True)
def override_auth():
    """Pasang auth override untuk setiap test secara otomatis."""
    app.dependency_overrides[get_current_user] = _override_auth
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """FastAPI TestClient tanpa auth real."""
    return TestClient(app)


@pytest.fixture
def db(monkeypatch):
    """
    Kembalikan dict berisi mock functions DB yang mudah dikonfigurasi per test.

    Usage:
        def test_something(client, db):
            db["select"].return_value = [{"id": "...", ...}]
    """
    mocks = {
        "select": MagicMock(return_value=[]),
        "insert": MagicMock(return_value={}),
        "update": MagicMock(return_value=[]),
        "delete": MagicMock(return_value=[]),
    }

    # Patch di semua module yang mengimpor fungsi-fungsi ini
    targets = [
        "app.services.kas_service",
        "app.services.stok_service",
        "app.services.event_service",
        "app.services.notifikasi_service",
        "app.services.riwayat_service",
        "app.services.pengaturan_service",
        "app.routers.auth",
    ]
    for mod in targets:
        try:
            monkeypatch.setattr(f"{mod}.db_select", mocks["select"])
            monkeypatch.setattr(f"{mod}.db_insert", mocks["insert"])
            monkeypatch.setattr(f"{mod}.db_update", mocks["update"])
            monkeypatch.setattr(f"{mod}.db_delete", mocks["delete"])
        except AttributeError:
            pass  # modul tidak import semua fungsi — skip

    return mocks
