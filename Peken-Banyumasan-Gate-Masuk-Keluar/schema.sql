-- =============================================================================
-- Peken Banyumasan — Unified Supabase Postgres Schema
-- Version : 2.4.0
-- Date    : 2026-05-29
-- Source  : This file is the SINGLE source of truth for the DB contract.
--           All 4 OpenAPI YAMLs were read-audited before this rewrite.
--           Apply via: Supabase SQL Editor → paste and run as one migration.
--
-- OpenAPI specs (openapi-*.yaml) and this schema must be kept in sync.
-- When changing one, bump version and update the other to match.
-- DO NOT write to this file via ALTER — rewrite in full when changes needed.
--
-- SUPABASE STORAGE (managed outside this file, in storage schema):
--   Active bucket: `peken-uploads` (public read, authenticated write).
--     Provisioned 2026-05-25. Used by every image upload across all 4 apps
--     via `frontend/src/lib/uploadImage.js` (`supabase.storage.from(...)`).
--     Folder prefixes by domain: cp/, event/, profil/, qris/, bukti/, story/,
--     portofolio/, karya/.
--   See db/SCHEMA_MAP.md Storage section for bucket definition + RLS.
--
-- LEGACY TABLES (kept for backward compat — NO LONGER USED by frontends):
--   `otp_codes`, `password_reset_tokens` — pre-Supabase-Auth tokens. Since
--     PR #49 (2026-05-28) the forgot-password flow uses Supabase Auth native
--     (`supabase.auth.resetPasswordForEmail` → email link → `updateUser`).
--     The artisan/colab OpenAPI specs still document `/api/auth/otp/*` and
--     `/api/auth/password/reset` as stubs; the frontends no longer call them.
--     SAFE TO DROP these two tables after 90-day retention period
--     (2026-08-28+) if no rollback needed.
-- =============================================================================

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  SCHEMA MAP  —  read this before touching any table                      ║
-- ║  Full details: db/SCHEMA_MAP.md  (human-readable companion)              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- Canonical naming (IMMUTABLE):
--   artisans.kategori_usaha[]  → UMKM 9  (F&B / Kuliner, Kriya, Fashion,
--                                          Kosmetik, Furnitur, Aksesoris,
--                                          Pertanian, Peternakan, Lainnya)
--   kolaborators.subsektor[]   → BEKRAF 17 (Kuliner, Kriya, Fashion, Musik, …)
--   events.subsektor[]         → BEKRAF 17
--   karya.subsektor            → SINGULAR string (NOT array)
--   Roles                      → admin | petugas | artisan | kolaborator
--
-- PUBLIC READ WARNING (R9):
--   artisans table has sensitive cols (email, no_hp, komisi_persen, financials).
--   Public profile endpoint MUST use backend with explicit SELECT projection.
--   Never query artisans with anon key directly.
--
-- Stand cross-ref: event_artisans.stand_id (TEXT 'A-3') → zones.stands[].id
--   No FK — backend validates before insert.
--
-- Artisan request re-request: artisan_requests has UNIQUE(event_id,artisan_id).
--   Backend hard-deletes rejected rows to allow re-request.
--
-- ┌─────────────────┬──────────────────────────────┬─────────────────────────┐
-- │ Table           │ OpenAPI schema               │ RLS summary             │
-- ├─────────────────┼──────────────────────────────┼─────────────────────────┤
-- │ users_profile   │ base auth (all YAMLs)        │ own+admin read          │
-- │ artisans        │ Artisan (artisan/gate YAMLs) │ pub aktif, own, admin,  │
-- │                 │ PublicProfile (companyprof)  │ petugas read            │
-- │ kolaborators    │ Kolaborator (colab/gate)     │ pub aktif, own, admin,  │
-- │                 │                              │ petugas read            │
-- │ events          │ Event/EventPublic (all)      │ pub published+, admin,  │
-- │                 │                              │ petugas read            │
-- │ event_kolabors  │ EventKolaborator (gate)      │ admin, petugas read     │
-- │ event_artisans  │ EventArtisan (gate)          │ admin, petugas read     │
-- │ artisan_reqs    │ ArtisanRequest (gate)        │ artisan own, admin      │
-- │ kolaborator_reqs│ KolaboratorRequest (gate)    │ kolaborator own, admin  │
-- │ zones           │ Zone (gate/artisan)          │ admin, petugas read     │
-- │ karya           │ Karya (all 4 YAMLs)          │ public, own, admin      │
-- │ stories         │ Story (all 4 YAMLs)          │ pub aktif, kolabr own,  │
-- │                 │                              │ admin read+soft-delete  │
-- │ stok            │ Stok (artisan/gate)          │ artisan own             │
-- │ kas             │ Kas (artisan/gate)           │ artisan own             │
-- │ promo           │ Promo (artisan/gate)         │ artisan own             │
-- │ cps             │ opaque JSONB (companyprof/   │ public read, admin,     │
-- │                 │ gate)                        │ petugas read            │
-- │ programs        │ Program (companyprof/gate)   │ pub aktif, admin,       │
-- │                 │                              │ petugas read            │
-- │ visitors        │ Visitor (gate)               │ admin, petugas RW       │
-- │ notifikasi      │ Notifikasi (all portals)     │ own read+update         │
-- │ otp_codes       │ OTP flow (artisan/colab)     │ service_role only       │
-- │ password_reset  │ reset flow (artisan/colab)   │ service_role only       │
-- └─────────────────┴──────────────────────────────┴─────────────────────────┘
--
-- Computed fields (written by trigger — never write directly):
--   artisans.total_penjualan, artisans.komisi_terkumpul
--   kolaborators.total_karya, kolaborators.total_story, kolaborators.total_event
--   events.peserta_count
--   kas.saldo_after  (written by backend business logic, not DB trigger)
--
-- =============================================================================


-- =============================================================================
-- SECTION 0 — TEARDOWN (idempotent — safe to re-run on non-empty dev DB)
-- =============================================================================
-- WHY: Allows this entire file to be re-applied on a Supabase project that
--      already has a previous version of this schema, without manual cleanup.
--      Re-paste in SQL Editor → drops all v2.x objects → re-creates fresh.
--
-- WARNING: This wipes ALL DATA in the listed tables. NEVER run on production.
--          For production migrations, write incremental ALTER scripts in
--          db/migrations/vX.X.X_<desc>.sql and apply those instead.
--
-- WHAT IS DROPPED:
--   * 20 tables in public schema  (CASCADE drops their indexes,
--     triggers, RLS policies, CHECK + FK constraints automatically)
--   * 12 functions in public schema (4 helpers + 8 trigger functions)
--
-- WHAT IS *NOT* DROPPED (intentional):
--   * Extensions uuid-ossp, pgcrypto — kept; idempotent via
--     CREATE EXTENSION IF NOT EXISTS in Section 1. Default values
--     uuid_generate_v4() and gen_random_bytes() depend on them.
--   * Schemas auth.*, storage.* (Supabase-managed)
--   * Storage buckets, Edge Functions, scheduled jobs (configured outside SQL)
--   * Any custom objects added manually outside this file
--
-- IF YOU WANT A FULLY CLEAN PUBLIC SCHEMA (nuclear):
--   DROP SCHEMA public CASCADE;
--   CREATE SCHEMA public;
--   GRANT ALL ON SCHEMA public TO postgres;
--   GRANT ALL ON SCHEMA public TO public;
--   -- then re-run this entire file from SECTION 1.
-- =============================================================================

-- 0.1  Drop tables (reverse FK-dependency order; CASCADE drops indexes,
--                   triggers, RLS policies, and FK/CHECK constraints).
DROP TABLE IF EXISTS public.password_reset_tokens     CASCADE;
DROP TABLE IF EXISTS public.otp_codes                 CASCADE;
DROP TABLE IF EXISTS public.notifikasi                CASCADE;
DROP TABLE IF EXISTS public.visitors                  CASCADE;
DROP TABLE IF EXISTS public.promo                     CASCADE;
DROP TABLE IF EXISTS public.kas                       CASCADE;
DROP TABLE IF EXISTS public.stok                      CASCADE;
DROP TABLE IF EXISTS public.stories                   CASCADE;
DROP TABLE IF EXISTS public.karya                     CASCADE;
DROP TABLE IF EXISTS public.zones                     CASCADE;
DROP TABLE IF EXISTS public.kolaborator_requests      CASCADE;
DROP TABLE IF EXISTS public.artisan_requests          CASCADE;
DROP TABLE IF EXISTS public.event_artisans            CASCADE;
DROP TABLE IF EXISTS public.event_kolaborators        CASCADE;
DROP TABLE IF EXISTS public.programs                  CASCADE;
DROP TABLE IF EXISTS public.company_profile_sections  CASCADE;
DROP TABLE IF EXISTS public.events                    CASCADE;
DROP TABLE IF EXISTS public.kolaborators              CASCADE;
DROP TABLE IF EXISTS public.artisans                  CASCADE;
DROP TABLE IF EXISTS public.users_profile             CASCADE;

-- 0.2  Drop functions (triggers were dropped with their parent tables;
--                      functions persist independently — drop them here).

-- 0.2.1 Trigger functions (Section 4) — reverse order of definition
DROP FUNCTION IF EXISTS public.update_kolaborator_counts()    CASCADE;
DROP FUNCTION IF EXISTS public.update_event_peserta_count()   CASCADE;
DROP FUNCTION IF EXISTS public.recount_event_peserta(UUID)    CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_role()               CASCADE;
DROP FUNCTION IF EXISTS public.touch_qris_updated_at()        CASCADE;
DROP FUNCTION IF EXISTS public.set_kolaborator_slug()         CASCADE;
DROP FUNCTION IF EXISTS public.set_artisan_slug()             CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at()               CASCADE;

-- 0.2.2 Helper functions (Section 2)
DROP FUNCTION IF EXISTS public.slugify(TEXT)                  CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_petugas()          CASCADE;
DROP FUNCTION IF EXISTS public.is_admin()                     CASCADE;
DROP FUNCTION IF EXISTS public.jwt_role()                     CASCADE;


-- =============================================================================
-- SECTION 1 — Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- SECTION 2 — Helper functions
-- =============================================================================

-- Extract role from Supabase JWT app_metadata
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
    SELECT coalesce(
        (auth.jwt() -> 'app_metadata' ->> 'role'),
        ''
    );
$$;

-- Role shorthand helpers used by RLS policies (D35)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT public.jwt_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_petugas()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT public.jwt_role() IN ('admin', 'petugas');
$$;

-- Slug generator: lowercase-hyphen, strips diacritics + special chars.
-- Order matters: lower() FIRST, then translate diacritics, then collapse any
-- run of non-alphanumerics to a single hyphen, then trim edge hyphens.
-- (Earlier version stripped chars while still mixed-case, so the [a-z]-only
-- class deleted every UPPERCASE letter — "Kolab Test" became "olab-est".)
-- Mirrors peken_common/lib/slugify.py exactly.
CREATE OR REPLACE FUNCTION public.slugify(v_text TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
    RETURN trim(BOTH '-' FROM
        regexp_replace(
            translate(
                lower(trim(v_text)),
                'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
                'aaaaaaaceeeeiiiidnoooooouuuuyby'),
            '[^a-z0-9]+', '-', 'g')
    );
END;
$$;


-- =============================================================================
-- SECTION 3 — Tables (20 tables in dependency order)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3.1  users_profile
--      Extends Supabase auth.users (auth schema managed by Supabase).
--      D1:  role CHECK adds 'petugas'
--      D21: adds jabatan, extra JSONB, updated_at
-- ---------------------------------------------------------------------------
CREATE TABLE public.users_profile (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama        TEXT        NOT NULL,
    role        TEXT        NOT NULL
                            CHECK (role IN ('admin', 'artisan', 'kolaborator', 'petugas')),
    jabatan     TEXT,                                -- job title; petugas/admin use (D21)
    extra       JSONB       NOT NULL DEFAULT '{}',   -- extensible custom fields (D21)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- auto-set by trg_users_profile_updated_at
);

COMMENT ON TABLE public.users_profile IS
  'One-to-one extension of auth.users. Stores role + display name. '
  'Credentials (email, password) remain in auth.users. '
  'Backend uses service_role key — bypasses all RLS.';


-- ---------------------------------------------------------------------------
-- 3.2  artisans  (depends: users_profile)
--      D2:  adds username NOT NULL UNIQUE
--      D3:  adds qris_updated_at TIMESTAMPTZ NULL
-- ---------------------------------------------------------------------------
CREATE TABLE public.artisans (
    id               UUID          PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
    -- email mirrored from auth.users; backend syncs on register/update (D22)
    email            TEXT,
    -- D2: user-chosen handle for public profile URL
    username         TEXT          NOT NULL UNIQUE
                                   CHECK (username ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
    -- auto-generated from nama_usaha via trg_artisans_slug
    slug             TEXT          NOT NULL UNIQUE,
    nama_usaha       TEXT          NOT NULL DEFAULT '',
    pemilik          TEXT          NOT NULL DEFAULT '',
    no_hp            TEXT          NOT NULL DEFAULT '',
    kota             TEXT          NOT NULL DEFAULT '',
    deskripsi        TEXT          NOT NULL DEFAULT '',
    -- admin-only; never project into /api/public/* or /api/artisan/me responses (R9)
    internal_notes   TEXT          NOT NULL DEFAULT '',
    foto_url         TEXT,
    cover_url        TEXT,
    qris_url         TEXT,
    -- D3: auto-set by trg_artisans_qris_ts when qris_url changes
    qris_updated_at  TIMESTAMPTZ,
    -- UMKM 9 categories (NOT subsektor — that is only for kolaborator/events)
    kategori_usaha   TEXT[]        NOT NULL DEFAULT '{}',
    status           TEXT          NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('aktif', 'pending', 'suspended', 'rejected')),
    komisi_persen    NUMERIC(5,2)  NOT NULL DEFAULT 0
                                   CHECK (komisi_persen BETWEEN 0 AND 100),
    tanggal_daftar   DATE          NOT NULL DEFAULT CURRENT_DATE,
    -- computed aggregates — do not write directly (D24)
    total_penjualan  NUMERIC(15,2) NOT NULL DEFAULT 0,
    komisi_terkumpul NUMERIC(15,2) NOT NULL DEFAULT 0,
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.artisans.email IS
  'Mirrored from auth.users.email; backend syncs on register and profile update.';
COMMENT ON COLUMN public.artisans.total_penjualan IS
  'Computed by backend business logic from kas masuk Penjualan entries; do not write directly.';
COMMENT ON COLUMN public.artisans.komisi_terkumpul IS
  'Computed by backend: total_penjualan * komisi_persen / 100; do not write directly.';
COMMENT ON COLUMN public.artisans.internal_notes IS
  'Admin-only metadata (never exposed via /api/public/* or /api/artisan/me). '
  'Edited from Gate admin Artisan edit drawer only.';
COMMENT ON TABLE public.artisans IS
  'Artisan/UMKM profile. '
  'Reports aggregate SQL — /api/reports/artisan: '
  'SELECT a.id, a.nama_usaha, array_to_string(a.kategori_usaha,'', '') AS kategori, '
  'SUM(k.nominal) FILTER (WHERE k.jenis=''masuk'') AS omset, '
  'a.komisi_persen, COUNT(k.id) FILTER (WHERE k.jenis=''masuk'') AS transaksi, '
  'COUNT(DISTINCT ea.event_id) AS event_count '
  'FROM artisans a LEFT JOIN kas k ON k.artisan_id=a.id '
  'LEFT JOIN event_artisans ea ON ea.artisan_id=a.id GROUP BY a.id;';

CREATE INDEX idx_artisans_status   ON public.artisans(status);
CREATE INDEX idx_artisans_kota     ON public.artisans(kota);
CREATE INDEX idx_artisans_slug     ON public.artisans(slug);


-- ---------------------------------------------------------------------------
-- 3.3  kolaborators  (depends: users_profile)
-- ---------------------------------------------------------------------------
CREATE TABLE public.kolaborators (
    id             UUID          PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
    -- email mirrored from auth.users (D22)
    email          TEXT,
    nama           TEXT          NOT NULL DEFAULT '',
    kota           TEXT          NOT NULL DEFAULT '',
    bio            TEXT          NOT NULL DEFAULT '',
    -- admin-collected only; never project into /api/public/* or /api/kolaborator/me responses (R9)
    no_hp          TEXT          NOT NULL DEFAULT '',
    -- admin-only; never project into /api/public/* or /api/kolaborator/me responses (R9)
    internal_notes TEXT          NOT NULL DEFAULT '',
    foto_url       TEXT,
    cover_url      TEXT,
    -- BEKRAF 17 subsectors (NOT kategori_usaha)
    subsektor      TEXT[]        NOT NULL DEFAULT '{}',
    status         TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('aktif', 'pending', 'suspended', 'rejected')),
    tanggal_daftar DATE          NOT NULL DEFAULT CURRENT_DATE,
    -- computed aggregates — do not write directly (D24)
    total_karya    INT           NOT NULL DEFAULT 0,
    total_story    INT           NOT NULL DEFAULT 0,
    total_event    INT           NOT NULL DEFAULT 0,
    -- auto-generated from nama via trg_kolaborators_slug
    slug           TEXT          NOT NULL UNIQUE,
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.kolaborators.email IS
  'Mirrored from auth.users.email; backend syncs on register and profile update.';
COMMENT ON COLUMN public.kolaborators.total_karya  IS 'Computed by DB trigger; do not write directly.';
COMMENT ON COLUMN public.kolaborators.total_story  IS 'Computed by DB trigger; do not write directly.';
COMMENT ON COLUMN public.kolaborators.total_event  IS 'Computed by DB trigger; do not write directly.';
COMMENT ON COLUMN public.kolaborators.no_hp IS
  'Phone number — admin-collected only. NEVER returned by /api/public/profiles/{slug} '
  '(see PublicProfile schema MUST NOT expose `no_hp`). Kolaborator portal does not edit this; '
  'Gate admin Kolaborator edit drawer is the only writer.';
COMMENT ON COLUMN public.kolaborators.internal_notes IS
  'Admin-only metadata (never exposed via /api/public/* or /api/kolaborator/me). '
  'Edited from Gate admin Kolaborator edit drawer only.';

CREATE INDEX idx_kolaborators_status ON public.kolaborators(status);
CREATE INDEX idx_kolaborators_kota   ON public.kolaborators(kota);
CREATE INDEX idx_kolaborators_slug   ON public.kolaborators(slug);


-- ---------------------------------------------------------------------------
-- 3.4  events
--      D6: kapasitas nullable (NULL = unlimited)
--      D7: konten_lengkap nullable
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama            TEXT          NOT NULL,
    tanggal         DATE          NOT NULL,
    tanggal_selesai DATE          NOT NULL,
    jam_mulai       TIME          NOT NULL,
    jam_selesai     TIME          NOT NULL,
    lokasi          TEXT          NOT NULL DEFAULT '',
    status          TEXT          NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'published', 'berlangsung', 'selesai')),
    -- D6: NULL = unlimited capacity; 0 was misleading
    kapasitas       INT,
    -- computed by triggers — do not write directly (D24)
    peserta_count   INT           NOT NULL DEFAULT 0,
    deskripsi       TEXT          NOT NULL DEFAULT '',
    -- D7: nullable — not all events have long-form content
    konten_lengkap  TEXT,
    -- BEKRAF 17 subsektor (NOT kategori_usaha)
    subsektor       TEXT[]        NOT NULL DEFAULT '{}',
    banner_url      TEXT,
    galeri          TEXT[]        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.events.kapasitas     IS 'NULL = unlimited capacity; integer = max visitor count.';
COMMENT ON COLUMN public.events.peserta_count IS 'Computed by trg_evkol_count + trg_evart_count; do not write directly.';
COMMENT ON TABLE  public.events IS
  'Accumulation report SQL — /api/reports/accumulation: '
  'SELECT e.id, e.nama, e.tanggal, e.status, '
  'COUNT(v.id) AS pengunjung, '
  'COUNT(DISTINCT ea.artisan_id) FILTER (WHERE ea.status_request=''approved'') AS artisan_count, '
  'COUNT(DISTINCT ek.kolaborator_id) FILTER (WHERE ek.status_kehadiran!=''dibatalkan'') AS kolaborator_count '
  'FROM events e LEFT JOIN visitors v ON v.event_id=e.id '
  'LEFT JOIN event_artisans ea ON ea.event_id=e.id '
  'LEFT JOIN event_kolaborators ek ON ek.event_id=e.id GROUP BY e.id;';

CREATE INDEX idx_events_status  ON public.events(status);
CREATE INDEX idx_events_tanggal ON public.events(tanggal);


-- ---------------------------------------------------------------------------
-- 3.5  event_kolaborators  (depends: events, kolaborators)
--      updated_at added for audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_kolaborators (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id         UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    kolaborator_id   UUID        NOT NULL REFERENCES public.kolaborators(id) ON DELETE CASCADE,
    peran            TEXT        NOT NULL DEFAULT 'peserta'
                                 CHECK (peran IN ('performer', 'panitia', 'peserta')),
    status_kehadiran TEXT        NOT NULL DEFAULT 'terdaftar'
                                 CHECK (status_kehadiran IN ('terdaftar', 'hadir', 'tidak_hadir', 'dibatalkan')),
    assigned_by      TEXT        NOT NULL DEFAULT 'admin'
                                 CHECK (assigned_by IN ('admin', 'self')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, kolaborator_id)
);

CREATE INDEX idx_evkol_event       ON public.event_kolaborators(event_id);
CREATE INDEX idx_evkol_kolaborator ON public.event_kolaborators(kolaborator_id);


-- ---------------------------------------------------------------------------
-- 3.6  event_artisans  (depends: events, artisans)
--      stand_id cross-refs zones.stands[].id — no FK, backend validates
--      updated_at added for audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_artisans (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id       UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    artisan_id     UUID        NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
    stand_id       TEXT,                    -- e.g. 'A-3'; cross-refs zones.stands[].id
    posisi_event   TEXT,                    -- display alias for stand_id
    status_request TEXT        NOT NULL DEFAULT 'approved'
                               CHECK (status_request IN ('pending', 'pending_change', 'approved', 'rejected')),
    assigned_by    TEXT        NOT NULL DEFAULT 'admin'
                               CHECK (assigned_by IN ('admin', 'self')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, artisan_id)
);

COMMENT ON COLUMN public.event_artisans.stand_id IS
  'Cross-references zones.stands[].id (TEXT, e.g. ''A-3''). No FK — backend validates existence.';

CREATE INDEX idx_evart_event   ON public.event_artisans(event_id);
CREATE INDEX idx_evart_artisan ON public.event_artisans(artisan_id);


-- ---------------------------------------------------------------------------
-- 3.7  artisan_requests  (depends: events, artisans)
--      assigned_by is always ''self'' — artisans self-register
--      UNIQUE(event_id, artisan_id): backend deletes rejected rows to allow re-request
-- ---------------------------------------------------------------------------
CREATE TABLE public.artisan_requests (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id       UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    artisan_id     UUID        NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
    posisi_event   TEXT,                    -- requested stand_id
    status_request TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status_request IN ('pending', 'pending_change', 'approved', 'rejected')),
    change_request TEXT,                    -- new stand_id for pending_change status
    assigned_by    TEXT        NOT NULL DEFAULT 'self'
                               CHECK (assigned_by IN ('admin', 'self')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, artisan_id)
);

COMMENT ON TABLE public.artisan_requests IS
  'Artisan self-join request queue. assigned_by is always ''self''. '
  'Backend hard-deletes rejected rows to allow re-request (UNIQUE constraint would block otherwise). '
  'Approved requests move data to event_artisans.';
COMMENT ON COLUMN public.artisan_requests.change_request IS
  'New desired stand_id when status=''pending_change''. Admin responds via respondPositionChange.';

CREATE INDEX idx_artreq_event   ON public.artisan_requests(event_id);
CREATE INDEX idx_artreq_artisan ON public.artisan_requests(artisan_id);
CREATE INDEX idx_artreq_status  ON public.artisan_requests(status_request);


-- ---------------------------------------------------------------------------
-- 3.8  kolaborator_requests  (depends: events, kolaborators)
-- ---------------------------------------------------------------------------
CREATE TABLE public.kolaborator_requests (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id       UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    kolaborator_id UUID        NOT NULL REFERENCES public.kolaborators(id) ON DELETE CASCADE,
    peran          TEXT        NOT NULL DEFAULT 'peserta'
                               CHECK (peran IN ('performer', 'panitia', 'peserta')),
    status         TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kolreq_event       ON public.kolaborator_requests(event_id);
CREATE INDEX idx_kolreq_kolaborator ON public.kolaborator_requests(kolaborator_id);
CREATE INDEX idx_kolreq_status      ON public.kolaborator_requests(status);


-- ---------------------------------------------------------------------------
-- 3.9  zones
--      stands: JSONB array of { id, label, kategori }
--      stands[].id cross-referenced by event_artisans.stand_id
-- ---------------------------------------------------------------------------
CREATE TABLE public.zones (
    id      UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    zona    CHAR(1) NOT NULL UNIQUE,          -- 'A', 'B', 'C', 'P'
    label   TEXT    NOT NULL,                 -- 'Zona A – Kriya & Fashion'
    warna   TEXT    NOT NULL DEFAULT '#8B5E3C',
    urutan  INT     NOT NULL DEFAULT 0,
    stands  JSONB   NOT NULL DEFAULT '[]'     -- array of {id, label, kategori}
);

COMMENT ON COLUMN public.zones.stands IS
  'Denormalized stand layout: [{id:"A-1",label:"A-1",kategori:"kriya"}, ...]. '
  'Per-event occupancy is derived from event_artisans.stand_id — no separate stands table.';


-- ---------------------------------------------------------------------------
-- 3.10  karya  (polymorphic: artisan OR kolaborator)
--       D8:  tahun NOT NULL
--       D27: subsektor has no DEFAULT (caller must provide)
-- ---------------------------------------------------------------------------
CREATE TABLE public.karya (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type  TEXT        NOT NULL CHECK (owner_type IN ('artisan', 'kolaborator')),
    owner_id    UUID        NOT NULL,  -- artisans.id OR kolaborators.id (no FK — polymorphic)
    judul       TEXT        NOT NULL,
    -- SINGULAR string (NOT array). Required — no default (D27)
    subsektor   TEXT        NOT NULL,
    deskripsi   TEXT        NOT NULL DEFAULT '',
    -- Required per OpenAPI Karya.required; fresh DB → no backfill needed (D8)
    tahun       INT         NOT NULL,
    gambar_url  TEXT,
    featured    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.karya.subsektor IS
  'SINGULAR string (NOT array). BEKRAF subsektor. Caller must always provide — no default.';
COMMENT ON COLUMN public.karya.tahun IS
  'Year of creation. Required per OpenAPI Karya.required.';

CREATE INDEX idx_karya_owner     ON public.karya(owner_type, owner_id);
CREATE INDEX idx_karya_featured  ON public.karya(featured);
CREATE INDEX idx_karya_subsektor ON public.karya(subsektor);


-- ---------------------------------------------------------------------------
-- 3.11  stories  (polymorphic: artisan OR kolaborator)
--       D36: adds updated_at for soft-delete audit
-- ---------------------------------------------------------------------------
CREATE TABLE public.stories (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_type TEXT        NOT NULL CHECK (author_type IN ('artisan', 'kolaborator')),
    author_id   UUID        NOT NULL,  -- polymorphic author
    konten      TEXT        NOT NULL,
    media_url   TEXT,
    tags        TEXT[]      NOT NULL DEFAULT '{}',
    like_count  INT         NOT NULL DEFAULT 0,
    status      TEXT        NOT NULL DEFAULT 'aktif'
                            CHECK (status IN ('aktif', 'dihapus', 'disembunyikan')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- for soft-delete audit (D36)
);

COMMENT ON COLUMN public.stories.status IS
  'Soft-delete: kolaborator DELETE → backend sets status=''dihapus''. '
  'Admin moderation can set status=''disembunyikan''.';

CREATE INDEX idx_stories_author  ON public.stories(author_type, author_id);
CREATE INDEX idx_stories_status  ON public.stories(status);
CREATE INDEX idx_stories_created ON public.stories(created_at DESC);


-- ---------------------------------------------------------------------------
-- 3.12  stok  (depends: artisans)
-- ---------------------------------------------------------------------------
CREATE TABLE public.stok (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    artisan_id  UUID          NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
    nama        TEXT          NOT NULL,
    harga       NUMERIC(15,2) NOT NULL DEFAULT 0,
    stok        INT           NOT NULL DEFAULT 0,
    kategori    TEXT          NOT NULL DEFAULT '',
    satuan      TEXT          NOT NULL DEFAULT 'pcs',
    deskripsi   TEXT          NOT NULL DEFAULT '',
    stok_min    INT           NOT NULL DEFAULT 0,     -- FE warns when stok <= stok_min
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stok_artisan ON public.stok(artisan_id);


-- ---------------------------------------------------------------------------
-- 3.13  kas  (depends: artisans)
--       D4: qty INT → NUMERIC(10,2)  (supports fractional, e.g. 0.5 kg)
--       D5: adds CHECK on metode enum
-- ---------------------------------------------------------------------------
CREATE TABLE public.kas (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    artisan_id  UUID          NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
    jenis       TEXT          NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
    kategori    TEXT          NOT NULL DEFAULT '',
    pelanggan   TEXT,
    barang      TEXT,
    -- D4: NUMERIC allows fractional quantities (e.g. 0.5 kg of produce)
    qty         NUMERIC(10,2) NOT NULL DEFAULT 1,
    -- D5: enum enforced at DB level
    metode      TEXT          NOT NULL DEFAULT 'tunai'
                              CHECK (metode IN ('tunai', 'qris')),
    ket         TEXT          NOT NULL DEFAULT '',
    nominal     NUMERIC(15,2) NOT NULL DEFAULT 0,
    tgl         DATE          NOT NULL DEFAULT CURRENT_DATE,
    -- D24: computed by backend on insert/update — do not write directly
    saldo_after NUMERIC(15,2) NOT NULL DEFAULT 0,
    bukti_url   TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.kas.qty IS
  'NUMERIC(10,2) — supports fractional quantities (e.g. 0.5 kg). Was INT in v1.0.';
COMMENT ON COLUMN public.kas.metode IS
  'Payment method enum: tunai | qris. (transfer dihapus v2.2.2 — ngikut FE)';
COMMENT ON COLUMN public.kas.saldo_after IS
  'Running balance after this transaction, computed by backend on every kas mutation. '
  'Do not write directly.';

CREATE INDEX idx_kas_artisan ON public.kas(artisan_id);
CREATE INDEX idx_kas_tgl     ON public.kas(tgl);
CREATE INDEX idx_kas_jenis   ON public.kas(jenis);


-- ---------------------------------------------------------------------------
-- 3.14  promo  (depends: artisans)
-- ---------------------------------------------------------------------------
CREATE TABLE public.promo (
    id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    artisan_id     UUID          NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
    nama           TEXT          NOT NULL,
    produk         TEXT          NOT NULL,
    diskon         NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (diskon BETWEEN 0 AND 100),
    kategori       TEXT          NOT NULL DEFAULT '',
    deskripsi      TEXT          NOT NULL DEFAULT '',
    berlaku_start  DATE          NOT NULL,
    berlaku_end    DATE          NOT NULL,
    aktif          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_artisan ON public.promo(artisan_id);
CREATE INDEX idx_promo_aktif   ON public.promo(aktif);


-- ---------------------------------------------------------------------------
-- 3.15  company_profile_sections
--       Content shape is FE-driven and opaque — stored as raw JSONB.
-- ---------------------------------------------------------------------------
CREATE TABLE public.company_profile_sections (
    section     TEXT        PRIMARY KEY
                            CHECK (section IN ('home', 'about', 'tim', 'programs', 'works', 'gallery')),
    content     JSONB       NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.company_profile_sections IS
  'JSONB content is opaque — shape per section is decided by frontend. '
  'Backend stores and returns as-is without validation.';


-- ---------------------------------------------------------------------------
-- 3.16  programs
--       D32: adds icon_url TEXT NULL
-- ---------------------------------------------------------------------------
CREATE TABLE public.programs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        TEXT        UNIQUE NOT NULL,
    nama        TEXT        NOT NULL,
    icon        TEXT        NOT NULL DEFAULT '',   -- emoji/text icon
    icon_url    TEXT,                              -- CDN icon URL (D32)
    deskripsi   TEXT        NOT NULL DEFAULT '',
    konten      TEXT        NOT NULL DEFAULT '',   -- markdown
    urutan      INT         NOT NULL DEFAULT 0,
    aktif       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.programs.icon_url IS
  'CDN-friendly program icon/image URL alongside emoji icon field. Nullable. Added in v2.0 (D32).';


-- ---------------------------------------------------------------------------
-- 3.17  visitors  (depends: events)
-- ---------------------------------------------------------------------------
CREATE TABLE public.visitors (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id     UUID        REFERENCES public.events(id) ON DELETE SET NULL,
    nama         TEXT        NOT NULL DEFAULT 'Tamu',
    uid          TEXT,                   -- NFC/RFID card UID
    waktu_masuk  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    waktu_keluar TIMESTAMPTZ,            -- NULL if still inside
    status       TEXT        NOT NULL DEFAULT 'di_dalam'
                             CHECK (status IN ('di_dalam', 'keluar'))
);

CREATE INDEX idx_visitors_event  ON public.visitors(event_id);
CREATE INDEX idx_visitors_status ON public.visitors(status);
CREATE INDEX idx_visitors_masuk  ON public.visitors(waktu_masuk);


-- ---------------------------------------------------------------------------
-- 3.18  notifikasi  (depends: auth.users)
--       type is open TEXT — validated by backend, not DB (extensible)
--       D18: COMMENT documents allowed type values per role
-- ---------------------------------------------------------------------------
CREATE TABLE public.notifikasi (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT        NOT NULL DEFAULT 'system',
    title       TEXT        NOT NULL,
    message     TEXT        NOT NULL,
    read        BOOLEAN     NOT NULL DEFAULT FALSE,
    link        TEXT,
    detail      JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.notifikasi.type IS
  'Open TEXT — no CHECK constraint (extensible). Backend validates on insert. '
  'Artisan types: artisan_request_approved, artisan_request_rejected, '
  'position_change_approved, position_change_rejected, event_starting_soon, system. '
  'Kolaborator types: event_invite, event_starting_soon, karya_featured, system. '
  'Admin/petugas types: artisan_request, kolaborator_approved, event_published, '
  'aktivitas_flagged, system. '
  'FE renders generically via title/message/link — safe to add new types.';
COMMENT ON COLUMN public.notifikasi.read IS
  'Field name is ''read'' — NOT ''dibaca''. Boolean.';

CREATE INDEX idx_notifikasi_user    ON public.notifikasi(user_id);
CREATE INDEX idx_notifikasi_read    ON public.notifikasi(read);
CREATE INDEX idx_notifikasi_created ON public.notifikasi(created_at DESC);


-- ---------------------------------------------------------------------------
-- 3.19  otp_codes
--       D34: purpose CHECK adds 'register'
-- ---------------------------------------------------------------------------
CREATE TABLE public.otp_codes (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone       TEXT        NOT NULL,
    code        TEXT        NOT NULL,
    -- D34: 'register' added for registration OTP verification flow
    purpose     TEXT        NOT NULL DEFAULT 'password_reset'
                            CHECK (purpose IN ('password_reset', 'verify', 'register')),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone   ON public.otp_codes(phone);
CREATE INDEX idx_otp_expires ON public.otp_codes(expires_at);


-- ---------------------------------------------------------------------------
-- 3.20  password_reset_tokens  (depends: auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.password_reset_tokens (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_user    ON public.password_reset_tokens(user_id);
CREATE INDEX idx_reset_token   ON public.password_reset_tokens(token);
CREATE INDEX idx_reset_expires ON public.password_reset_tokens(expires_at);


-- =============================================================================
-- SECTION 4 — Triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1  Generic updated_at setter  (D10)
--      Used by 15 BEFORE UPDATE triggers below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- 15 BEFORE UPDATE triggers — one per timestamped table
CREATE TRIGGER trg_users_profile_updated_at
    BEFORE UPDATE ON public.users_profile
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_artisans_updated_at
    BEFORE UPDATE ON public.artisans
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_kolaborators_updated_at
    BEFORE UPDATE ON public.kolaborators
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_event_kolaborators_updated_at
    BEFORE UPDATE ON public.event_kolaborators
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_event_artisans_updated_at
    BEFORE UPDATE ON public.event_artisans
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_artisan_requests_updated_at
    BEFORE UPDATE ON public.artisan_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_kolaborator_requests_updated_at
    BEFORE UPDATE ON public.kolaborator_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_karya_updated_at
    BEFORE UPDATE ON public.karya
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_stok_updated_at
    BEFORE UPDATE ON public.stok
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_kas_updated_at
    BEFORE UPDATE ON public.kas
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_promo_updated_at
    BEFORE UPDATE ON public.promo
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_company_profile_sections_updated_at
    BEFORE UPDATE ON public.company_profile_sections
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 4.2  Artisan slug auto-generator  (D9a)
--      Fires BEFORE INSERT/UPDATE. Collision-safe: appends -2,-3,...-99,
--      then -{first8charsOfUUID} as final fallback.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_artisan_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_base   TEXT;
    v_slug   TEXT;
    v_suffix INT;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.slug IS NULL)
       OR (TG_OP = 'UPDATE' AND (NEW.slug IS NULL OR NEW.nama_usaha IS DISTINCT FROM OLD.nama_usaha))
    THEN
        v_base := public.slugify(NEW.nama_usaha);
        IF v_base = '' OR v_base IS NULL THEN v_base := 'artisan'; END IF;

        v_slug   := v_base;
        v_suffix := 2;

        LOOP
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.artisans
                WHERE slug = v_slug
                  AND id IS DISTINCT FROM NEW.id
            );
            IF v_suffix > 99 THEN
                v_slug := v_base || '-' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8);
                EXIT;
            END IF;
            v_slug   := v_base || '-' || v_suffix;
            v_suffix := v_suffix + 1;
        END LOOP;

        NEW.slug := v_slug;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_artisans_slug
    BEFORE INSERT OR UPDATE ON public.artisans
    FOR EACH ROW EXECUTE FUNCTION public.set_artisan_slug();


-- ---------------------------------------------------------------------------
-- 4.3  Kolaborator slug auto-generator  (D9b)
--      Same algorithm as artisan slug, uses kolaborators.nama field.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_kolaborator_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_base   TEXT;
    v_slug   TEXT;
    v_suffix INT;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.slug IS NULL)
       OR (TG_OP = 'UPDATE' AND (NEW.slug IS NULL OR NEW.nama IS DISTINCT FROM OLD.nama))
    THEN
        v_base := public.slugify(NEW.nama);
        IF v_base = '' OR v_base IS NULL THEN v_base := 'kolaborator'; END IF;

        v_slug   := v_base;
        v_suffix := 2;

        LOOP
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.kolaborators
                WHERE slug = v_slug
                  AND id IS DISTINCT FROM NEW.id
            );
            IF v_suffix > 99 THEN
                v_slug := v_base || '-' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8);
                EXIT;
            END IF;
            v_slug   := v_base || '-' || v_suffix;
            v_suffix := v_suffix + 1;
        END LOOP;

        NEW.slug := v_slug;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_kolaborators_slug
    BEFORE INSERT OR UPDATE ON public.kolaborators
    FOR EACH ROW EXECUTE FUNCTION public.set_kolaborator_slug();


-- ---------------------------------------------------------------------------
-- 4.4  QRIS updated_at timestamp  (D3b)
--      Sets qris_updated_at = NOW() when qris_url changes.
--      Both this trigger and trg_artisans_updated_at fire on UPDATE artisans;
--      both are BEFORE UPDATE, both modify NEW.* independently — PostgreSQL
--      chains them so the final NEW reflects both (R6).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_qris_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.qris_url IS DISTINCT FROM OLD.qris_url THEN
        NEW.qris_updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_artisans_qris_ts
    BEFORE UPDATE ON public.artisans
    FOR EACH ROW EXECUTE FUNCTION public.touch_qris_updated_at();


-- ---------------------------------------------------------------------------
-- 4.5  Sync role to Supabase auth.users app_metadata
--      Fallback for direct-DB inserts (seed scripts, migrations).
--      Preferred path: supabase.auth.admin.updateUserById() from backend.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE auth.users
    SET    raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role)
    WHERE  id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_user_role
    AFTER INSERT OR UPDATE OF role ON public.users_profile
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();


-- ---------------------------------------------------------------------------
-- 4.6  Event peserta_count  (patched for R7: handles UPDATE OF event_id)
--      Recounts both OLD.event_id and NEW.event_id when event_id changes.
-- ---------------------------------------------------------------------------

-- Top-level helper — PostgreSQL does not support nested function definitions.
CREATE OR REPLACE FUNCTION public.recount_event_peserta(p_event_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.events
    SET    peserta_count = (
               SELECT COUNT(*)
               FROM   public.event_kolaborators
               WHERE  event_id = p_event_id
                 AND  status_kehadiran != 'dibatalkan'
           ) + (
               SELECT COUNT(*)
               FROM   public.event_artisans
               WHERE  event_id = p_event_id
                 AND  status_request = 'approved'
           )
    WHERE  id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_event_peserta_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- R7: on UPDATE, if event_id changed, recount both old and new events
    IF TG_OP = 'UPDATE' AND NEW.event_id IS DISTINCT FROM OLD.event_id THEN
        PERFORM public.recount_event_peserta(OLD.event_id);
        PERFORM public.recount_event_peserta(NEW.event_id);
    ELSE
        PERFORM public.recount_event_peserta(COALESCE(NEW.event_id, OLD.event_id));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_evkol_count
    AFTER INSERT OR UPDATE OR DELETE ON public.event_kolaborators
    FOR EACH ROW EXECUTE FUNCTION public.update_event_peserta_count();

CREATE TRIGGER trg_evart_count
    AFTER INSERT OR UPDATE OR DELETE ON public.event_artisans
    FOR EACH ROW EXECUTE FUNCTION public.update_event_peserta_count();


-- ---------------------------------------------------------------------------
-- 4.7  Kolaborator aggregate counts
--      Handles karya (owner_id) and stories (author_id) — different column names.
--      Uses TG_TABLE_NAME to dispatch correctly (bugfix from v1.0).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_kolaborator_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_kol_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'karya' THEN
        v_kol_id := COALESCE(NEW.owner_id, OLD.owner_id);
    ELSIF TG_TABLE_NAME = 'stories' THEN
        v_kol_id := COALESCE(NEW.author_id, OLD.author_id);
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;

    UPDATE public.kolaborators
    SET
        total_karya = (
            SELECT COUNT(*) FROM public.karya
            WHERE  owner_type = 'kolaborator' AND owner_id = v_kol_id
        ),
        total_story = (
            SELECT COUNT(*) FROM public.stories
            WHERE  author_type = 'kolaborator' AND author_id = v_kol_id
              AND  status = 'aktif'
        ),
        total_event = (
            SELECT COUNT(*) FROM public.event_kolaborators
            WHERE  kolaborator_id = v_kol_id
              AND  status_kehadiran != 'dibatalkan'
        )
    WHERE id = v_kol_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- karya INSERT: only NEW is available → reference NEW.owner_type
CREATE TRIGGER trg_kolaborator_karya_insert
    AFTER INSERT ON public.karya
    FOR EACH ROW
    WHEN (NEW.owner_type = 'kolaborator')
    EXECUTE FUNCTION public.update_kolaborator_counts();

-- karya DELETE: only OLD is available → reference OLD.owner_type
CREATE TRIGGER trg_kolaborator_karya_delete
    AFTER DELETE ON public.karya
    FOR EACH ROW
    WHEN (OLD.owner_type = 'kolaborator')
    EXECUTE FUNCTION public.update_kolaborator_counts();

-- stories INSERT
CREATE TRIGGER trg_kolaborator_story_insert
    AFTER INSERT ON public.stories
    FOR EACH ROW
    WHEN (NEW.author_type = 'kolaborator')
    EXECUTE FUNCTION public.update_kolaborator_counts();

-- stories UPDATE OF status (soft-delete changes aktif count)
CREATE TRIGGER trg_kolaborator_story_update
    AFTER UPDATE OF status ON public.stories
    FOR EACH ROW
    WHEN (NEW.author_type = 'kolaborator')
    EXECUTE FUNCTION public.update_kolaborator_counts();

-- stories DELETE
CREATE TRIGGER trg_kolaborator_story_delete
    AFTER DELETE ON public.stories
    FOR EACH ROW
    WHEN (OLD.author_type = 'kolaborator')
    EXECUTE FUNCTION public.update_kolaborator_counts();


-- =============================================================================
-- SECTION 5 — Indexes (additional — primary keys and some BTREEs already above)
-- =============================================================================

-- D2b: username lookup (artisan profile URL)
CREATE INDEX idx_artisans_username ON public.artisans(username);

-- D11a: filter artisans by category
CREATE INDEX idx_artisans_kategori_gin ON public.artisans USING GIN (kategori_usaha);

-- D11b: filter kolaborators by subsector
CREATE INDEX idx_kolaborators_subsektor_gin ON public.kolaborators USING GIN (subsektor);

-- D11c: filter events by subsector
CREATE INDEX idx_events_subsektor_gin ON public.events USING GIN (subsektor);

-- D11d: events gallery search (optional)
CREATE INDEX idx_events_galeri_gin ON public.events USING GIN (galeri);

-- D11e: story tag search
CREATE INDEX idx_stories_tags_gin ON public.stories USING GIN (tags);

-- D12a: stand_id lookup within zone JSONB
CREATE INDEX idx_zones_stands_gin ON public.zones USING GIN (stands jsonb_path_ops);

-- D12b: filter notifications by detail keys
CREATE INDEX idx_notifikasi_detail_gin ON public.notifikasi USING GIN (detail jsonb_path_ops);

-- D12c: company profile section content lookup
CREATE INDEX idx_cps_content_gin ON public.company_profile_sections USING GIN (content jsonb_path_ops);

-- D31: NFC uid lookup. Visitors are an APPEND-ONLY event log — every masuk is
-- a `di_dalam` row and every keluar a separate `keluar` row — so a uid legitimately
-- has many `di_dalam` rows over time. (The former partial UNIQUE on
-- (uid) WHERE status='di_dalam' was dropped; it's incompatible with re-entry.)
CREATE INDEX idx_visitors_uid ON public.visitors (uid) WHERE uid IS NOT NULL;

-- D34b: OTP lookup by phone + purpose + expiry
CREATE INDEX idx_otp_phone_purpose ON public.otp_codes (phone, purpose, expires_at);


-- =============================================================================
-- SECTION 6 — Row Level Security
--   6.1  Enable RLS on all 20 tables
--   6.2  Public read (anon)
--   6.3  Artisan own-data
--   6.4  Kolaborator own-data
--   6.5  Admin full access
--   6.6  Petugas read + visitor RW  (D13a, D14)
--   6.7  Shared (notifikasi, users_profile)
--
--   NOTE: Backend uses service_role key → bypasses all RLS.
--         All policies apply only to direct anon/user key queries.
-- =============================================================================

-- 6.1  Enable RLS
ALTER TABLE public.users_profile            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kolaborators             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_kolaborators       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_artisans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kolaborator_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karya                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stok                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens    ENABLE ROW LEVEL SECURITY;

-- 6.2  Public read (anon key) — mirrors /api/public/* endpoints
CREATE POLICY "public_read_events"
    ON public.events FOR SELECT
    USING (status IN ('published', 'berlangsung', 'selesai'));

CREATE POLICY "public_read_company_profile"
    ON public.company_profile_sections FOR SELECT
    USING (TRUE);

CREATE POLICY "public_read_programs"
    ON public.programs FOR SELECT
    USING (aktif = TRUE);

CREATE POLICY "public_read_karya"
    ON public.karya FOR SELECT
    USING (TRUE);

CREATE POLICY "public_read_artisans_aktif"
    ON public.artisans FOR SELECT
    USING (status = 'aktif');

CREATE POLICY "public_read_kolaborators_aktif"
    ON public.kolaborators FOR SELECT
    USING (status = 'aktif');

CREATE POLICY "public_read_stories_aktif"
    ON public.stories FOR SELECT
    USING (status = 'aktif');

-- 6.3  Artisan own-data policies
CREATE POLICY "artisan_read_self"
    ON public.artisans FOR SELECT
    USING (public.jwt_role() = 'artisan' AND id = auth.uid());

CREATE POLICY "artisan_update_self"
    ON public.artisans FOR UPDATE
    USING (public.jwt_role() = 'artisan' AND id = auth.uid());

CREATE POLICY "artisan_manage_own_stok"
    ON public.stok FOR ALL
    USING (public.jwt_role() = 'artisan' AND artisan_id = auth.uid());

CREATE POLICY "artisan_manage_own_kas"
    ON public.kas FOR ALL
    USING (public.jwt_role() = 'artisan' AND artisan_id = auth.uid());

CREATE POLICY "artisan_manage_own_promo"
    ON public.promo FOR ALL
    USING (public.jwt_role() = 'artisan' AND artisan_id = auth.uid());

CREATE POLICY "artisan_manage_own_karya"
    ON public.karya FOR ALL
    USING (public.jwt_role() = 'artisan' AND owner_type = 'artisan' AND owner_id = auth.uid());

-- Defense-in-depth: explicit WITH CHECK so anon-key INSERT/UPDATE cannot
-- bypass the assigned_by='self' constraint or impersonate another artisan.
-- Backend already enforces this via service_role write-path validation,
-- but the WITH CHECK belt-and-suspenders the data integrity at DB level.
CREATE POLICY "artisan_manage_own_requests"
    ON public.artisan_requests FOR ALL
    USING       (public.jwt_role() = 'artisan' AND artisan_id = auth.uid())
    WITH CHECK  (public.jwt_role() = 'artisan' AND artisan_id = auth.uid()
                 AND assigned_by = 'self');

-- 6.4  Kolaborator own-data policies
CREATE POLICY "kolaborator_read_self"
    ON public.kolaborators FOR SELECT
    USING (public.jwt_role() = 'kolaborator' AND id = auth.uid());

CREATE POLICY "kolaborator_update_self"
    ON public.kolaborators FOR UPDATE
    USING (public.jwt_role() = 'kolaborator' AND id = auth.uid());

CREATE POLICY "kolaborator_manage_own_karya"
    ON public.karya FOR ALL
    USING (public.jwt_role() = 'kolaborator' AND owner_type = 'kolaborator' AND owner_id = auth.uid());

CREATE POLICY "kolaborator_manage_own_stories"
    ON public.stories FOR ALL
    USING (public.jwt_role() = 'kolaborator' AND author_type = 'kolaborator' AND author_id = auth.uid());

-- Defense-in-depth: explicit WITH CHECK so anon-key INSERT/UPDATE cannot
-- impersonate another kolaborator. (kolaborator_requests has no assigned_by
-- column — peran is the only role attribute, validated at backend.)
CREATE POLICY "kolaborator_manage_own_requests"
    ON public.kolaborator_requests FOR ALL
    USING      (public.jwt_role() = 'kolaborator' AND kolaborator_id = auth.uid())
    WITH CHECK (public.jwt_role() = 'kolaborator' AND kolaborator_id = auth.uid());

-- 6.5  Admin full-access policies (UNCHANGED from v1.0)
CREATE POLICY "admin_all_artisans"
    ON public.artisans FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_kolaborators"
    ON public.kolaborators FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_events"
    ON public.events FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_event_kolaborators"
    ON public.event_kolaborators FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_event_artisans"
    ON public.event_artisans FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_artisan_requests"
    ON public.artisan_requests FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_kolaborator_requests"
    ON public.kolaborator_requests FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_zones"
    ON public.zones FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_visitors"
    ON public.visitors FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_company_profile"
    ON public.company_profile_sections FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_programs"
    ON public.programs FOR ALL
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_read_stories"
    ON public.stories FOR SELECT
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_delete_stories"
    ON public.stories FOR UPDATE  -- soft-delete via status field
    USING (public.jwt_role() = 'admin');

CREATE POLICY "admin_all_karya"
    ON public.karya FOR ALL
    USING (public.jwt_role() = 'admin');

-- 6.6  Petugas read + visitor RW (D13a, D14)
--      gate yaml line 2200: endpoints marked "admin only" reject petugas with 403
--      Backend enforces admin-only at the API layer; DB gives petugas SELECT only.

-- D13a: petugas read-only on 8 tables
CREATE POLICY "petugas_read_events"
    ON public.events FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_artisans"
    ON public.artisans FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_kolaborators"
    ON public.kolaborators FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_event_kolaborators"
    ON public.event_kolaborators FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_event_artisans"
    ON public.event_artisans FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_zones"
    ON public.zones FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_programs"
    ON public.programs FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_read_company_profile"
    ON public.company_profile_sections FOR SELECT
    USING (public.jwt_role() = 'petugas');

-- D14: petugas visitor RW (SELECT + INSERT + UPDATE, NO delete)
CREATE POLICY "petugas_visitors_select"
    ON public.visitors FOR SELECT
    USING (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_visitors_insert"
    ON public.visitors FOR INSERT
    WITH CHECK (public.jwt_role() = 'petugas');

CREATE POLICY "petugas_visitors_update"
    ON public.visitors FOR UPDATE
    USING (public.jwt_role() = 'petugas');

-- visitors: NO public_read policy by design.
-- /api/public/stats endpoint computes aggregate counts via service_role
-- (bypasses RLS) — exposing only the COUNT(*) integer, never raw rows.
-- Row-level access remains restricted to admin (admin_all_visitors) and
-- petugas (petugas_visitors_*) only. Visitor identity (uid) is sensitive.

-- 6.7  Shared (all authenticated roles)
CREATE POLICY "auth_read_own_notifikasi"
    ON public.notifikasi FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "auth_update_own_notifikasi"
    ON public.notifikasi FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "auth_read_own_profile"
    ON public.users_profile FOR SELECT
    USING (id = auth.uid() OR public.jwt_role() = 'admin');

-- otp_codes & password_reset_tokens: NO policies by design.
-- RLS is ENABLED on both tables (see section 6.1) but no CREATE POLICY exists,
-- so Postgres default-deny applies for all anon/authenticated roles.
-- Backend uses service_role key for all OTP and reset-token operations
-- (issue, verify, mark used). This keeps single-use tokens out of any
-- client-readable scope and prevents enumeration attacks via the anon key.

-- Backend service_role key bypasses all RLS — no additional policies needed.


-- =============================================================================
-- SECTION 7 — Seed data
--   *** COMMENT OUT BEFORE PRODUCTION APPLY ***
--   These are development seeds for a fresh database.
--   Production: zones layout should be loaded by admin via Gate UI.
-- =============================================================================

-- Seed zone layout (stands denormalized as JSONB)
INSERT INTO public.zones (zona, label, warna, urutan, stands) VALUES
    ('A', 'Zona A – Kriya & Fashion',
     '#8B5E3C', 1,
     '[{"id":"A-1","label":"A-1","kategori":"kriya"},
       {"id":"A-2","label":"A-2","kategori":"kriya"},
       {"id":"A-3","label":"A-3","kategori":"fashion"},
       {"id":"A-4","label":"A-4","kategori":"fashion"},
       {"id":"A-5","label":"A-5","kategori":"kriya"}]'::jsonb),
    ('B', 'Zona B – F&B & Kuliner',
     '#D4A853', 2,
     '[{"id":"B-1","label":"B-1","kategori":"kuliner"},
       {"id":"B-2","label":"B-2","kategori":"kuliner"},
       {"id":"B-3","label":"B-3","kategori":"kuliner"},
       {"id":"B-4","label":"B-4","kategori":"fnb"},
       {"id":"B-5","label":"B-5","kategori":"fnb"},
       {"id":"B-6","label":"B-6","kategori":"fnb"},
       {"id":"B-7","label":"B-7","kategori":"kuliner"}]'::jsonb),
    ('C', 'Zona C – Digital & Jasa',
     '#4A7C59', 3,
     '[{"id":"C-1","label":"C-1","kategori":"digital"},
       {"id":"C-2","label":"C-2","kategori":"digital"},
       {"id":"C-3","label":"C-3","kategori":"jasa"},
       {"id":"C-4","label":"C-4","kategori":"jasa"}]'::jsonb),
    ('P', 'Panggung – Performer & Panitia',
     '#7C4A7C', 4,
     '[{"id":"P-1","label":"Panggung 1","kategori":"performer"},
       {"id":"P-2","label":"Panggung 2","kategori":"panitia"}]'::jsonb)
ON CONFLICT (zona) DO NOTHING;

-- Seed program list
INSERT INTO public.programs (slug, nama, icon, deskripsi, urutan) VALUES
    ('pelatihan-umkm',   'Pelatihan UMKM',    '🎓', 'Program pelatihan untuk pelaku UMKM',           1),
    ('inkubasi-bisnis',  'Inkubasi Bisnis',    '🚀', 'Program inkubasi bisnis tahap awal',            2),
    ('pameran-seni',     'Pameran Seni',       '🎨', 'Pameran karya seni kolaborator',                3),
    ('workshop-digital', 'Workshop Digital',   '💻', 'Workshop pemasaran digital dan e-commerce',     4),
    ('festival-budaya',  'Festival Budaya',    '🎭', 'Festival budaya dan pertunjukan seni',          5),
    ('bazaar-kreatif',   'Bazaar Kreatif',     '🛍️', 'Bazaar produk UMKM dan karya kolaborator',    6)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- SECTION 8 — VERIFICATION QUERIES (commented out — run manually if needed)
--   Same queries as db/verify_schema.sql embedded here for AI context.
--   An AI reading this file as attachment will see the audit logic too.
-- =============================================================================

/*

-- Q1: users_profile.role includes 'petugas'
SELECT check_clause FROM information_schema.check_constraints
WHERE constraint_schema='public' AND check_clause LIKE '%petugas%'
  AND constraint_name LIKE '%role%';
-- EXPECT: 1 row containing 'petugas'

-- Q2: artisans has username (NOT NULL,UNIQUE) and qris_updated_at
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='artisans'
  AND column_name IN ('username','qris_updated_at') ORDER BY column_name;
-- EXPECT: 2 rows: username is_nullable=NO, qris_updated_at is_nullable=YES

-- Q3: kas.qty is NUMERIC(10,2) and metode CHECK exists
SELECT column_name,data_type,numeric_precision,numeric_scale
FROM information_schema.columns
WHERE table_schema='public' AND table_name='kas' AND column_name='qty';
-- EXPECT: qty | numeric | 10 | 2

-- Q4: events.kapasitas and konten_lengkap are nullable
SELECT column_name,is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='events'
  AND column_name IN ('kapasitas','konten_lengkap') ORDER BY column_name;
-- EXPECT: both YES

-- Q5: karya.tahun is NOT NULL and subsektor has no default
SELECT column_name,is_nullable,column_default FROM information_schema.columns
WHERE table_schema='public' AND table_name='karya'
  AND column_name IN ('tahun','subsektor') ORDER BY column_name;
-- EXPECT: tahun NO null, subsektor NO null

-- Q6: All 8 GIN indexes exist
SELECT indexname,tablename FROM pg_indexes
WHERE schemaname='public' AND indexdef LIKE '%gin%'
ORDER BY tablename,indexname;
-- EXPECT: 8 rows

-- Q7: All 15 updated_at triggers exist
SELECT trigger_name,event_object_table FROM information_schema.triggers
WHERE trigger_schema='public' AND trigger_name LIKE 'trg_%_updated_at'
  AND event_manipulation='UPDATE' ORDER BY event_object_table;
-- EXPECT: 15 rows

-- Q8: slug and qris triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema='public'
  AND trigger_name IN ('trg_artisans_slug','trg_kolaborators_slug','trg_artisans_qris_ts');
-- EXPECT: 3 rows

-- Q9: All 11 petugas RLS policies exist
SELECT policyname,tablename,cmd FROM pg_policies
WHERE schemaname='public' AND policyname LIKE 'petugas%'
ORDER BY tablename,policyname;
-- EXPECT: 11 rows

-- Q10: visitors uid index exists (append-only log — NOT a partial UNIQUE;
-- the old uniq_visitors_active_uid was dropped to allow NFC re-entry).
SELECT indexname,indexdef FROM pg_indexes
WHERE schemaname='public' AND indexname='idx_visitors_uid';
-- EXPECT: 1 row, plain (non-unique) index on (uid) WHERE uid IS NOT NULL

-- Q11: programs.icon_url exists; users_profile has jabatan/extra/updated_at
SELECT column_name,is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='programs'
  AND column_name='icon_url';
-- EXPECT: icon_url | YES

-- Q12: otp_codes purpose includes 'register'
SELECT check_clause FROM information_schema.check_constraints
WHERE constraint_schema='public' AND check_clause LIKE '%register%'
  AND check_clause LIKE '%password_reset%';
-- EXPECT: 1 row

-- Q13: Required-field NOT NULL matrix (0 rows = all good)
WITH required_fields(tbl,col) AS (VALUES
  ('artisans','id'),('artisans','slug'),('artisans','username'),
  ('artisans','nama_usaha'),('artisans','pemilik'),('artisans','no_hp'),
  ('artisans','kota'),('artisans','kategori_usaha'),('artisans','status'),
  ('artisans','tanggal_daftar'),('artisans','komisi_persen'),
  ('kolaborators','id'),('kolaborators','slug'),('kolaborators','nama'),
  ('kolaborators','kota'),('kolaborators','bio'),('kolaborators','subsektor'),
  ('kolaborators','status'),('kolaborators','tanggal_daftar'),
  ('events','id'),('events','nama'),('events','tanggal'),
  ('events','tanggal_selesai'),('events','jam_mulai'),('events','jam_selesai'),
  ('events','lokasi'),('events','status'),('events','deskripsi'),('events','subsektor'),
  ('karya','id'),('karya','judul'),('karya','subsektor'),
  ('karya','deskripsi'),('karya','tahun'),('karya','featured'),
  ('kas','id'),('kas','jenis'),('kas','kategori'),('kas','metode'),
  ('kas','nominal'),('kas','tgl'),('kas','qty'),
  ('notifikasi','id'),('notifikasi','type'),('notifikasi','title'),
  ('notifikasi','message'),('notifikasi','read'),('notifikasi','created_at'),
  ('visitors','id'),('visitors','nama'),('visitors','waktu_masuk'),('visitors','status'),
  -- admin-only columns added in v2.1
  ('artisans','internal_notes'),
  ('kolaborators','no_hp'),
  ('kolaborators','internal_notes')
)
SELECT rf.tbl,rf.col,c.is_nullable FROM required_fields rf
JOIN information_schema.columns c
  ON c.table_schema='public' AND c.table_name=rf.tbl AND c.column_name=rf.col
WHERE c.is_nullable='YES' ORDER BY rf.tbl,rf.col;
-- EXPECT: 0 rows

*/

-- =============================================================================
-- END OF SCHEMA v2.4.0
-- =============================================================================
