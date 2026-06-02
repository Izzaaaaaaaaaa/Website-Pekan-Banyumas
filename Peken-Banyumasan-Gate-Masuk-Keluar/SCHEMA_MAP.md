# Peken Banyumasan — Database Schema Map

**Version:** 2.4.0  
**Date:** 2026-05-29  
**Source of truth:** `db/schema.sql` (the AI attachment — the ONLY file to modify or upload to AI sessions)  
**Companion handoff document:** `HANDOFF.md` (project-wide architecture, ops, AI consumption guide)  
**OpenAPI YAMLs** (synced with schema — bump version in both when changes needed):

| YAML | Paths | Role |
|------|-------|------|
| `openapi-companyprof.yaml` (722L, 8 paths) | `/api/public/*` | Public read-only |
| `openapi-colab.yaml` (1303L, 17 paths) | `/api/kolaborator/*`, `/api/events/*` | Kolaborator portal |
| `openapi-artisan.yaml` (1923L, 22 paths) | `/api/artisan/*`, `/api/events/*` | Artisan/UMKM portal |
| `openapi-gate.yaml` (3160L, 46 paths) | `/api/dashboard/*`, `/api/artisan/*`, `/api/kolaborator/*`, `/api/zones/*` | Admin/Petugas |

---

## Cross-Cutting Conventions

**ID Format:** UUID v4 in production. Mock data uses prefixed short IDs (`art-XXXX`, `kol-XXXX`, `evt-XXXX`, etc.) — frontend renders as-is. No ID prefixes in DB — UUIDs only.

**Timestamps:** UTC ISO 8601 (`2026-04-10T08:00:00.000Z`)  
**Date-only fields:** WIB local date `YYYY-MM-DD`  
**Time-only fields:** WIB 24-hour `HH:MM`  
**Money:** Rupiah (IDR), no currency symbol. Column type `NUMERIC(15,2)`.  
**Response envelope:** `{ status, message, data }` — backend MUST always wrap.

### Canonical Naming (IMMUTABLE — non-negotiable)

| Field | Values | Table |
|-------|--------|-------|
| `artisans.kategori_usaha[]` | UMKM 9: `F&B / Kuliner`, `Kriya`, `Fashion`, `Kosmetik`, `Furnitur`, `Aksesoris`, `Pertanian`, `Peternakan`, `Lainnya` | artisans |
| `kolaborators.subsektor[]` | BEKRAF 17 (Kuliner, Kriya, Fashion, Musik, Seni Pertunjukan, etc.) | kolaborators |
| `events.subsektor[]` | BEKRAF 17 (same list) | events |
| `karya.subsektor` | SINGULAR string (NOT array) | karya |
| Role enum | `admin \| petugas \| artisan \| kolaborator` | users_profile |

### Public Read WARNING (R9)

`artisans` table contains sensitive fields (`email`, `no_hp`, `total_penjualan`, `komisi_persen`, `komisi_terkumpul`, `internal_notes`).  
**Public profile endpoint MUST use backend with explicit SELECT projection.**  
Do NOT query `artisans` directly with Supabase anon key.  
Future: Add `CREATE VIEW artisans_public` to hide sensitive columns.

`kolaborators` table contains admin-only fields (`no_hp`, `internal_notes`) — never project into `/api/public/profiles/{slug}` or `/api/kolaborator/me` responses.

### Stand Cross-Reference

`event_artisans.stand_id` (TEXT, e.g. `'A-3'`) cross-references `zones.stands[].id`.  
No FK constraint — backend enforces validity before insert.  
Stand occupancy = presence in `event_artisans WHERE status_request='approved'`.

### Artisan Request Re-Request

`artisan_requests` has UNIQUE `(event_id, artisan_id)`.  
Backend **hard-deletes** rejected rows to allow re-request.  
Approved rows move to `event_artisans`.

---

## Tables (20 total)

---

### 3.1 `users_profile`

**OpenAPI schema:** base auth model (all 4 YAMLs)  
**YAML refs:** gate yaml line 15 (`role IN ('admin','petugas')`), gate yaml `/api/auth/profile` (`additionalProperties:true`, e.g. `jabatan`)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | NOT NULL | == auth.users.id |
| `nama` | TEXT | NOT NULL | Display name |
| `role` | TEXT | NOT NULL, CHECK IN ('admin','artisan','kolaborator','petugas') | Synced to auth.users.raw_app_meta_data via trigger |
| `jabatan` | TEXT | NULL | Job title (petugas/admin use) |
| `extra` | JSONB | NOT NULL DEFAULT '{}' | Extensible custom fields (additionalProperties) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by `trg_users_profile_updated_at` |

**RLS:**
- `auth_read_own_profile` — SELECT WHERE `id = auth.uid()` OR `jwt_role() = 'admin'`

**Triggers:** `trg_sync_user_role` (AFTER INSERT/UPDATE OF role → syncs to auth.users), `trg_users_profile_updated_at` (BEFORE UPDATE)

---

### 3.2 `artisans`

**OpenAPI schemas:** `Artisan` (artisan yaml 1330–1404), `Artisan` (gate yaml 2787–2858), `PublicProfile` (companyprof yaml — sanitized, NO email/no_hp/financial)  
**Key YAML refs:**
- `RegisterArtisanBody.required` includes `username` (artisan yaml 1207)
- QRIS endpoint returns `{ qris_url, updated_at }` (artisan yaml 830–842; gate yaml 1810–1811)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | NOT NULL | == users_profile.id |
| `email` | TEXT | NULL | Mirrored from auth.users; backend syncs on register/update |
| `username` | TEXT | NOT NULL UNIQUE, CHECK (~'^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$') | User-chosen handle for public URL (D2) |
| `slug` | TEXT | NOT NULL UNIQUE | Auto-generated from `nama_usaha` via `trg_artisans_slug` |
| `nama_usaha` | TEXT | NOT NULL DEFAULT '' | Business/store name |
| `pemilik` | TEXT | NOT NULL DEFAULT '' | Owner/proprietor name |
| `no_hp` | TEXT | NOT NULL DEFAULT '' | Phone number |
| `kota` | TEXT | NOT NULL DEFAULT '' | City |
| `deskripsi` | TEXT | NOT NULL DEFAULT '' | Description |
| `foto_url` | TEXT | NULL | Profile photo URL |
| `cover_url` | TEXT | NULL | Cover photo URL |
| `qris_url` | TEXT | NULL | QRIS payment image URL |
| `qris_updated_at` | TIMESTAMPTZ | NULL | Auto-set by `trg_artisans_qris_ts` when `qris_url` changes (D3) |
| `kategori_usaha` | TEXT[] | NOT NULL DEFAULT '{}' | UMKM 9 categories (NOT subsektor) |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('aktif','pending','suspended','rejected') | |
| `komisi_persen` | NUMERIC(5,2) | NOT NULL DEFAULT 0, CHECK BETWEEN 0 AND 100 | Admin-set commission % |
| `tanggal_daftar` | DATE | NOT NULL DEFAULT CURRENT_DATE | |
| `total_penjualan` | NUMERIC(15,2) | NOT NULL DEFAULT 0 | **Computed by trigger; do not write directly** |
| `komisi_terkumpul` | NUMERIC(15,2) | NOT NULL DEFAULT 0 | **Computed by trigger; do not write directly** |
| `internal_notes` | TEXT | NOT NULL DEFAULT '' | **Admin-only.** Never expose via `/api/public/*` or `/api/artisan/me`. Gate admin Artisan edit drawer only. (v2.1) |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by `trg_artisans_updated_at` |

**Indexes:** `idx_artisans_status` (BTREE), `idx_artisans_kota` (BTREE), `idx_artisans_slug` (BTREE), `idx_artisans_username` (BTREE), `idx_artisans_kategori_gin` (GIN)

**RLS:**
- `public_read_artisans_aktif` — anon SELECT WHERE `status='aktif'`
- `artisan_read_self` — artisan SELECT WHERE `id=auth.uid()`
- `artisan_update_self` — artisan UPDATE WHERE `id=auth.uid()`
- `admin_all_artisans` — admin ALL
- `petugas_read_artisans` — petugas SELECT

**Triggers:** `trg_artisans_slug` (BEFORE INSERT/UPDATE), `trg_artisans_qris_ts` (BEFORE UPDATE OF qris_url), `trg_artisans_updated_at` (BEFORE UPDATE)

**Computed-by-backend reports (`/api/reports/artisan`):**
```sql
SELECT a.id, a.nama_usaha,
       array_to_string(a.kategori_usaha, ', ') AS kategori,
       SUM(k.nominal) FILTER (WHERE k.jenis='masuk') AS omset,
       a.komisi_persen,
       COUNT(k.id) FILTER (WHERE k.jenis='masuk') AS transaksi,
       COUNT(DISTINCT ea.event_id) AS event_count,
       (SELECT stand_id FROM event_artisans
        WHERE artisan_id=a.id ORDER BY created_at DESC LIMIT 1) AS stand_terakhir
FROM artisans a
LEFT JOIN kas k ON k.artisan_id = a.id
LEFT JOIN event_artisans ea ON ea.artisan_id = a.id
GROUP BY a.id;
```

---

### 3.3 `kolaborators`

**OpenAPI schemas:** `Kolaborator` (colab yaml 999–1058), `Kolaborator` (gate yaml 2727–2785)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | NOT NULL | == users_profile.id |
| `email` | TEXT | NULL | Mirrored from auth.users; backend syncs |
| `nama` | TEXT | NOT NULL DEFAULT '' | Full name |
| `kota` | TEXT | NOT NULL DEFAULT '' | City |
| `bio` | TEXT | NOT NULL DEFAULT '' | Short biography |
| `no_hp` | TEXT | NOT NULL DEFAULT '' | **Admin-collected only.** Never expose via `/api/public/profiles/{slug}` or `/api/kolaborator/me`. Gate admin Kolaborator edit drawer only. (v2.1) |
| `internal_notes` | TEXT | NOT NULL DEFAULT '' | **Admin-only.** Never expose via `/api/public/*` or `/api/kolaborator/me`. Gate admin Kolaborator edit drawer only. (v2.1) |
| `foto_url` | TEXT | NULL | |
| `cover_url` | TEXT | NULL | |
| `subsektor` | TEXT[] | NOT NULL DEFAULT '{}' | BEKRAF 17 subsectors |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('aktif','pending','suspended','rejected') | |
| `tanggal_daftar` | DATE | NOT NULL DEFAULT CURRENT_DATE | |
| `total_karya` | INT | NOT NULL DEFAULT 0 | **Computed by trigger; do not write directly** |
| `total_story` | INT | NOT NULL DEFAULT 0 | **Computed by trigger; do not write directly** |
| `total_event` | INT | NOT NULL DEFAULT 0 | **Computed by trigger; do not write directly** |
| `slug` | TEXT | NOT NULL UNIQUE | Auto-generated from `nama` via `trg_kolaborators_slug` |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by `trg_kolaborators_updated_at` |

**Indexes:** `idx_kolaborators_status`, `idx_kolaborators_kota`, `idx_kolaborators_slug` (BTREE), `idx_kolaborators_subsektor_gin` (GIN)

**RLS:**
- `public_read_kolaborators_aktif` — anon SELECT WHERE `status='aktif'`
- `kolaborator_read_self` — kolaborator SELECT WHERE `id=auth.uid()`
- `kolaborator_update_self` — kolaborator UPDATE WHERE `id=auth.uid()`
- `admin_all_kolaborators` — admin ALL
- `petugas_read_kolaborators` — petugas SELECT

**Triggers:** `trg_kolaborators_slug` (BEFORE INSERT/UPDATE), `trg_kolaborators_updated_at` (BEFORE UPDATE)

---

### 3.4 `events`

**OpenAPI schemas:** `Event` (gate yaml 2436–2505), `EventPublic` (companyprof yaml 631–702), `Event` (artisan/colab yaml)  
**Key YAML refs:** `kapasitas: nullable: true`, `konten_lengkap: nullable: true` (all YAMLs)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `nama` | TEXT | NOT NULL | |
| `tanggal` | DATE | NOT NULL | Start date (WIB local) |
| `tanggal_selesai` | DATE | NOT NULL | End date (WIB local) |
| `jam_mulai` | TIME | NOT NULL | WIB 24h HH:MM |
| `jam_selesai` | TIME | NOT NULL | WIB 24h HH:MM |
| `lokasi` | TEXT | NOT NULL DEFAULT '' | Venue/location |
| `status` | TEXT | NOT NULL DEFAULT 'draft', CHECK IN ('draft','published','berlangsung','selesai') | 'upcoming' is NOT a status value |
| `kapasitas` | INT | NULL | NULL = unlimited capacity (D6) |
| `peserta_count` | INT | NOT NULL DEFAULT 0 | **Computed by trigger; do not write directly** |
| `deskripsi` | TEXT | NOT NULL DEFAULT '' | Short description |
| `konten_lengkap` | TEXT | NULL | Long-form content (D7) |
| `subsektor` | TEXT[] | NOT NULL DEFAULT '{}' | BEKRAF 17 |
| `banner_url` | TEXT | NULL | |
| `galeri` | TEXT[] | NOT NULL DEFAULT '{}' | Array of gallery URLs |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**Indexes:** `idx_events_status`, `idx_events_tanggal` (BTREE), `idx_events_subsektor_gin` (GIN), `idx_events_galeri_gin` (GIN)

**RLS:**
- `public_read_events` — anon SELECT WHERE `status IN ('published','berlangsung','selesai')`
- `admin_all_events` — admin ALL
- `petugas_read_events` — petugas SELECT

**Triggers:** `trg_events_updated_at` (BEFORE UPDATE)

**Computed-by-backend accumulation report (`/api/reports/accumulation`):**
```sql
SELECT e.id, e.nama, e.tanggal, e.status,
       COUNT(v.id) AS pengunjung,
       COUNT(DISTINCT ea.artisan_id) FILTER (WHERE ea.status_request='approved') AS artisan_count,
       COUNT(DISTINCT ek.kolaborator_id) FILTER (WHERE ek.status_kehadiran!='dibatalkan') AS kolaborator_count
FROM events e
LEFT JOIN visitors v ON v.event_id = e.id
LEFT JOIN event_artisans ea ON ea.event_id = e.id
LEFT JOIN event_kolaborators ek ON ek.event_id = e.id
GROUP BY e.id;
```

---

### 3.5 `event_kolaborators`

**OpenAPI schema:** `EventKolaborator` (gate yaml 2561–2609)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `event_id` | UUID | NOT NULL FK events(id) ON DELETE CASCADE | |
| `kolaborator_id` | UUID | NOT NULL FK kolaborators(id) ON DELETE CASCADE | |
| `peran` | TEXT | NOT NULL DEFAULT 'peserta', CHECK IN ('performer','panitia','peserta') | |
| `status_kehadiran` | TEXT | NOT NULL DEFAULT 'terdaftar', CHECK IN ('terdaftar','hadir','tidak_hadir','dibatalkan') | |
| `assigned_by` | TEXT | NOT NULL DEFAULT 'admin', CHECK IN ('admin','self') | 'self' = from kolaborator-request approval |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |
| UNIQUE | (event_id, kolaborator_id) | | |

**Indexes:** `idx_evkol_event`, `idx_evkol_kolaborator` (BTREE)

**RLS:**
- `admin_all_event_kolaborators` — admin ALL
- `petugas_read_event_kolaborators` — petugas SELECT

**Triggers:** `trg_evkol_count` (AFTER INSERT/UPDATE/DELETE → updates `events.peserta_count`), `trg_event_kolaborators_updated_at` (BEFORE UPDATE)

---

### 3.6 `event_artisans`

**OpenAPI schema:** `EventArtisan` (gate yaml 2611–2650)  
**Note:** `stand_id` cross-references `zones.stands[].id` — no FK, backend validates.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `event_id` | UUID | NOT NULL FK events(id) ON DELETE CASCADE | |
| `artisan_id` | UUID | NOT NULL FK artisans(id) ON DELETE CASCADE | |
| `stand_id` | TEXT | NULL | e.g. 'A-3'; cross-refs zones.stands[].id |
| `posisi_event` | TEXT | NULL | Display alias for stand_id |
| `status_request` | TEXT | NOT NULL DEFAULT 'approved', CHECK IN ('pending','pending_change','approved','rejected') | |
| `assigned_by` | TEXT | NOT NULL DEFAULT 'admin', CHECK IN ('admin','self') | |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |
| UNIQUE | (event_id, artisan_id) | | |

**Indexes:** `idx_evart_event`, `idx_evart_artisan` (BTREE)

**RLS:**
- `admin_all_event_artisans` — admin ALL
- `petugas_read_event_artisans` — petugas SELECT

**Triggers:** `trg_evart_count` (AFTER INSERT/UPDATE/DELETE → updates `events.peserta_count`), `trg_event_artisans_updated_at` (BEFORE UPDATE)

---

### 3.7 `artisan_requests`

**OpenAPI schema:** `ArtisanRequest` (gate yaml 2652–2692)  
**Note:** `assigned_by` is always 'self'. Backend hard-deletes rejected rows to allow re-request.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `event_id` | UUID | NOT NULL FK events(id) ON DELETE CASCADE | |
| `artisan_id` | UUID | NOT NULL FK artisans(id) ON DELETE CASCADE | |
| `posisi_event` | TEXT | NULL | Requested stand_id |
| `status_request` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('pending','pending_change','approved','rejected') | |
| `change_request` | TEXT | NULL | New stand_id when status='pending_change' |
| `assigned_by` | TEXT | NOT NULL DEFAULT 'self', CHECK IN ('admin','self') | Always 'self' per spec |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |
| UNIQUE | (event_id, artisan_id) | | Blocks duplicate pending; backend deletes on reject to allow re-request |

**Indexes:** `idx_artreq_event`, `idx_artreq_artisan`, `idx_artreq_status` (BTREE)

**RLS:**
- `admin_all_artisan_requests` — admin ALL
- `artisan_manage_own_requests` — artisan ALL WHERE `artisan_id=auth.uid()`; WITH CHECK additionally enforces `assigned_by='self'` (defense-in-depth, prevents anon-key impersonation)

**Triggers:** `trg_artisan_requests_updated_at` (BEFORE UPDATE)

---

### 3.8 `kolaborator_requests`

**OpenAPI schema:** `KolaboratorRequest` (gate yaml 2694–2725)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `event_id` | UUID | NOT NULL FK events(id) ON DELETE CASCADE | |
| `kolaborator_id` | UUID | NOT NULL FK kolaborators(id) ON DELETE CASCADE | |
| `peran` | TEXT | NOT NULL DEFAULT 'peserta', CHECK IN ('performer','panitia','peserta') | |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('pending','approved','rejected') | |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**Indexes:** `idx_kolreq_event`, `idx_kolreq_kolaborator`, `idx_kolreq_status` (BTREE)

**RLS:**
- `admin_all_kolaborator_requests` — admin ALL
- `kolaborator_manage_own_requests` — kolaborator ALL WHERE `kolaborator_id=auth.uid()`; WITH CHECK mirrors USING (defense-in-depth, prevents anon-key impersonation)

**Triggers:** `trg_kolaborator_requests_updated_at` (BEFORE UPDATE)

---

### 3.9 `zones`

**OpenAPI schema:** `Zone` (gate yaml 2928–2957; artisan yaml 1477–1509)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `zona` | CHAR(1) | NOT NULL UNIQUE | 'A', 'B', 'C', 'P' |
| `label` | TEXT | NOT NULL | e.g. 'Zona A – Kriya & Fashion' |
| `warna` | TEXT | NOT NULL DEFAULT '#8B5E3C' | Hex color |
| `urutan` | INT | NOT NULL DEFAULT 0 | Display order |
| `stands` | JSONB | NOT NULL DEFAULT '[]' | Array of `{id, label, kategori}` objects |

**Indexes:** `idx_zones_stands_gin` (GIN jsonb_path_ops on `stands`)

**RLS:**
- `admin_all_zones` — admin ALL
- `petugas_read_zones` — petugas SELECT

---

### 3.10 `karya`

**OpenAPI schema:** `Karya` (companyprof yaml 486–518; colab yaml 1060–1091; gate yaml 2860–2890)  
**Key YAML refs:** `required: [id, judul, subsektor, deskripsi, tahun, featured]` (all YAMLs), `subsektor: SINGULAR string (NOT array)`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `owner_type` | TEXT | NOT NULL CHECK IN ('artisan','kolaborator') | Polymorphic owner |
| `owner_id` | UUID | NOT NULL | References artisans.id OR kolaborators.id (no FK — polymorphic) |
| `judul` | TEXT | NOT NULL | |
| `subsektor` | TEXT | NOT NULL | **SINGULAR string, NOT array.** BEKRAF subsektor. No default — caller must provide (D27) |
| `deskripsi` | TEXT | NOT NULL DEFAULT '' | |
| `tahun` | INT | NOT NULL | Year of creation. Required per spec (D8). |
| `gambar_url` | TEXT | NULL | |
| `featured` | BOOLEAN | NOT NULL DEFAULT FALSE | Admin-toggled. NOT 'is_featured'. |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**Indexes:** `idx_karya_owner`, `idx_karya_featured`, `idx_karya_subsektor` (BTREE)

**RLS:**
- `public_read_karya` — anon SELECT (all karya, any owner)
- `artisan_manage_own_karya` — artisan ALL WHERE `owner_type='artisan' AND owner_id=auth.uid()`
- `kolaborator_manage_own_karya` — kolaborator ALL WHERE `owner_type='kolaborator' AND owner_id=auth.uid()`
- `admin_all_karya` — admin ALL

**Triggers:** `trg_kolaborator_karya_insert` (AFTER INSERT), `trg_kolaborator_karya_delete` (AFTER DELETE), `trg_karya_updated_at` (BEFORE UPDATE)

---

### 3.11 `stories`

**OpenAPI schema:** `Story` (companyprof yaml 520–554; colab yaml 1136–1171; gate yaml 2892–2926)  
**Key YAML refs:** `required: [id, konten, tags, like_count, status, created_at]`, soft-delete sets `status='dihapus'`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `author_type` | TEXT | NOT NULL CHECK IN ('artisan','kolaborator') | |
| `author_id` | UUID | NOT NULL | Polymorphic author (no FK — polymorphic) |
| `konten` | TEXT | NOT NULL | Story text content |
| `media_url` | TEXT | NULL | Optional media URL |
| `tags` | TEXT[] | NOT NULL DEFAULT '{}' | Free-form tags |
| `like_count` | INT | NOT NULL DEFAULT 0 | |
| `status` | TEXT | NOT NULL DEFAULT 'aktif' CHECK IN ('aktif','dihapus','disembunyikan') | Soft-delete = 'dihapus' |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | For soft-delete audit (D36) |

**Indexes:** `idx_stories_author`, `idx_stories_status`, `idx_stories_created` (BTREE), `idx_stories_tags_gin` (GIN)

**RLS:**
- `public_read_stories_aktif` — anon SELECT WHERE `status='aktif'`
- `kolaborator_manage_own_stories` — kolaborator ALL WHERE `author_type='kolaborator' AND author_id=auth.uid()`
- `admin_read_stories` — admin SELECT (all statuses)
- `admin_delete_stories` — admin UPDATE (soft-delete via status change)

**Triggers:** `trg_kolaborator_story_insert` (AFTER INSERT), `trg_kolaborator_story_update` (AFTER UPDATE OF status), `trg_kolaborator_story_delete` (AFTER DELETE), `trg_stories_updated_at` (BEFORE UPDATE)

---

### 3.12 `stok`

**OpenAPI schema:** `Stok` (artisan yaml 1511–1545; gate yaml 3045–3078 admin read-only)  
**Key YAML refs:** `required: [id, nama, harga, stok, kategori, satuan, stok_min]`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `artisan_id` | UUID | NOT NULL FK artisans(id) ON DELETE CASCADE | |
| `nama` | TEXT | NOT NULL | |
| `harga` | NUMERIC(15,2) | NOT NULL DEFAULT 0 | Price in rupiah |
| `stok` | INT | NOT NULL DEFAULT 0 | Current quantity |
| `kategori` | TEXT | NOT NULL DEFAULT '' | |
| `satuan` | TEXT | NOT NULL DEFAULT 'pcs' | Unit (lembar, meter, pcs, etc.) |
| `deskripsi` | TEXT | NOT NULL DEFAULT '' | |
| `stok_min` | INT | NOT NULL DEFAULT 0 | Alert threshold — FE warns when stok <= stok_min |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**Indexes:** `idx_stok_artisan` (BTREE)

**RLS:**
- `artisan_manage_own_stok` — artisan ALL WHERE `artisan_id=auth.uid()`

**Triggers:** `trg_stok_updated_at` (BEFORE UPDATE)

---

### 3.13 `kas`

**OpenAPI schema:** `Kas` (artisan yaml 1600–1657; gate yaml 2959–3011 admin read-only)  
**Key YAML refs:** `Kas.qty: type:number` (NUMERIC, not INT) (D4), `Kas.metode enum: [tunai,qris]` — `transfer` removed in v2.2.2 (D5)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `artisan_id` | UUID | NOT NULL FK artisans(id) ON DELETE CASCADE | |
| `jenis` | TEXT | NOT NULL CHECK IN ('masuk','keluar') | |
| `kategori` | TEXT | NOT NULL DEFAULT '' | Transaction category (free-text) |
| `pelanggan` | TEXT | NULL | Customer name |
| `barang` | TEXT | NULL | Product name |
| `qty` | NUMERIC(10,2) | NOT NULL DEFAULT 1 | Quantity — fractional allowed (e.g. 0.5 kg) (D4) |
| `metode` | TEXT | NOT NULL DEFAULT 'tunai' CHECK IN ('tunai','transfer','qris') | Payment method (D5) |
| `ket` | TEXT | NOT NULL DEFAULT '' | Notes/remarks |
| `nominal` | NUMERIC(15,2) | NOT NULL DEFAULT 0 | Amount in rupiah |
| `tgl` | DATE | NOT NULL DEFAULT CURRENT_DATE | WIB local date |
| `saldo_after` | NUMERIC(15,2) | NOT NULL DEFAULT 0 | **Computed by backend on insert/update; do not write directly** |
| `bukti_url` | TEXT | NULL | Payment proof image URL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**Indexes:** `idx_kas_artisan`, `idx_kas_tgl`, `idx_kas_jenis` (BTREE)

**RLS:**
- `artisan_manage_own_kas` — artisan ALL WHERE `artisan_id=auth.uid()`

**Triggers:** `trg_kas_updated_at` (BEFORE UPDATE)

---

### 3.14 `promo`

**OpenAPI schema:** `Promo` (artisan yaml 1772–1814; gate yaml 3080–3118 admin read-only)  
**Key YAML refs:** `required: [id, nama, produk, diskon, kategori, berlaku_start, berlaku_end, aktif]`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `artisan_id` | UUID | NOT NULL FK artisans(id) ON DELETE CASCADE | |
| `nama` | TEXT | NOT NULL | |
| `produk` | TEXT | NOT NULL | Product the promo applies to |
| `diskon` | NUMERIC(5,2) | NOT NULL DEFAULT 0 CHECK BETWEEN 0 AND 100 | Discount % |
| `kategori` | TEXT | NOT NULL DEFAULT '' | |
| `deskripsi` | TEXT | NOT NULL DEFAULT '' | |
| `berlaku_start` | DATE | NOT NULL | Start date (WIB) |
| `berlaku_end` | DATE | NOT NULL | End date (WIB) |
| `aktif` | BOOLEAN | NOT NULL DEFAULT TRUE | |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**Indexes:** `idx_promo_artisan`, `idx_promo_aktif` (BTREE)

**RLS:**
- `artisan_manage_own_promo` — artisan ALL WHERE `artisan_id=auth.uid()`

**Triggers:** `trg_promo_updated_at` (BEFORE UPDATE)

---

### 3.15 `company_profile_sections`

**OpenAPI schema:** opaque JSONB (companyprof yaml 76–108; gate yaml 1899–1968)  
**Shape of `content` is FE-driven — backend stores as raw JSONB, no validation.**  
`content` is an OBJECT for `home`/`about`/`tim`/`gallery` and a bare JSON ARRAY for `programs`/`works` (v2.3.1) — the gate `saveCompanyProfile` body accepts both via `oneOf`.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `section` | TEXT PK | CHECK IN ('home','about','tim','programs','works','gallery') | Section key |
| `content` | JSONB | NOT NULL DEFAULT '{}' | FE-driven opaque shape |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |
| `updated_by` | UUID | NULL FK auth.users(id) ON DELETE SET NULL | |

**Indexes:** `idx_cps_content_gin` (GIN jsonb_path_ops on `content`)

**RLS:**
- `public_read_company_profile` — anon SELECT (all sections)
- `admin_all_company_profile` — admin ALL
- `petugas_read_company_profile` — petugas SELECT

**Triggers:** `trg_company_profile_sections_updated_at` (BEFORE UPDATE)

---

### 3.16 `programs`

**OpenAPI schema:** `Program` (companyprof yaml 556–577)  
**Key YAML refs:** `Program.icon_url: nullable: true` (companyprof yaml 572)  
**Note (v2.3.1):** The CP public site sources programs from the `company_profile_sections` `programs` JSONB section, not this table. This table still backs `/api/public/programs`, but the CP frontend no longer calls that endpoint.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `slug` | TEXT | UNIQUE NOT NULL | URL-safe slug |
| `nama` | TEXT | NOT NULL | |
| `icon` | TEXT | NOT NULL DEFAULT '' | Emoji/text icon |
| `icon_url` | TEXT | NULL | CDN icon/image URL (alongside emoji `icon`) (D32) |
| `deskripsi` | TEXT | NOT NULL DEFAULT '' | Short description |
| `konten` | TEXT | NOT NULL DEFAULT '' | Markdown content |
| `urutan` | INT | NOT NULL DEFAULT 0 | Display order |
| `aktif` | BOOLEAN | NOT NULL DEFAULT TRUE | |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Auto-set by trigger |

**RLS:**
- `public_read_programs` — anon SELECT WHERE `aktif=TRUE`
- `admin_all_programs` — admin ALL
- `petugas_read_programs` — petugas SELECT

**Triggers:** `trg_programs_updated_at` (BEFORE UPDATE)

---

### 3.17 `visitors`

**OpenAPI schema:** `Visitor` (gate yaml 2336–2361)  
**Key YAML refs:** `required: [id, nama, waktu_masuk, status]`, NFC tap via `/api/visitors/tap`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `event_id` | UUID | NULL FK events(id) ON DELETE SET NULL | |
| `nama` | TEXT | NOT NULL DEFAULT 'Tamu' | |
| `uid` | TEXT | NULL | NFC/RFID card UID |
| `waktu_masuk` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| `waktu_keluar` | TIMESTAMPTZ | NULL | NULL if still inside |
| `status` | TEXT | NOT NULL DEFAULT 'di_dalam' CHECK IN ('di_dalam','keluar') | |

**Indexes:** `idx_visitors_event`, `idx_visitors_status`, `idx_visitors_masuk` (BTREE), `uniq_visitors_active_uid` (partial UNIQUE on `(uid) WHERE uid IS NOT NULL AND status='di_dalam'`) — prevents double-tap-in (D31)

**RLS:**
- `admin_all_visitors` — admin ALL
- `petugas_visitors_select` — petugas SELECT
- `petugas_visitors_insert` — petugas INSERT
- `petugas_visitors_update` — petugas UPDATE (NO delete)
- **No public_read policy by design** — `/api/public/stats` queries aggregate counts via service_role (bypasses RLS) so only the integer count is exposed, never raw rows. Visitor identity (uid) is sensitive.

---

### 3.18 `notifikasi`

**OpenAPI schema:** `Notifikasi` (artisan yaml 1881–1923; colab yaml 1264–1303; gate yaml 3120–3160)  
**Key YAML refs:** `required: [id, type, title, message, read, created_at]`, field name is `read` NOT `dibaca`

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `user_id` | UUID | NOT NULL FK auth.users(id) ON DELETE CASCADE | |
| `type` | TEXT | NOT NULL DEFAULT 'system' | Open TEXT — see COMMENT for allowed values |
| `title` | TEXT | NOT NULL | |
| `message` | TEXT | NOT NULL | |
| `read` | BOOLEAN | NOT NULL DEFAULT FALSE | NOT 'dibaca' |
| `link` | TEXT | NULL | FE deep-link path |
| `detail` | JSONB | NULL | Type-specific structured payload |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Allowed `type` values by role** (validated by backend; no CHECK — extensible):
- artisan: `artisan_request_approved`, `artisan_request_rejected`, `position_change_approved`, `position_change_rejected`, `event_starting_soon`, `system`
- kolaborator: `event_invite`, `event_starting_soon`, `karya_featured`, `system`
- admin/petugas: `artisan_request`, `kolaborator_approved`, `event_published`, `aktivitas_flagged`, `system`

**Indexes:** `idx_notifikasi_user`, `idx_notifikasi_read`, `idx_notifikasi_created` (BTREE), `idx_notifikasi_detail_gin` (GIN on `detail`)

**RLS:**
- `auth_read_own_notifikasi` — SELECT WHERE `user_id=auth.uid()`
- `auth_update_own_notifikasi` — UPDATE WHERE `user_id=auth.uid()`

---

### 3.19 `otp_codes`

**STATUS (v2.4.1, 2026-05-29):** LEGACY — no longer used by any frontend. Since PR #49 (2026-05-28), the forgot-password flow uses Supabase Auth native (`supabase.auth.resetPasswordForEmail` → email link → `updateUser`). Artisan/colab OpenAPI yamls still document `/api/auth/otp/*` as stubs for cross-consistency check 15, but the realEndpoints.js no longer calls them. Safe to DROP this table after 90-day retention period (2026-08-28+) if no rollback needed.

**YAML refs:** artisan/colab yaml `/api/auth/otp/request`, `/api/auth/otp/verify` (legacy stubs — endpoints exist on backend, but FE does not call them)  
**Note:** `purpose='register'` added for registration OTP flow (D34).

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `phone` | TEXT | NOT NULL | Phone number |
| `code` | TEXT | NOT NULL | OTP code |
| `purpose` | TEXT | NOT NULL DEFAULT 'password_reset' CHECK IN ('password_reset','verify','register') | (D34) |
| `expires_at` | TIMESTAMPTZ | NOT NULL | |
| `used_at` | TIMESTAMPTZ | NULL | Set on first use |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_otp_phone`, `idx_otp_expires` (BTREE), `idx_otp_phone_purpose` (BTREE on `(phone, purpose, expires_at)`) (D34b)

**RLS:** RLS enabled, **no policies** (default-deny for all anon/authenticated roles). Backend uses service_role key for issue/verify/mark-used — keeps single-use tokens out of any client-readable scope and prevents enumeration attacks via the anon key.

---

### 3.20 `password_reset_tokens`

**STATUS (v2.4.1, 2026-05-29):** LEGACY — no longer used by any frontend. Since PR #49 (2026-05-28), all password resets flow through Supabase Auth (`auth.users.recovery_token` + Supabase-issued JWT recovery session). Safe to DROP after 90-day retention (2026-08-28+).

**YAML refs:** artisan/colab yaml `/api/auth/password/reset` (legacy stub — endpoint exists on backend, but FE does not call it)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| `id` | UUID PK | DEFAULT uuid_generate_v4() | |
| `user_id` | UUID | NOT NULL FK auth.users(id) ON DELETE CASCADE | |
| `token` | TEXT | NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex') | Random 32-byte hex token |
| `expires_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() + INTERVAL '10 minutes' | |
| `used_at` | TIMESTAMPTZ | NULL | Set on redemption |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

**Indexes:** `idx_reset_user`, `idx_reset_token`, `idx_reset_expires` (BTREE)

**RLS:** RLS enabled, **no policies** (default-deny for all anon/authenticated roles). Backend uses service_role key for issue/verify/mark-used — keeps single-use tokens out of any client-readable scope and prevents enumeration attacks via the anon key.

---

## Supabase Storage

Storage lives **outside** `schema.sql` (in Supabase-managed `storage` schema). Configured via Supabase Dashboard or Storage REST API; persisted via Supabase, not in this repo's SQL files.

### Buckets

| Bucket | Status | Public | Max size | MIME types | Created |
|---|---|---|---|---|---|
| `peken-uploads` | **ACTIVE** (all uploads) | Yes (read) | 5 MB | `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif` | 2026-05-25 |
| ~~`qris`~~ | DELETED 2026-05-29 | - | - | - | - |

### `peken-uploads` folder convention

All client uploads via `frontend/src/lib/uploadImage.js` (`uploadImage(file, folder)` helper in Gate, UMKM, Kolaborator):

| Folder | Used by | Domain |
|---|---|---|
| `cp/` | Gate `CompanyProfile.jsx` ImageInput | CP marketing assets (hero, manifesto, gallery, etc.) |
| `event/` | Gate `EventModal` ImageUpload | Event banner + gallery |
| `profil/` | UMKM `ProfileForm` ImgField | Artisan foto + cover |
| `qris/` | UMKM `QrisUploadSection` | Artisan QRIS payment image |
| `bukti/` | UMKM `TambahKas` / `EditKas` | Kas transaction proof |
| `story/` | Kolaborator `Story.jsx` (via shared `ImageUpload`) | Story media |
| `portofolio/` | Kolaborator `Portofolio.jsx` (via shared `ImageUpload`) | Karya gallery |
| (kolab profile) | Kolaborator `Profil.jsx` (via shared `ImageUpload` with folder='profil') | Kolab foto + cover |

### Storage RLS (configured via Supabase Dashboard policies on `storage.objects`)

| Policy | Operation | Rule |
|---|---|---|
| `peken_uploads_public_read` | SELECT | `bucket_id = 'peken-uploads'` (anyone can read URLs) |
| `peken_uploads_authenticated_write` | INSERT | `bucket_id = 'peken-uploads' AND auth.role() = 'authenticated'` (any logged-in user) |
| `peken_uploads_owner_update` | UPDATE | `bucket_id = 'peken-uploads' AND owner = auth.uid()` |
| `peken_uploads_owner_delete` | DELETE | `bucket_id = 'peken-uploads' AND owner = auth.uid()` |
| Admin override | ALL | service_role bypasses RLS entirely |

### Fallback: base64 data URLs

`uploadImage.js` falls back to base64 `data:image/...;base64,<...>` when Supabase Storage upload fails (offline, RLS reject, network error). The DB stores whichever URL the FE returns — both work for `<img src="">`. Production should always be Storage URL; data URL fallback is for resilience only.

---

## Delta Summary (36 changes from schema v1.0 to v2.0)

> **How to extend this section** (living-doc workflow):
> 1. Any change to `db/schema.sql` or an `openapi-*.yaml` MUST add a `### vX.Y.Z — YYYY-MM-DD (short title)` block at the bottom of this section.
> 2. Bump versions per HANDOFF.md "Maintaining These Docs" section:
>    - DB schema change → bump `db/schema.sql` header version + add SCHEMA_MAP delta here.
>    - OA change → bump ALL 4 OA `info.version` to match (verifier check 9 enforces) + add SCHEMA_MAP delta here.
>    - Doc-only update (this file + HANDOFF) → optional delta if cross-cutting.
> 3. After editing, run `bash db/verify_cross_consistency.sh` — must return 16/16 PASS.
> 4. Delta entries below are append-only history. Never rewrite past entries; add new ones below.

| # | Table | Change |
|---|-------|--------|
| D1 | users_profile | role CHECK: add 'petugas' |
| D2 | artisans | ADD username TEXT NOT NULL UNIQUE with regex CHECK |
| D3 | artisans | ADD qris_updated_at TIMESTAMPTZ NULL |
| D4 | kas | qty: INT → NUMERIC(10,2) |
| D5 | kas | ADD CHECK metode IN ('tunai','transfer','qris') |
| D6 | events | kapasitas: DROP NOT NULL + DEFAULT (NULL = unlimited) |
| D7 | events | konten_lengkap: DROP NOT NULL + DEFAULT (nullable) |
| D8 | karya | tahun: ADD NOT NULL |
| D9a | artisans | ADD trg_artisans_slug trigger + set_artisan_slug() function |
| D9b | kolaborators | ADD trg_kolaborators_slug trigger + set_kolaborator_slug() function |
| D10 | 15 tables | ADD set_updated_at() + 15 BEFORE UPDATE triggers |
| D11a | artisans | ADD idx_artisans_kategori_gin GIN |
| D11b | kolaborators | ADD idx_kolaborators_subsektor_gin GIN |
| D11c | events | ADD idx_events_subsektor_gin GIN |
| D11d | events | ADD idx_events_galeri_gin GIN |
| D11e | stories | ADD idx_stories_tags_gin GIN |
| D12a | zones | ADD idx_zones_stands_gin GIN |
| D12b | notifikasi | ADD idx_notifikasi_detail_gin GIN |
| D12c | company_profile_sections | ADD idx_cps_content_gin GIN |
| D13a | 8 tables | ADD petugas_read_* SELECT RLS policies |
| D14 | visitors | ADD petugas_visitors_select/insert/update RLS |
| D18 | notifikasi.type | ADD COMMENT listing role-specific allowed values |
| D19 | artisans/events/etc | ADD COMMENT with aggregation SQL |
| D21 | users_profile | ADD jabatan TEXT NULL, extra JSONB, updated_at |
| D22 | artisans/kolaborators | ADD COMMENT on email field |
| D24 | computed fields | ADD COMMENT "computed by trigger; do not write directly" |
| D27 | karya.subsektor | DROP DEFAULT (caller must provide) |
| D31 | visitors | ADD uniq_visitors_active_uid partial UNIQUE |
| D32 | programs | ADD icon_url TEXT NULL |
| D34 | otp_codes | EXPAND purpose CHECK: add 'register' |
| D34b | otp_codes | ADD idx_otp_phone_purpose BTREE |
| D35 | helpers | ADD is_admin(), is_admin_or_petugas() SQL helpers |
| D36 | stories | ADD updated_at TIMESTAMPTZ NOT NULL |
| D2b | artisans | ADD idx_artisans_username BTREE |
| R7 | triggers | Patch update_event_peserta_count() for UPDATE OF event_id |
| bugfix | triggers | Fix kolaborator count triggers (owner_id vs author_id) |

### v2.1 — 2026-05-02 (DB-side gap fixes from FE audit)

Gap source: Gate admin edit forms (`Kolaborator.jsx`, `Artisan.jsx`) write `no_hp` and `internal_notes` fields that did not exist in DB — silently lost in non-dummy mode. OpenAPI specs remain unchanged (read-only contract). Backend MUST project these columns out of all public/portal-facing responses.

| # | Table | Change |
|---|-------|--------|
| D37 | artisans | ADD `internal_notes TEXT NOT NULL DEFAULT ''` — admin-only metadata; Gate admin Artisan edit drawer only |
| D38a | kolaborators | ADD `no_hp TEXT NOT NULL DEFAULT ''` — admin-collected contact; never returned by public profile endpoint |
| D38b | kolaborators | ADD `internal_notes TEXT NOT NULL DEFAULT ''` — admin-only metadata; Gate admin Kolaborator edit drawer only |

### v2.1.1 — 2026-05-02 (OpenAPI specs bumped to sync with DB v2.1)

All 4 OpenAPI specs updated from v2.0.0 → v2.1.0. DB schema remains at v2.1 (no DB changes in this delta).

| Edit | File | Change |
|------|------|--------|
| G-1 | openapi-gate.yaml | Kolaborator schema: add `no_hp`, `internal_notes` (admin-only; absent from colab yaml by design) |
| G-2 | openapi-gate.yaml | Artisan schema: add `internal_notes` (admin-only; absent from artisan portal yaml by design) |
| G-3 | openapi-gate.yaml | Artisan schema: add `username` (required, DB NOT NULL UNIQUE) |
| G-4 | openapi-gate.yaml | patchKolaborator: expand requestBody — add email, no_hp, foto_url, cover_url, internal_notes |
| G-5 | openapi-gate.yaml | patchArtisan: expand requestBody — add pemilik, email, no_hp, kategori_usaha, foto_url, cover_url, internal_notes |
| A-1 | openapi-artisan.yaml | Artisan response schema: add `username` (required) |
| CP-1 | openapi-companyprof.yaml | Karya schema: add `owner_type, owner_id` (required) + `owner, owner_slug` (computed) |
| CP-2 | openapi-companyprof.yaml | listPublicKarya: add `artisan_id` query param + endpoint description (exclusive with kolaborator_id) |
| CP-3 | openapi-companyprof.yaml | Program schema: replace opaque additionalProperties with typed columns (slug, konten, icon, urutan, aktif) |
| C-1 | openapi-colab.yaml | Karya schema: add owner fields (mirror CP-1) |
| G-6 | openapi-gate.yaml | Karya schema: add owner_type/owner_id (required) + owner/owner_slug (computed) — mirrors CP-1/C-1 for cross-spec consistency |
| DB-1 | db/schema.sql | Relax header comment — OpenAPI specs are now mutable contracts, not read-only |

### v2.2 — 2026-05-03 (Sync Polish — OpenAPI-only, no DB changes)

Cross-layer audit identified 1 critical bug + 6 polish items. All changes are spec/documentation only; DB schema and frontend code unchanged.

| Item | Type | Detail |
|------|------|--------|
| F1 | OpenAPI fix (gate) | EventAccumRow.status enum: replace `mendatang` → DB-canonical `draft\|published\|berlangsung\|selesai`. Critical pre-existing bug — 'mendatang' was never a valid DB value. |
| F2 | OpenAPI structural (gate, artisan) | Split `Zone` schema → `ZoneGlobalLayout` + `ZoneEventOccupancy` to disambiguate per-event occupancy join vs static global layout. |
| F3 | OpenAPI additive (gate, artisan) | Expose `qris_updated_at` (NULLABLE timestamp, read-only) on Artisan schema. Field exists in DB since D3 (trg_artisans_qris_ts) but was not declared. |
| F4 | OpenAPI additive (gate + artisan: Stok/Kas/Promo; gate + colab + companyprof: Karya) | Add `created_at`/`updated_at` (read-only) to item schemas. |
| F5 | OpenAPI clarification (artisan) | Kas.metode — drop misleading "additional values allowed"; affirm strict whitelist tunai/transfer/qris per DB CHECK. |
| F6 | OpenAPI documentation (gate, artisan) | Document `posisi` ↔ DB `posisi_event`/`change_request` aliasing in artisan-requests endpoints; document JOIN responsibility for EventArtisan/EventKolaborator/ArtisanRequest (fields not in junction table). |
| F7 | New tooling | `db/verify_cross_consistency.sh` — cross-layer regression check. Run before deploy: `bash db/verify_cross_consistency.sh` (must exit 0). |

### v2.2.1 — 2026-05-03 (Extended Audit — enum gap fix + regression guard expansion)

Full cross-layer audit (FE × OpenAPI × DB) using new detection scripts. DB unchanged. FE unchanged. OpenAPI: 2 additive fixes.

| Item | Type | Detail |
|------|------|--------|
| A-1 | Version bump (all 4 specs) | Bump `info.version` from `2.1.0` → `2.2.0` in all 4 YAML files to match this SCHEMA_MAP v2.2 section (cosmetic drift fix). |
| A-2 | OpenAPI additive (gate) | `Kas.metode` and `Riwayat.metode` schemas: add `enum: [tunai, transfer, qris]` — DB CHECK already enforces this; spec was missing the enum declaration (documentation gap). |
| A-3 | OpenAPI additive (artisan) | `CreateKasBody.metode`, `PatchKasBody.metode`, `Riwayat.metode`: add `enum: [tunai, transfer, qris]` — same gap as A-2 in request-body schemas. |
| T-1 | New tooling | `db/verify_cross_consistency.sh` extended from 8 → 16 checks (adds: OA version sync, constants data parity, admin-only leak check, cross-spec required[] consistency, canonical naming guard, DB enum coverage, stub endpoint sync, posisi/posisi_event doc). |
| T-2 | New tooling | `db/audit_admin_only_leaks.sh` — dedicated security check for admin-only field leaks. Run: `bash db/audit_admin_only_leaks.sh` (must exit 0). |
| T-3 | New tooling | `db/diff_layers.sh` — multi-check cross-layer discovery script (C-01 through C-18). Produces `db/_audit/_diff_report.md`. |
| T-4 | New tooling | `db/_audit/expected_divergence.tsv` — whitelist for intentional divergences (stub endpoints, etc.). |

**Audit findings (2026-05-03): 2 real discrepancies (A-1, A-2/A-3) + 0 security leaks + 0 schema drifts. All fixed in this delta.**

**Verification after this delta:** `bash db/verify_cross_consistency.sh` → 16/16 PASS. `bash db/audit_admin_only_leaks.sh` → NO LEAKS.

### v2.2.2 — 2026-05-03 (kas.metode — hapus 'transfer', ngikut FE)

DB changed (CHECK constraint). OpenAPI changed (2 specs). FE unchanged (sudah benar sejak awal).

| Item | Type | Detail |
|------|------|--------|
| B-1 | DB fix (schema.sql) | `kas.metode` CHECK constraint: hapus `'transfer'` → `CHECK (metode IN ('tunai', 'qris'))`. FE hanya menawarkan tunai/qris di dropdown; transfer tidak pernah bisa diinput oleh artisan. DB mengikuti FE sebagai source of truth untuk valid values. |
| B-2 | OpenAPI fix (gate.yaml) | `Kas.metode` dan `Riwayat.metode`: ubah `enum: [tunai, transfer, qris]` → `enum: [tunai, qris]` (2 lokasi). |
| B-3 | OpenAPI fix (artisan.yaml) | `CreateKasBody.metode`, `PatchKasBody.metode`, `Riwayat.metode`: ubah `enum: [tunai, transfer, qris]` → `enum: [tunai, qris]` (4 lokasi). Juga update description text dan example value dari `transfer` → `tunai`. |

**Tidak ada perubahan di:** colab.yaml, companyprof.yaml, FE files (TambahKasModal, EditKasModal, Riwayat sudah benar).

**Verification after this delta:** `bash db/verify_cross_consistency.sh` → 16/16 PASS (C-08 enum check sekarang validasi 2 nilai). `bash db/audit_admin_only_leaks.sh` → NO LEAKS.

### v2.3.0 — 2026-05-05 (Petugas Account Management — admin CRUD via Gate UI)

**DB unchanged. FE changed (new page). OpenAPI: gate.yaml only (6 new endpoints + Petugas schema).** Version bumped on all 4 specs for cross-consistency verifier (check 9) — non-gate specs have no endpoint changes.

| Item | Type | Detail |
|------|------|--------|
| C-1 | OpenAPI feat (gate.yaml) | New tag `petugas-management`. 6 endpoints: `GET /api/petugas`, `POST /api/petugas`, `GET /api/petugas/{id}`, `PATCH /api/petugas/{id}`, `PATCH /api/petugas/{id}/status`, `POST /api/petugas/{id}/reset-password`. Admin-only. |
| C-2 | OpenAPI feat (gate.yaml) | New schema `Petugas`: `id, nama, jabatan, email, status (aktif\|disabled), created_at, last_sign_in_at`. NO `internal_notes` (petugas are internal staff, not content partners). |
| C-3 | OpenAPI version bump (artisan/colab/companyprof) | Version-only bump to 2.3.0 — no endpoint changes. Required for verify_cross_consistency.sh check 9. |
| C-4 | FE new page (Gate) | `Petugas.jsx` — list/create/edit/disable/reset-password. Admin-only (`AdminRoute` guard). VITE_DUMMY_MODE supported. |
| C-5 | FE service (Gate) | `petugasApi` added to realEndpoints.js, dummyEndpoints.js, endpoints.js. |

**Disable mechanism:** Supabase Auth native `banned_until` field — **NO new DB column**. `status: 'disabled'` means `banned_until` is set to far future; `status: 'aktif'` means `banned_until = null`.

**Password reset modes:** `email_link` (Supabase sends email) or `temp_password` (admin-relay one-time password). Petugas self-change via existing `/settings` page.

**Petugas schema does NOT expose:** `internal_notes`, `extra` JSONB, or any field absent from `users_profile`. Clean auth-layer object only.

**Verification after this delta:** `bash db/verify_cross_consistency.sh` → 16/16 PASS. `bash db/audit_admin_only_leaks.sh` → NO LEAKS (Petugas schema confirmed clean).

### v2.3.1 — 2026-05-18 (Company-Profile data-contract realignment)

**DB unchanged. FE changed (CP + Gate). OpenAPI: gate.yaml content-type fix + version bump on all 4 specs. New seed file.**

The CP public marketing site now sources its editable content (`home`, `about`, `tim`, `programs`, `works`, `gallery`) exclusively from the `company_profile_sections` JSONB table — the single surface the Gate "Kelola Company Profile" editor reads and writes. Previously `programs`/`works` were served by the dedicated `/api/public/programs` and `/api/public/karya` endpoints; those still exist but the CP frontend no longer calls them.

| Item | Type | Detail |
|------|------|--------|
| E-1 | Data shape | `company_profile_sections.content` is an OBJECT for `home`/`about`/`tim`/`gallery` and a bare JSON ARRAY for `programs`/`works`. Still opaque — backend stores verbatim, no shape validation. |
| E-2 | Backend (gate) | `SaveCompanyProfileBody.content`: `dict[str, Any]` → `dict[str, Any] \| list[Any]` so the array-shaped sections pass `extra="forbid"` validation (was 422 on programs/works save). |
| E-3 | OpenAPI (gate.yaml) | `PUT /api/company-profile` requestBody `content`: `type: object` → `oneOf: [object, array]` to match E-1/E-2. |
| E-4 | FE (CP) | `AboutScreen` data-bound to the `about`+`tim` sections; `WorksScreen` reads the `works` section; `HomeScreen`/`ProgramScreen`/`ProgramDetailScreen` all read the `programs` section. All CP marketing screens are now editor-driven from one source. |
| E-5 | New file | `db/seed_company_profile.sql` — idempotent canonical seed for all 6 sections (`ON CONFLICT (section) DO UPDATE`). Run after `schema.sql`; independent of `seed_demo.sql`. |
| E-6 | Version bump (all 4 specs) | `info.version` `2.3.0` → `2.3.1` for cross-consistency verifier (check 9). Only gate.yaml has an endpoint change (E-3); the other 3 are version-only. |

**Orphaned (still live, no longer called by the CP frontend):** `/api/public/programs`, `/api/public/programs/{slug}`, `/api/public/karya`. The `programs` table is no longer read by the CP public site. Kept for backward compatibility; `programsApi`/`karyaApi` remain exported in CP `endpoints.js`.

**Verification after this delta:** `bash db/verify_cross_consistency.sh` → 16/16 PASS. `bash db/audit_admin_only_leaks.sh` → NO LEAKS.

### v2.4.0 — 2026-05-22 (Client revision sweep — event response shapes + apply-state + reports)

**DB unchanged. FE + BE changed (Gate + Kolaborator + Artisan + CP). OpenAPI: gate.yaml + colab.yaml have content changes; companyprof + artisan are version-only. New CI workflow.**

The smoking-gun client bugs were entity-side event endpoints echoing the *entity's* name with no event date (so the admin UI showed identical names + "Invalid Date"), an assign body that 422'd on a free-text position, a visitor report bound to a non-existent `detail` key, and kolaborator event cards that couldn't show a "pending" apply-state.

| Item | Type | Detail |
|------|------|--------|
| F-1 | BE (gate) + OA | GATE-3: `GET /api/kolaborator/{id}/events` now returns new `KolaboratorEventEntry` — event `nama`/`tanggal`/`tanggal_selesai`/`jam_*`/`lokasi`/`status` JOINed from `events`, plus the junction's `peran`/`status_kehadiran`/`assigned_by` + `created_at`. `id` is the junction-row id. `EventKolaborator` stays the *event-side* participant shape (`GET /api/events/{id}/kolaborator`). |
| F-2 | BE (gate) + OA | GATE-4: `GET /api/artisan/{id}/events` now returns new `ArtisanEventEntry` (mirror of F-1 + `stand_id`/`posisi_event`/`status_request`). `AssignArtisanBody` gains optional `posisi_event` (free-text position); assign was 422 because the FE sent it under `extra="forbid"`. |
| F-3 | BE (gate) + OA | GATE-6: `GET /api/reports` `rows` are now `VisitorReportRow` — `tipe_pengunjung`/`nama_kolaborator`/`durasi_menit` computed at read time (NFC ⇔ `uid`; duration = keluar−masuk) — plus a `ringkasan` { total_kunjungan, total_nfc, total_manual } block. FE now reads `rows` (it read a missing `detail` key → empty table). |
| F-4 | BE (kolaborator) + OA | KOL-2: `GET /api/events` `Event` gains `terdaftar` (approved row in `event_kolaborators`) + `request_status` (`pending`/`approved`/null) for the logged-in kolaborator. New read-only `EventKolaborator` model in the colab backend; service enriches via two id-set lookups. Rejected requests are hard-deleted → re-apply stays allowed. |
| F-5 | Version bump (all 4 specs) | `info.version` `2.3.1` → `2.4.0` for the cross-consistency verifier (check 9). gate.yaml (F-1/F-2/F-3) + colab.yaml (F-4) have endpoint/schema changes; companyprof + artisan are version-only. |
| F-6 | CI | New `.github/workflows/keep-warm.yml` pings the 4 HF Space `/health` endpoints every ~10 min (GLOB-3). No schema impact. |

**Invariants preserved:** event-side junction shapes (`EventArtisan`/`EventKolaborator`) unchanged; `events.status` enum still `(draft|published|berlangsung|selesai)`; non-admin event lists already hide `draft` (GLOB-1 — no change needed). CP "KARYA → PUBLICATION" is a UI label only — no DB or `/api/public/karya` rename.

**Verification after this delta:** `bash db/verify_cross_consistency.sh` → 16/16 PASS. `bash db/audit_admin_only_leaks.sh` → NO LEAKS.

### v2.4.1 — 2026-05-29 (Storage bucket documentation + legacy table flags + handoff)

**DB unchanged. OpenAPI unchanged (still v2.4.0). Documentation only — new Storage section + LEGACY flags on `otp_codes`/`password_reset_tokens` + new `HANDOFF.md` master document.**

This delta captures changes that landed across PR #47–#51 but were never reflected in the schema map. Triggered by the client revision sweep + project handoff to client team.

| Item | Type | Detail |
|------|------|--------|
| H-1 | Doc (SCHEMA_MAP) | Added new top-level **Storage** section documenting `peken-uploads` bucket (active), folder convention (cp/event/profil/qris/bukti/story/portofolio/), Storage RLS policies on `storage.objects`, base64 fallback. `qris` bucket deleted 2026-05-29 (replaced by `peken-uploads/qris/` folder). |
| H-2 | Doc (SCHEMA_MAP) | Marked `otp_codes` and `password_reset_tokens` as LEGACY in sections 3.19 + 3.20. Since PR #49 (2026-05-28) the forgot-password flow uses Supabase Auth native (`auth.users.recovery_token` + Supabase-issued JWT recovery session). Safe to DROP both tables after 90-day retention (2026-08-28+). Artisan/colab OA still document `/api/auth/otp/*` + `/api/auth/password/reset` as stubs; FE no longer calls them. |
| H-3 | Doc (schema.sql) | Header version bumped 2.2.2 → 2.4.0, date 2026-05-03 → 2026-05-29. Added STORAGE + LEGACY commentary block. Footer end-marker corrected from "v2.1" → "v2.4.0". |
| H-4 | Doc (SCHEMA_MAP) | Section 3.13 (kas) — YAML refs note updated: `Kas.metode enum: [tunai,transfer,qris]` → `[tunai,qris]` (transfer was removed in v2.2.2; stale ref note). |
| H-5 | BE fix (4 health.py) | All 4 `routers/health.py` `version` string bumped `2.3.0` → `2.4.0` to match OA + SCHEMA_MAP. Visible only via `GET /health` — no functional impact. |
| H-6 | New file | `HANDOFF.md` at repo root — single-source AI-consumable handoff documentation. Covers architecture, deployment, schema summary, per-app guide, auth/storage/recovery design, ops runbook, future upgrade paths (Resend+domain, Meta WhatsApp Cloud API, multi-channel recovery), credential rotation schedule, dev setup. Designed to be attached to AI prompts by the client's team. |

**Invariants preserved:** schema unchanged; all 4 OA still at v2.4.0; cross-consistency 16/16 still PASS (no check involves `otp_codes`/`password_reset_tokens` row counts or Storage); admin-only-leak audit still PASS.

**Verification after this delta:** `bash db/verify_cross_consistency.sh` → 16/16 PASS. Builds 4/4 PASS. Live HF backends 4/4 HTTP 200 with new version string `2.4.0` in `/health` response.
