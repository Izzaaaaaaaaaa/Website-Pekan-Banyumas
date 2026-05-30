# peken_common

Shared library used by all 4 Peken Banyumasan FastAPI backends.

**Status:** Skeleton (Phase 0). Implementation lands in Phase 1.

See `oke-ini-kan-untuk-precious-moon.md` Section 2.1 and Section 21.1 for layout
and Section 4.1 for the dependency lock.

## Modules (planned)

| Module | Responsibility |
|--------|----------------|
| `envelope.py` | Success / error response wrappers |
| `errors.py` | Exception hierarchy + handlers |
| `middleware.py` | request_id, timing, structured log |
| `auth/jwt.py` | Decode Supabase HS256 JWT |
| `auth/dependencies.py` | `require_role(...)` FastAPI deps |
| `auth/supabase_admin.py` | supabase-py Admin SDK wrapper |
| `auth/otp_service.py` | OTP gateway port + StubOtpGateway adapter |
| `db/engine.py` | SQLAlchemy AsyncEngine factory |
| `db/session.py` | AsyncSession dependency |
| `db/base_repository.py` | Generic Repository[T] base |
| `storage/supabase_storage.py` | Upload/delete wrapper |
| `schemas/*` | Envelope / pagination / enums Pydantic models |
| `constants/kategori_usaha.py` | UMKM 9 (mirrors FE constants) |
| `constants/subsektor.py` | BEKRAF 17 (mirrors FE constants) |
| `constants/error_messages.py` | Bahasa Indonesia error catalog |
| `lib/slugify.py` | Slug generator |
| `lib/timezone.py` | WIB ↔ UTC helpers |
| `lib/pagination.py` | Pagination helpers |
| `logging_setup.py` | structlog JSON config |
