# Peken Banyumasan — Handoff Documentation

**Version:** 1.2
**Date:** 2026-05-29
**Audience:** Client engineering team + original dev + AI assistants (Claude, GPT, Gemini, etc.) consuming this doc as prompt context.
**Status:** Production handoff — single source of truth. **LIVING document** — must be updated alongside code changes (see "Maintaining These Docs" below). Supports teams working from older snapshots (see "version drift" subsection).

---

## How To Use This Document (read first)

This file is **AI-optimized**. Attach it to your AI prompt for any task touching this project. Combined with `db/schema.sql` and `db/SCHEMA_MAP.md` it gives an AI ~90% of the project context it needs.

**Mandatory attach for any AI prompt about this project:**
1. `HANDOFF.md` (this file) — architecture, ops, decisions
2. `db/schema.sql` — DB contract (1581 lines, complete)
3. `db/SCHEMA_MAP.md` — DB tables × OpenAPI × RLS map (877 lines, complete)

**Conditional attach (by task domain):**
- For backend API work: relevant `openapi-*.yaml` (4 files, sized 832–3876 lines)
- For CI/CD: `.github/workflows/deploy-hf.yml` + `.github/workflows/keep-warm.yml`
- For frontend env: relevant `.env.example` from that app's `frontend/`

**Never modify without re-verifying:**
- DB schema (`db/schema.sql`) — running `bash db/verify_cross_consistency.sh` MUST return 16/16 PASS afterwards.
- OpenAPI versions — all 4 specs MUST stay in sync at the same version number.
- Canonical naming — see Section 9.

**Rules of thumb for AI:**
- Source of truth ordering when files disagree: `db/schema.sql` > `openapi-*.yaml` > `SCHEMA_MAP.md` > `HANDOFF.md` > frontend code > backend code > old `DEPLOY.md`.
- This file (`HANDOFF.md`) reflects state on 2026-05-29; if a date in another doc is newer, defer to that newer source — and please update this file's footer.

---

## Maintaining These Docs (LIVING documentation)

`HANDOFF.md`, `db/schema.sql`, `db/SCHEMA_MAP.md`, and `openapi-*.yaml` are **living documents**. When code changes, the relevant doc MUST change with it **in the same PR**. Doc-code drift is the single biggest source of confusion for AI consumers — and AI consumers are how this codebase will be maintained.

This applies to **everyone touching the repo**: the original dev, the client team, and any AI assistant they prompt. There is no "documentation team" separate from the engineering work.

### "What to update when ..." lookup table

| You changed... | You MUST also update (in the same PR) |
|---|---|
| **DB table** (new column, type change, CHECK, RLS policy) | `db/schema.sql` (rewrite affected section + bump version in header) → `db/SCHEMA_MAP.md` (matching section + add new `### vX.Y.Z` delta at bottom) → relevant `openapi-*.yaml` if exposed to API (bump version on ALL 4 — verifier check 9) → HANDOFF §8/§9 if it's an invariant |
| **New API endpoint** or **schema change** in OA | Relevant `openapi-*.yaml` → bump version on ALL 4 → `db/SCHEMA_MAP.md` delta → HANDOFF §16 (API Reference) if key endpoint → backend route/service/schema → frontend `realEndpoints.js` + `dummyEndpoints.js` |
| **New env var** | Per-app `frontend/.env.example` → `frontend/.env.production` if FE-visible → HANDOFF §6 → backend `app/config.py` Settings model |
| **New role** or **auth flow change** | `users_profile.role` CHECK in `schema.sql` → RLS policies in `schema.sql` for every table the role can access → `SCHEMA_MAP.md` RLS summary → HANDOFF §10 → `peken_common/auth/jwt.py` JWT verification → cross-consistency check if applicable |
| **Storage bucket** / **storage RLS** | Provision via Supabase Dashboard → `SCHEMA_MAP.md` Storage section → HANDOFF §11 → `frontend/src/lib/uploadImage.js` if folder convention changes |
| **New cross-app invariant** | Add CHECK in `db/verify_cross_consistency.sh` → HANDOFF §9 → SCHEMA_MAP delta documenting the new check |
| **Money model** (kas, komisi, saldo) | `db/schema.sql` if column shape → backend service that computes the field → HANDOFF §13 (invariants must still hold) |
| **Hybrid event status logic** | `peken_common/lib/event_status.py` (source of truth — both BE and JS mirror this) → every FE event-label mapping helper → HANDOFF §12 |
| **Deployment platform** | HANDOFF §17 (already platform-agnostic — add a row to the comparison matrix if it's a new platform). DEPLOY.md is a frozen reference example; do NOT keep it in sync — leave as historical. |
| **Anything that breaks a test** | Fix the root cause; never modify the test/verifier to "pass" — the test exists because that behavior matters |

### Version bumping conventions

| Change scope | Versioning action |
|---|---|
| Trivial typo fix in any doc | No bump, no log entry |
| Documentation-only update (clarification, restructure) | Add HANDOFF maintenance-log entry at the bottom; optional SCHEMA_MAP delta if cross-cutting |
| OA spec change (new endpoint, schema field, response shape) | Bump ALL 4 OA `info.version` (e.g. `2.4.1 → 2.5.0`); add SCHEMA_MAP delta `### vX.Y.Z`; verifier check 9 enforces sync |
| DB schema change (any `ALTER`-equivalent rewrite) | Bump `db/schema.sql` header version; add SCHEMA_MAP delta; usually requires OA bump too |
| Breaking change | Major bump (`2.x → 3.0`); document migration steps in HANDOFF §25; flag in PR title |

### Mandatory pre-merge checklist (for ANY change touching docs or schema)

1. ✅ Update the relevant doc(s) in the SAME PR (not "later", not "in a follow-up").
2. ✅ Run `bash db/verify_cross_consistency.sh` → MUST return **16/16 PASS**.
3. ✅ Run `bash db/audit_admin_only_leaks.sh` → MUST return **NO LEAKS**.
4. ✅ Run `npm run build` in each affected `frontend/` → must exit 0.
5. ✅ Add an entry to HANDOFF.md maintenance log at the very bottom.
6. ✅ If a SCHEMA_MAP delta was added: cross-link from HANDOFF §25 (Future work) if it opens up new options.
7. ✅ Bump `HANDOFF.md` version at top if structure/content changed materially.

### Authority ordering (when files disagree)

1. `db/schema.sql` — canonical DB contract
2. `openapi-*.yaml` (×4) — canonical API contracts
3. `db/SCHEMA_MAP.md` — annotated DB ↔ OA cross-ref
4. `HANDOFF.md` — architecture/ops/decision narrative
5. Frontend code
6. Backend code
7. `DEPLOY.md` — frozen reference example (lowest authority)

When changing code: update the higher-authority doc(s) FIRST, then sync lower-authority code/docs to match.

### When in doubt

Ask yourself: "If someone reads ONLY `HANDOFF.md` + `db/SCHEMA_MAP.md` + `db/schema.sql`, will they understand this change?"
- **Yes** → you're done.
- **No** → add a section, table, or inline comment until the answer is yes.
- Never rely on commit messages, chat logs, or oral tradition to convey the change. Those get lost; docs stay.

### "I'm an AI assistant making changes for the team" workflow

If you're an AI being asked to modify this codebase:

1. **Read** this "Maintaining These Docs" section + §9 (Cross-App Invariants) BEFORE planning your edit.
2. **Identify** every file that needs to change per the "What to update when..." table above.
3. **State** your edit plan to the user before touching files — including which docs you'll also update.
4. **Edit** code + docs in the same response.
5. **Run** the verifier (or tell the user to run it before merging) and report the result.
6. **Update** the maintenance log entry.
7. **Never** skip the doc updates as "trivial" — drift compounds fast and AI confusion compounds faster.

### Pruning rule

The HANDOFF.md "Dev reference deployment" collapsible (§5) and Appendix A test-account credentials are intentionally preserved during the handoff period (≤30 days from 2026-05-29) so the client team can verify against the original dev environment. After client deployment is stable, these blocks SHOULD be pruned to avoid confusion:

- Delete the `<details>` block in §5 (Live URLs → "Dev reference deployment").
- Replace Appendix A test creds with "(Removed — these were dev seed values; reset before production)".
- Remove the `cpobfflpavzanaebodef` mentions in §1 Quick Reference comparison table.

Add a maintenance-log entry when pruning so future readers know the dev-reference values were intentionally removed (not lost).

### If you're working from an older snapshot (version drift handling)

Your team's local codebase OR Supabase DB might be at an **older version than what this document describes** — e.g. you forked weeks ago and the original dev kept landing PRs (#47–#54 in this handoff round). Detect + sync your snapshot BEFORE making new changes — otherwise edits compound on a stale base and AI consumers will see contradictory information across files.

**Step 1 — Detect what version you're at:**

| What to check | Command / Where |
|---|---|
| Local codebase version | `git log --oneline -1`; compare hash to canonical `main` HEAD |
| Local `db/schema.sql` version | `head -5 db/schema.sql` → look for `-- Version : X.Y.Z` |
| Local SCHEMA_MAP version | `head -5 db/SCHEMA_MAP.md` → look for `**Version:** X.Y.Z` |
| Local OA spec version (×4) | `grep "^  version:" */openapi-*.yaml` — all 4 must match |
| Deployed backend version | `curl https://<your-be>/health` → `version` field |
| **Live DB schema version** | DB doesn't carry a version row; run the marker query below |
| All drift, one-shot | `bash db/verify_cross_consistency.sh` — failures pinpoint exactly what's out of sync |

**Detect live DB version via feature markers** (run in Supabase SQL Editor):

```sql
SELECT
  -- v2.1+ marker: artisans.internal_notes added
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_name='artisans' AND column_name='internal_notes') AS has_v21,
  -- v2.1+ marker: kolaborators.no_hp added
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_name='kolaborators' AND column_name='no_hp') AS has_v21_kolab,
  -- v2.2.2+ marker: kas.metode CHECK no longer accepts 'transfer'
  NOT EXISTS (SELECT 1 FROM information_schema.check_constraints
              WHERE constraint_schema='public' AND check_clause LIKE '%transfer%'
                AND constraint_name LIKE '%kas%') AS has_v222_kas,
  -- v2.3.0+ marker: petugas role + RLS policies present
  EXISTS (SELECT 1 FROM pg_policies
          WHERE schemaname='public' AND policyname LIKE 'petugas_%') AS has_v23_petugas,
  -- v2.4.1+ marker: storage bucket peken-uploads (managed in storage schema)
  EXISTS (SELECT 1 FROM storage.buckets WHERE id='peken-uploads') AS has_v241_storage;
```

Interpret: all `true` → DB is current (≥v2.4.1). Any `false` → DB is older; see migration path below.

**Step 2 — Update codebase:**

```bash
# Adjust 'origin' / 'canonical-remote' to whatever name maps to the canonical repo
git fetch origin main
git merge --ff-only origin/main
# If fast-forward fails (your branch has diverged commits):
git merge origin/main          # opens conflict resolution
# Resolve, prefer canonical for: db/, openapi-*.yaml, peken_common/, HANDOFF.md, SCHEMA_MAP.md
git commit
```

**Step 3 — Update DB schema** — choose based on whether you have data to preserve:

- **Dev / staging / disposable data**: re-apply `db/schema.sql` whole. Its top section has `DROP TABLE IF EXISTS ... CASCADE` for idempotency — this wipes all data in the 20 public tables and rebuilds cleanly. Then re-seed via `db/seed_demo.sql` + `db/seed_company_profile.sql`.
- **Production data preserved (NEVER bulk-reapply)**:
  1. Read `db/SCHEMA_MAP.md` Delta Summary, starting at the version AFTER your current one through the current.
  2. Write incremental `ALTER` migrations per delta. Save as `db/migrations/vX.Y.Z_<short-desc>.sql`.
  3. Apply each migration in order via Supabase SQL Editor or `psql`.
  4. Verify with `db/verify_schema.sql` (the 13-query sanity script) then `bash db/verify_cross_consistency.sh` (16-check).
  5. If any check fails — stop, diagnose, fix the migration before applying further.

**Step 4 — Update Supabase Storage** (if `peken-uploads` bucket missing or RLS policies don't match):

- Bucket missing → Supabase Dashboard → Storage → create `peken-uploads` per §11.
- RLS policies missing/wrong → Supabase Dashboard → Storage → Policies → edit/add per §11 table.

**Step 5 — Update env vars + secrets** (if new variables were added since your snapshot):

- Compare your team's HF/Render/etc. backend secrets against the §6 backend env table.
- Compare your CF/Vercel/etc. frontend env vars against the §6 frontend env table.
- Add anything missing (will cause backend startup failure or FE runtime error).

**Step 6 — Verify the sync:**

```bash
bash db/verify_cross_consistency.sh   # MUST be 16/16 PASS
bash db/audit_admin_only_leaks.sh     # MUST be NO LEAKS
# Build all 4 frontends
for d in Peken-Banyumasan-Company-Profile/frontend \
         Peken-Banyumasan-Gate-Masuk-Keluar/frontend \
         peken-banyumas-UMKM-digital/frontend \
         Peken-Banyumasan-Kolaborator/frontend; do
  echo "=== $d ==="
  (cd "$d" && npm install && npm run build) || break
done
# Smoke test deployed backends
for u in <your 4 backend URLs>; do
  curl -s -o /dev/null -w "$u → HTTP %{http_code}\n" "$u/health"
done
```

If anything fails after sync — **diagnose the failure before pushing new changes**. Don't pile new edits onto a broken base.

**Edge cases:**

- **Team has its own diverged DB schema** (added custom tables/columns not in canonical): treat their changes as a private extension; merge canonical for tables that exist in both; document the divergence in your own team's fork of HANDOFF.md.
- **Team is on a SIGNIFICANTLY older snapshot** (e.g. pre-v2.0): consider re-cloning + selectively cherry-picking their work onto canonical, rather than trying to forward-migrate dozens of deltas at once.
- **Production data at risk**: pause + consult the original dev OR an experienced DBA before any DB migration. Bulk re-apply of `schema.sql` to populated production DB **destroys data irrecoverably**.

**Notes on this version's "current canonical" baseline** (snapshot 2026-05-29):

- Schema: `db/schema.sql` header `v2.4.0` (DB), SCHEMA_MAP delta latest `v2.4.1` (doc-only).
- OA: all 4 at `info.version: 2.4.1`.
- Backend health: `/health` returns `version: 2.4.0`.
- Storage: `peken-uploads` bucket active; legacy `qris` bucket deleted.
- Auth: forgot-password via Supabase native (`auth.users.recovery_token`); legacy `otp_codes` + `password_reset_tokens` tables present but unused.
- Email: Supabase default SMTP (2/hour limit).
- Recent client-revision PRs landed: #47 (CP stats), #48 (Storage migration), #49 (Supabase forgot-pw), #50 (Gate logo regression fix), #51 (Gate `/assets` preview resolver), #52 (HANDOFF.md initial), #53 (deployment-agnostic), #54 (LIVING + maintenance workflow).

---

## ⚠️ READ THIS FIRST — Deployment is NOT Fixed

**Critical for AI consumers**: Specific URLs, project refs, account names, and credentials anywhere in this document are **REFERENCE values from the development environment**. The client team will deploy this from scratch with their OWN infrastructure. Treat dev-environment values as illustrative placeholders — **do not assume they are production-current**.

### What stays the same (CONFIRMED for client deployment)

| Layer | Platform | Why fixed |
|---|---|---|
| Database | **Supabase** | DB schema (`db/schema.sql`) uses Supabase-specific features (auth.users, RLS via `auth.uid()`, Realtime, Storage); switching would require schema rewrite |
| Auth | **Supabase Auth** | Frontends call Supabase JS SDK directly for login/session; tied to the DB project |
| Storage | **Supabase Storage** | `peken-uploads` bucket; folder convention assumed across all 4 frontends |

### What WILL change (NOT fixed; client team chooses)

| Layer | Dev reference (in this doc) | Client team will use |
|---|---|---|
| Supabase project | `cpobfflpavzanaebodef` (jauharfz dev account) | Their own Supabase project (different ref, URL, anon key, service_role key, JWT secret, DB password, pooler hostname/region) |
| Backend hosting | HuggingFace Spaces (Docker, free tier, slow cold-start) | TBD — likely **Render**, **Railway**, **Koyeb**, **Fly.io**, or similar (NOT Cloudflare Workers — see §17 incompatibility note) |
| Frontend hosting | Cloudflare Workers (`*.banyumasan.workers.dev`) | TBD — likely **Cloudflare Workers/Pages** OR **Vercel** OR **Netlify** |
| Domain | `*.banyumasan.workers.dev` (CF auto-subdomain) | TBD — possibly custom domain |
| GitHub repo | `jauharfz/peken-dev` | Their own repo (likely a fork or migration) |
| HF account / write token | `jauharfz` / `hf_...` (dev) | N/A if they don't use HF |
| Test account credentials | `admin@peken.test` / `Admin123!` etc. (Appendix A) | Replace before production — these are seed-data passwords visible in this doc |

### Setup checklist for the client team (when ready to deploy)

This is what needs to happen — in order — to bring this codebase from dev to client production:

1. **Supabase setup (one-time):**
   1. Create a new Supabase project (any region; `ap-southeast-1` recommended for Indonesia).
   2. Note `Project URL`, `anon key`, `service_role key`, `JWT secret`, `DB password`, pooler hostname.
   3. SQL Editor → apply `db/schema.sql` (full file as one migration). Verify with `db/verify_schema.sql`.
   4. SQL Editor → apply `db/seed_demo.sql` ONLY in dev/staging (creates test users + sample data).
   5. SQL Editor → apply `db/seed_company_profile.sql` (canonical CP content seed).
   6. Storage → create bucket `peken-uploads` (public read, 5 MB limit, allowed MIME types: png/jpeg/jpg/webp/gif). Apply RLS policies per §11.
2. **Pick backend platform** (see §17 alternatives matrix). Set up CI to push 4 backends. Set required env vars per §6 on each.
3. **Pick frontend platform** (see §17). Configure 4 projects with build commands `npm install && npm run build`, output `dist`. Set env vars per §6.
4. **Wire CORS** on each backend to its corresponding frontend URL.
5. **Smoke test** per §22.
6. **Rotate seed-data passwords** (Appendix A).

### How to AI-consume this doc

When prompting an AI about this project AFTER client deployment:
- **Override** any dev-specific value in this doc with the team's actual production value.
- If unsure what a value is, **ASK the user** rather than guessing from this doc.
- The PATTERNS in this doc (env var names, file layout, schema, business logic, RLS policies) are authoritative. The SPECIFIC VALUES (URLs, refs, keys) are illustrative.
- Treat §5 (Live URLs), §6 (Env Vars), §7 (Credentials), §17 (Deployment) as **structure templates** that need to be populated with the team's values.
- Treat §8 (DB schema), §9 (Invariants), §10 (Auth model), §11 (Storage RLS), §12 (Event status), §13 (Money model), §14 (Per-app guide), §15 (FE patterns), §16 (API), §22 (Testing) as **authoritative and unchanging** across deployments.

---

## Table of Contents

1. [Quick Reference (one-page facts)](#1-quick-reference)
2. [Mission, Scope, Audience](#2-mission-scope-audience)
3. [Repository Layout](#3-repository-layout)
4. [Tech Stack](#4-tech-stack)
5. [Live URLs (Production)](#5-live-urls-production)
6. [Environment Variables](#6-environment-variables)
7. [Credentials & Secrets Management](#7-credentials--secrets-management)
8. [Database Schema (Summary)](#8-database-schema-summary)
9. [Cross-App Invariants — IMMUTABLE](#9-cross-app-invariants--immutable)
10. [Authentication & Roles](#10-authentication--roles)
11. [Storage (Supabase Storage)](#11-storage-supabase-storage)
12. [Hybrid Event Status Model](#12-hybrid-event-status-model)
13. [Money Model (Decimal / Kas / Komisi)](#13-money-model)
14. [Per-App Guide](#14-per-app-guide)
15. [Frontend Patterns](#15-frontend-patterns)
16. [API Reference](#16-api-reference)
17. [Deployment Pipeline](#17-deployment-pipeline)
18. [Local Development Setup](#18-local-development-setup)
19. [Operations Runbook](#19-operations-runbook)
20. [Email & Auth Notifications — Current State + Upgrade Paths](#20-email--auth-notifications)
21. [Multi-Channel Recovery (Design for Future Work)](#21-multi-channel-recovery-design-for-future-work)
22. [Testing & Verification](#22-testing--verification)
23. [Known Limitations & Gotchas](#23-known-limitations--gotchas)
24. [AI Prompting Guide (for the team)](#24-ai-prompting-guide-for-the-team)
25. [Future Work / Open Items](#25-future-work--open-items)
26. [Appendices](#26-appendices)

---

## 1. Quick Reference

Universal facts (apply to ANY deployment):

| Fact | Value |
|---|---|
| **Project name** | Peken Banyumasan |
| **Main branch convention** | `main` (production); `claude/<descriptive-name>` for dev branches |
| **Apps** | 4 (Company Profile, Gate admin, Artisan/UMKM portal, Kolaborator portal) |
| **Backend stack** | Python FastAPI (async, SQLAlchemy 2.x async, asyncpg) — runs in Docker |
| **Frontend stack** | Vite + React 18 (Tailwind for CP/Gate/Kolab; Rolldown-Vite + Tailwind for UMKM) |
| **Shared lib** | `peken_common/` (Python) — installed via `pip install -e ../peken_common` |
| **Database** | Supabase Postgres (shared between all 4 backends) |
| **Auth** | Supabase Auth (email + password). JWT signed ES256. Roles in `app_metadata.role`. |
| **Storage** | Supabase Storage; bucket `peken-uploads` (public read, authenticated write); folder convention §11 |
| **OpenAPI version** | `2.4.1` (all 4 specs synced; verifier check 9 enforces) |
| **DB schema version** | `2.4.0` (per `db/schema.sql`; v2.4.1 SCHEMA_MAP delta is doc-only) |
| **Verification command** | `bash db/verify_cross_consistency.sh` → MUST return 16/16 PASS before deploy |
| **Health endpoint** | `GET /health` on each backend → `{"status":"ok","service":...,"version":"2.4.0"}` |
| **Email sender (current default)** | Supabase default SMTP — **2 emails/hour** free tier rate limit (see §20 for upgrade paths) |
| **Currency** | IDR, `NUMERIC(15,2)` in DB, string-serialized in JSON |
| **Timezone** | WIB (UTC+7) for display dates/times; UTC ISO8601 for timestamps |
| **Today's date for this doc** | 2026-05-29 |

Deploy-specific facts (**REFERENCE VALUES from dev environment — replace with your team's values when deploying**):

| Fact | Dev reference value | Client team replaces with |
|---|---|---|
| GitHub repo | `https://github.com/jauharfz/peken-dev` | Their own repo / fork |
| Supabase project ref | `cpobfflpavzanaebodef` | Their team's project ref |
| Supabase project URL | `https://cpobfflpavzanaebodef.supabase.co` | `https://<their-ref>.supabase.co` |
| Supabase region | `ap-southeast-1` (Singapore) | Whatever they choose at project creation |
| DB pooler host | `aws-1-ap-southeast-1.pooler.supabase.com:6543` | Their team's pooler hostname (region-dependent) |
| DB user | `postgres.cpobfflpavzanaebodef` | `postgres.<their-ref>` |
| Storage region | `ap-northeast-1` (Tokyo) | Whatever their Supabase project gets assigned |
| Backend platform | HuggingFace Spaces (4 spaces) | Render / Railway / Koyeb / Fly / etc. (§17) |
| Backend URLs | `https://jauharfz-peken-<app>-api.hf.space` | `https://<their-platform-url-per-app>` |
| Frontend platform | Cloudflare Workers | Cloudflare / Vercel / Netlify / etc. (§17) |
| Frontend URLs | `https://peken-<app>.banyumasan.workers.dev` | `https://<their-fe-url-per-app>` |
| CI workflow | `.github/workflows/deploy-hf.yml` (HF-specific) | Adapt per chosen backend platform |
| Keep-warm cron | `keep-warm.yml` (pings HF) | Only needed if backend has cold-sleep (HF, free Render); skip for always-on |
| Test account credentials | See Appendix A | **ROTATE before going live** |

---

## 2. Mission, Scope, Audience

### Mission

Peken Banyumasan is a creative-ecosystem platform for the Banyumas region (Central Java, Indonesia). It connects three communities into a single coherent ecosystem:

- **Artisan / UMKM**: small/medium businesses (crafts, F&B, fashion, etc.).
- **Kolaborator**: creative collaborators (photographers, designers, performers, communities — BEKRAF 17 subsectors).
- **Public visitors**: attendees of bi-weekly Peken events held in Kawasan Kota Lama Banyumas.

The platform is operationally driven by a small admin/panitia team via the Gate app.

### Scale (expected)

- ~240 active kolaborator
- ~1,200 registered artisan (UMKM)
- ~38,000 visitor taps per edition (NFC + manual)
- ~86 editions to date (bi-weekly since Feb 2022)
- Bursts during events, low-volume between

### Architecture diagram

```
                ┌──────────────────────────────────────────────────────────┐
                │                  Public visitors (browsers)              │
                └──────┬──────────────────┬──────────────────┬─────────────┘
                       │                  │                  │
              ┌────────▼─────────┐ ┌──────▼──────────┐ ┌─────▼─────────────┐
              │ peken-cp         │ │ peken-umkm      │ │ peken-kolaborator │
              │ (public site)    │ │ (artisan portal)│ │ (kolab portal)    │
              │ React/Vite       │ │ React/Vite      │ │ React/Vite        │
              │ CF Workers       │ │ CF Workers      │ │ CF Workers        │
              └────┬─────────────┘ └────────┬────────┘ └────────┬──────────┘
                   │                        │                    │
                   │              ┌─────────▼─────────┐          │
                   │              │ peken-gate        │          │
                   │              │ (admin panel)     │          │
                   │              │ React/Vite        │          │
                   │              │ CF Workers        │          │
                   │              └─────────┬─────────┘          │
                   │                        │                    │
       ┌───────────▼────────────────────────▼────────────────────▼──────────┐
       │                       FastAPI backends × 4 (HF Spaces)             │
       │   peken-cp-api · peken-gate-api · peken-umkm-api · peken-kolab-api │
       │     (each backend isolates one frontend's scope of RLS-gated ops)  │
       └──────────────────────┬─────────────────────────────────────────────┘
                              │
                  ┌───────────▼────────────────────┐
                  │   Supabase (shared services)   │
                  │  ┌───────────────────────────┐ │
                  │  │ Postgres 15+ (20 tables)  │ │
                  │  │  RLS + triggers + RPCs    │ │
                  │  └───────────────────────────┘ │
                  │  ┌───────────────────────────┐ │
                  │  │ Auth (JWT ES256)          │ │
                  │  │  4 roles + Email SMTP     │ │
                  │  └───────────────────────────┘ │
                  │  ┌───────────────────────────┐ │
                  │  │ Storage: peken-uploads    │ │
                  │  │  (folder-per-domain)      │ │
                  │  └───────────────────────────┘ │
                  │  ┌───────────────────────────┐ │
                  │  │ Realtime (Postgres CDC)   │ │
                  │  │  Used by Gate dashboard   │ │
                  │  └───────────────────────────┘ │
                  └────────────────────────────────┘
```

### Why this split (architectural decision record)

**Why 4 backends instead of 1?**
Each backend isolates a single frontend's scope of data and operations. This:
1. Lets each FE deploy independently against its OWN BE without coordinating cross-app schema changes.
2. Reduces RLS-bypass blast radius — if `peken-cp-api`'s service_role key leaks, only public read endpoints are exposed (admin endpoints live in `peken-gate-api`).
3. Allows per-backend rate limiting and observability without coupling.
4. Trades off duplicated infrastructure (4 HF Spaces) for clarity. Acceptable for low-traffic admin app.

**Why Supabase shared?**
Single source of truth. All 4 backends use the same Supabase project, same DB, same auth, same storage. RLS policies enforce role-based access regardless of which backend connects.

**Why HF Spaces for backends?**
Free tier, Docker-native, no credit card required, JP region (low latency to Indonesia). Trade-off: 48h auto-sleep (mitigated by `keep-warm.yml` cron pinging every 10 min).

**Why Cloudflare Workers for frontends?**
Free tier, fast CDN, git auto-deploy on push to main. Static build output (Vite `dist/`) served as workers static assets.

---

## 3. Repository Layout

```
Peken Banyumasan/                                  # repo root (git: peken-dev)
├── HANDOFF.md                                     # ← THIS FILE
├── DEPLOY.md                                      # initial setup guide (partly stale; see this file for current)
├── docker-compose.yml                             # local dev: spin up 4 backends + Postgres
│
├── peken_common/                                  # shared Python lib (installed in 4 backends)
│   ├── peken_common/
│   │   ├── auth/jwt.py                            # JWT verification + CurrentUser dep
│   │   ├── lib/event_status.py                    # effective_event_status() — SINGLE SOURCE
│   │   ├── lib/slugify.py                         # mirrors DB slugify()
│   │   ├── lib/timezone.py                        # WIB / now_wib()
│   │   ├── lib/unwrap.py                          # response envelope helpers
│   │   └── ...
│   ├── tests/
│   └── pyproject.toml
│
├── db/
│   ├── schema.sql                                 # ★ CANONICAL DB schema (v2.4.0, 1581 lines)
│   ├── SCHEMA_MAP.md                              # ★ human-readable companion (v2.4.0, 877 lines)
│   ├── seed_demo.sql                              # dev seed data (users, events, kas)
│   ├── seed_company_profile.sql                   # CP marketing content seed
│   ├── verify_schema.sql                          # 13 SELECT queries — schema sanity
│   ├── verify_cross_consistency.sh                # ★ 16 cross-layer regression checks (MUST PASS before deploy)
│   ├── audit_admin_only_leaks.sh                  # security: admin-only fields not leaking
│   ├── diff_layers.sh                             # multi-check cross-layer discovery
│   ├── _audit/                                    # historical audit reports
│   └── README.md
│
├── Peken-Banyumasan-Company-Profile/              # CP — public marketing site
│   ├── backend/                                   # FastAPI
│   │   ├── app/
│   │   │   ├── api/v1/routers/                    # public.py, health.py
│   │   │   ├── services/public_event_service.py
│   │   │   ├── services/public_profile_service.py # /api/public/profiles/{slug}
│   │   │   ├── repositories/event_repo.py
│   │   │   ├── repositories/visitor_repo.py
│   │   │   ├── schemas/
│   │   │   ├── config.py
│   │   │   └── main.py
│   │   ├── tests/                                 # pytest (63 tests)
│   │   ├── Dockerfile.hf                          # HF Space build
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   └── README.md
│   ├── frontend/                                  # React/Vite
│   │   ├── src/
│   │   │   ├── App.jsx                            # screen router
│   │   │   ├── components/screens/                # HomeScreen, AboutScreen, WorksScreen, GalleryScreen, PublicProfileScreen, ProgramScreen, ProgramDetailScreen
│   │   │   ├── components/layout/PekenNav.jsx
│   │   │   ├── components/modals/LoginModal.jsx
│   │   │   ├── services/endpoints.js              # apiFetch wrapper
│   │   │   └── data/                              # fallback dummy data
│   │   ├── public/                                # favicon.png, assets/
│   │   ├── .env.example
│   │   ├── .env.production                        # CF build env (committed; public values)
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── README.md
│   └── openapi-companyprof.yaml                   # v2.4.0, 832 lines, 8 paths
│
├── Peken-Banyumasan-Gate-Masuk-Keluar/            # Gate — admin panel
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/routers/                    # auth.py, artisan.py, kolaborator.py,
│   │   │   │                                      # events.py, events_artisan.py, events_kolaborator.py,
│   │   │   │                                      # dashboard.py, zones.py, company_profile.py,
│   │   │   │                                      # reports.py, petugas.py, notifikasi.py, health.py
│   │   │   ├── services/                          # ArtisanService, KolaboratorService, EventService, etc.
│   │   │   ├── repositories/
│   │   │   ├── schemas/                           # ← ArtisanEventEntry, KolaboratorEventEntry (v2.4.0)
│   │   │   ├── core/dependencies.py               # get_db_session, get_supabase, current_user
│   │   │   └── ...
│   │   ├── tests/                                 # pytest (608 tests)
│   │   ├── Dockerfile.hf
│   │   └── README.md
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.jsx                            # BrowserRouter; routes guarded by AdminRoute/PetugasRoute
│   │   │   ├── pages/                             # Login, Dashboard, Artisan, Kolaborator, Events, Reports,
│   │   │   │                                      # CompanyProfile, Petugas, Monitor, Profile, Notifikasi
│   │   │   ├── layouts/AdminLayout.jsx            # sidebar + topbar
│   │   │   ├── components/                        # Toast, PrivateRoute, ImageInput, etc.
│   │   │   ├── lib/uploadImage.js                 # Supabase Storage client
│   │   │   ├── lib/supabase.js                    # createClient
│   │   │   ├── services/endpoints.js              # toggles real vs dummy
│   │   │   ├── services/realEndpoints.js
│   │   │   ├── services/dummyEndpoints.js
│   │   │   └── constants/                         # kategoriUsaha, subsektor
│   │   ├── public/                                # favicon.png, pixel-skyline.svg
│   │   ├── .env.example
│   │   ├── .env.production                        # CF build env
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── README.md
│   └── openapi-gate.yaml                          # v2.4.0, 3876 lines, 46 paths
│
├── peken-banyumas-UMKM-digital/                   # Artisan portal (UMKM)
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/routers/                    # auth, profile, kas, stok, promo, karya, event, dashboard, qris
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── schemas/
│   │   │   └── ...
│   │   ├── tests/                                 # pytest (254 tests)
│   │   ├── Dockerfile.hf
│   │   └── README.md
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.jsx                            # router (BrowserRouter)
│   │   │   ├── pages/                             # Dashboard, BukuKas, Riwayat, Stok, Promo, Profile,
│   │   │   │                                      # Event, EventDetail, Karya, Notifikasi, Pengaturan,
│   │   │   │                                      # auth/Login, auth/Register, auth/LupaPass, auth/ResetPassword
│   │   │   ├── components/Sidebar.jsx
│   │   │   ├── components/forms/ProfileForm.jsx
│   │   │   ├── components/kas/TambahKas.jsx, EditKas.jsx
│   │   │   ├── components/profile/QrisUploadSection.jsx
│   │   │   ├── lib/uploadImage.js
│   │   │   ├── lib/supabase.js
│   │   │   ├── lib/unwrap.js
│   │   │   ├── services/realEndpoints.js
│   │   │   └── assets/styles/                     # tailwind + per-page CSS
│   │   ├── public/favicon.png
│   │   ├── .env.example
│   │   ├── .env.production
│   │   ├── package.json
│   │   └── README.md
│   └── openapi-artisan.yaml                       # v2.4.0, 1993 lines, 22 paths
│
├── Peken-Banyumasan-Kolaborator/                  # Kolaborator portal
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/v1/routers/                    # auth, profile, karya, story, event, event_request, notifikasi
│   │   │   ├── services/                          # event_service includes peran enrichment (v2.4.0)
│   │   │   ├── repositories/event_repo.py         # approved_event_perans()
│   │   │   ├── schemas/
│   │   │   └── ...
│   │   ├── tests/                                 # pytest (178 tests)
│   │   ├── Dockerfile.hf
│   │   └── README.md
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── pages/                             # Dashboard, Profil, Portofolio, Story, Event,
│   │   │   │                                      # Notifikasi, Pengaturan,
│   │   │   │                                      # auth/Login, auth/Register, auth/LupaPass, auth/ResetPassword
│   │   │   ├── components/                        # ImageUpload (folder-prop), Sidebar, etc.
│   │   │   ├── lib/uploadImage.js
│   │   │   ├── lib/supabase.js
│   │   │   ├── services/realEndpoints.js
│   │   │   └── ...
│   │   ├── public/favicon.png
│   │   └── README.md
│   └── openapi-colab.yaml                         # v2.4.0, 1355 lines, 17 paths
│
├── Peken Banyumasan Design System/                # design tokens + skill
│   ├── README.md
│   └── SKILL.md
│
├── backend_progress/PHASE_STATUS.md               # historical: backend build phases
│
├── .github/workflows/
│   ├── deploy-hf.yml                              # backend CI: push main → 4 HF Space pushes
│   └── keep-warm.yml                              # cron: ping 4 backends every 10 min
│
├── scripts/                                       # deploy + sync helpers (mostly historical)
│   ├── sync_common_for_hf.sh
│   ├── deploy_hf_spaces.sh
│   ├── set_hf_secrets.sh
│   ├── smoke_test.sh
│   └── ...
│
└── .claude/                                       # Claude Code worktrees (transient; safe to delete)
```

### Naming conventions

| Term in this repo | Meaning |
|---|---|
| `CP` | Company Profile app (public marketing site) |
| `Gate` | Gate Masuk-Keluar — admin panel |
| `UMKM` / `Artisan` | UMKM portal (artisan-facing) |
| `Kolaborator` / `Kolab` | Kolaborator portal (creative-collaborator-facing) |
| `peken_common` | Shared Python lib (NOT a sub-app) |
| `subsektor` | BEKRAF's 17 creative subsectors. Used by `kolaborator` and `events`. SINGULAR string on `karya`. |
| `kategori_usaha` | UMKM 9 business categories. Used ONLY on `artisans`. |
| `stand` | A physical booth in a zone (`A-3`, `B-2`, etc.) |
| `zona` | Zone (`A`, `B`, `C`, `P`) — collection of stands |
| `posisi_event` | Stand assignment alias used in event-artisan junction |
| `peran` | Role within an event (`performer`, `panitia`, `peserta`) — for kolaborator |
| `assigned_by` | `admin` (admin assigned) vs `self` (user self-applied) |
| `mirapat` | Banyumasan word for "rutin perjumpaan" — Peken's identity word |
| `aktivitas` | Admin-moderation feed for stories |

**Path segment conventions (in URLs):**
- `/kolaborator` (singular, not `/kolaborators`)
- `/artisan` (singular, not `/artisans`)

---

## 4. Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Backend language | Python | 3.11 (Dockerfile pins) |
| Backend framework | FastAPI | latest |
| ORM | SQLAlchemy (async) | 2.x |
| DB driver | asyncpg | latest |
| DB | Postgres | 15 (Supabase-managed) |
| Auth | Supabase Auth (GoTrue) | JWT ES256 |
| Storage | Supabase Storage | S3-compatible API |
| Realtime | Supabase Realtime (Postgres CDC) | latest |
| Frontend language | JavaScript (mostly) + a tiny bit of JSX | ES2022 |
| Frontend framework | React | 18 |
| Build tool | Vite (CP, Gate, Kolaborator) / Rolldown-Vite (UMKM) | latest |
| CSS | Tailwind CSS + inline styles (per app) | 3.x |
| Icons | lucide-react | latest |
| Routing | react-router-dom | 6.x |
| HTTP | native `fetch()` wrapped by `apiFetch` | - |
| Test (BE) | pytest + pytest-asyncio + pytest-mock | latest |
| Test (FE) | none formally — `npm run build` as smoke | - |
| Backend host | HuggingFace Spaces (CPU Basic free tier) | Docker SDK |
| Frontend host | Cloudflare Workers (with static assets) | wrangler |
| CI | GitHub Actions | - |
| Email | Supabase default SMTP (currently) | rate-limited 2/hr free tier |
| Currency | IDR (no symbol), `NUMERIC(15,2)` in DB | - |
| Timezone | WIB (UTC+7) for display; UTC ISO8601 for storage | |

---

## 5. Live URLs (Production)

**Client team — fill this in after deployment:**

### Your team's production URLs (template)

| App | Frontend URL | Backend URL | Source dir |
|---|---|---|---|
| Company Profile (public) | `https://_______` | `https://_______/health` | `Peken-Banyumasan-Company-Profile/` |
| Gate (admin panel) | `https://_______` | `https://_______/health` | `Peken-Banyumasan-Gate-Masuk-Keluar/` |
| Artisan (UMKM portal) | `https://_______` | `https://_______/health` | `peken-banyumas-UMKM-digital/` |
| Kolaborator (portal) | `https://_______` | `https://_______/health` | `Peken-Banyumasan-Kolaborator/` |

### Your team's Supabase project (template)

| Resource | Value |
|---|---|
| Project ref | `_______` (from Supabase Dashboard → Project Settings) |
| Project URL | `https://_______.supabase.co` |
| Region | `_______` (chose at project create) |
| Dashboard | `https://supabase.com/dashboard/project/_______` |
| DB pooler host | `aws-1-<region>.pooler.supabase.com:6543` |
| DB user | `postgres.<project_ref>` |
| Storage bucket | `peken-uploads` (must be created — see §11) |
| Storage region | (auto-assigned at bucket create) |

### Dev reference deployment (used during development — NOT client production)

These are the values used during development before handoff. Listed for reference only; AI consumers should treat them as illustrative, not as facts about your team's production.

<details>
<summary><b>Click to expand dev reference URLs</b></summary>

**Frontends (Cloudflare Workers, dev reference):**

| App | URL |
|---|---|
| CP | `https://peken-cp.banyumasan.workers.dev` |
| Gate | `https://peken-gate.banyumasan.workers.dev` |
| UMKM | `https://peken-umkm.banyumasan.workers.dev` |
| Kolaborator | `https://peken-kolaborator.banyumasan.workers.dev` |

**Backends (HuggingFace Spaces, dev reference):**

| App | URL |
|---|---|
| CP API | `https://jauharfz-peken-cp-api.hf.space` |
| Gate API | `https://jauharfz-peken-gate-api.hf.space` |
| UMKM API | `https://jauharfz-peken-umkm-api.hf.space` |
| Kolaborator API | `https://jauharfz-peken-kolaborator-api.hf.space` |

**Supabase (dev reference):**

| Resource | Value |
|---|---|
| Project ref | `cpobfflpavzanaebodef` |
| Project URL | `https://cpobfflpavzanaebodef.supabase.co` |
| Region | `ap-southeast-1` (Singapore) |
| DB pooler | `aws-1-ap-southeast-1.pooler.supabase.com:6543` |
| Storage region | `ap-northeast-1` (Tokyo) |

**Dev GitHub:**

| Resource | URL |
|---|---|
| Dev repo | `https://github.com/jauharfz/peken-dev` |

</details>

### NOT used / available for future

- Custom domain (e.g. `banyumasan.id`): **NOT REGISTERED** as of 2026-05-29. Either client team or original dev would need to register + configure custom domain on the chosen frontend platform (CF / Vercel / etc.). See §20 for why this matters for production email.
- WhatsApp Business / Meta Cloud API: not configured.
- Custom SMTP (Resend etc.): not configured; uses Supabase default.

---

## 6. Environment Variables

Variable **names and roles** below are authoritative — backends and frontends will fail to start without them. Variable **values** must be populated with the client team's actual deployment values (not the dev-reference values used during development).

Notation:
- `<your-...>` = placeholder; replace with team's actual value.
- All `SUPABASE_*` values come from the team's Supabase project (Dashboard → Project Settings → API + Database).

### Backend env (per the 4 backends — set on whatever platform: HF Space secrets, Render env vars, Railway variables, Koyeb secrets, etc.)

All 4 backends need:

| Variable | Required | Source | Example shape |
|---|---|---|---|
| `SUPABASE_URL` | yes | Supabase Dashboard → API | `https://<your-project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase Dashboard → API → "Reveal" | `eyJ...` (long JWT, **NEVER expose to FE**) |
| `SUPABASE_DB_URL` | yes | Supabase Dashboard → Database → URI (Transaction pooler) | `postgresql+asyncpg://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres` |
| `CORS_ORIGINS` | yes | Team-decided | Frontend URL(s) for that backend; comma-separated. E.g. `https://<your-cp-fe>` for CP API |
| `ENV` | yes | Team-decided | `production` (or `staging`/`development`) |
| `LOG_LEVEL` | yes | Team-decided | `INFO` (or `DEBUG`, `WARNING`) |

Gate, Artisan, Kolaborator additionally need:

| Variable | Required | Source |
|---|---|---|
| `SUPABASE_JWT_SECRET` | yes | Supabase Dashboard → JWT Settings → "JWT Secret" — for verifying inbound JWTs from FE |

Artisan API additionally:

| Variable | Required | Default |
|---|---|---|
| `QRIS_BUCKET` | yes | `peken-uploads` (the active bucket name — see §11) |
| `QRIS_MAX_BYTES` | yes | `5242880` (5 MB) |

Common gotchas:
- **`SUPABASE_DB_URL` MUST use the transaction pooler (port 6543)**, not the direct connection. HF/Render/Railway/Koyeb all expose to the public internet; pooler is what Supabase supports there. Pooler hostname is region-dependent.
- **`SUPABASE_JWT_SECRET`** is a different value from `SUPABASE_SERVICE_ROLE_KEY`. The JWT secret signs/verifies the access token; service_role is itself a long-lived JWT.

### Frontend env (per the 4 frontends — set in CF Pages env vars, Vercel project env, Netlify env, OR committed in `.env.production`)

**Important**: `.env.production` IS committed to repo (intentional — values are public-by-design: anon-key is RLS-bounded; URLs are visible to anyone using the site). `.env` (local dev) is gitignored.

All 4 frontends need:

| Variable | Required | Example value |
|---|---|---|
| `VITE_API_URL` | yes | URL of the corresponding backend, no trailing `/api` (e.g. `https://<your-cp-api-host>`) |
| `VITE_DUMMY_MODE` | yes | `false` (production); `true` enables FE-only demo mode without backend |

CP-specific (no auth — public site):
- Only `VITE_API_URL` + `VITE_DUMMY_MODE`. No Supabase env (CP doesn't authenticate).

Gate-specific (admin/petugas — auth required):

| Variable | Required | Example value |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | `https://<your-project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Long JWT from Supabase Dashboard → API → "anon" |
| `VITE_ARTISAN_URL` | yes | URL of Artisan (UMKM) frontend (Gate's Profile.jsx redirects there) |
| `VITE_COMPANY_URL` | yes | URL of CP frontend (for `/assets/*` legacy preview resolution + "Lihat CP" button) |

Artisan (UMKM) specific (auth required):

| Variable | Required | Example value |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | `https://<your-project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Anon JWT |

Kolaborator-specific (auth required):

| Variable | Required | Example value |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | `https://<your-project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Anon JWT |

### `.env.example` files in repo

Each frontend has an `.env.example` showing the structure with placeholder values. The team should:
1. Copy `.env.example` → `.env` for local dev.
2. For production: edit `.env.production` (committed) with their team's values, OR set those env vars in the hosting platform's UI (Vercel/CF env vars override `.env.production`).

---

## 7. Credentials & Secrets Management

### What credentials exist (per a fresh deployment)

| Credential | Type | Where to find it | Stored in | Used by |
|---|---|---|---|---|
| Supabase anon key | JWT (public) | Dashboard → Project Settings → API → "anon" | FE `.env.production` (committed) + FE hosting platform env vars | Frontends (auth + realtime) |
| Supabase service_role key | JWT (secret) | Dashboard → Project Settings → API → "service_role" "Reveal" | BE hosting platform secret env var ONLY | Backends (server-side, bypasses RLS) |
| Supabase JWT secret | string (secret) | Dashboard → Project Settings → JWT Settings → "JWT Secret" | BE hosting platform secret env var ONLY | Backends (verify JWTs sent by FE) |
| Supabase DB password | string (secret) | Set at project create OR Dashboard → Database → Reset password | Inside `SUPABASE_DB_URL` on BE hosting platform | Backends |
| Supabase Management token | secret (`sbp_...`) | https://supabase.com/dashboard/account/tokens → "Generate new token" | NOT in repo — operator only | Admin scripts (configure SMTP, fetch keys, etc.) |
| Backend hosting platform token | secret | Platform-specific (HF "write" token / Render API key / Railway token / Koyeb API key / etc.) | GitHub Actions secret if CI auto-deploys, OR operator local | CI / deploy scripts |
| Frontend hosting platform token | secret | Platform-specific (Cloudflare API token / Vercel token / Netlify token) | GitHub Actions secret if used | Optional CI for FE deploys (usually git auto-deploy doesn't need this) |

### Anon key vs service_role key — when to use which

- **Anon key**: safe to ship to browser. Subject to RLS. Used by Gate/Artisan/Kolaborator FE for Supabase Auth + Storage uploads + Realtime subscriptions.
- **Service role key**: BYPASSES ALL RLS. Used by backends for: admin operations (create user, send email via auth admin), and routine DB queries where the backend has already validated the user. NEVER ship to frontend.

### Rotation schedule — RECOMMENDED

| Credential | Rotation cadence | Triggering events |
|---|---|---|
| Supabase service_role key | Every 6 months OR immediately on suspected leak | Reset via Project Settings → API → "Reset service_role" |
| DB password | Every 6 months OR on leak | Project Settings → Database → Reset password |
| Supabase JWT secret | Every 12 months (rotates all sessions) | Project Settings → JWT Settings (causes user re-login wave) |
| Backend platform deploy token | On team-member offboarding | Platform-specific (HF: huggingface.co/settings/tokens; Render: API Keys; etc.) |
| Test account passwords (`Admin123!`, etc.) | Before client takeover; after dev shares them | Reset via Gate UI |
| Supabase Management token | After any operator session ends | Account → Access Tokens |

### Rotation procedure (single key — example: service_role)

1. Note current value (in case rollback needed within 5 min).
2. Supabase Dashboard → Project Settings → API → service_role → "Reveal" → "Reset".
3. Copy new key.
4. For each of the 4 backends (platform-specific):
   - HF Spaces: Settings → Variables and secrets → edit `SUPABASE_SERVICE_ROLE_KEY` → save (Space auto-restarts ~30s).
   - Render / Railway / Koyeb / Fly: Service Settings → Environment → edit `SUPABASE_SERVICE_ROLE_KEY` → save (auto-restart).
   - VPS / self-hosted: ssh in, edit env file, restart service (e.g. `systemctl restart <service>`).
5. Smoke test: `curl https://<each-backend-host>/health` → expect HTTP 200.
6. If any 5xx → swap back to old key while debugging.

### Emergency: full credential reset (after suspected breach)

1. Rotate service_role + JWT secret + DB password (in that order, each ~5 min apart).
2. Rotate any backend-platform deploy tokens, regenerate any CI/CD secrets (GitHub Actions, etc.).
3. Reset all admin/petugas account passwords via Gate UI.
4. Audit `auth.audit_log_entries` in Supabase for suspicious sign-ins last 30 days.
5. Re-deploy all 4 backends after secret updates.
6. Inform users by Gate notification banner.

---

## 8. Database Schema (Summary)

**Canonical sources** (this section is a summary; defer to these for detail):
- `db/schema.sql` (1581 lines) — every table, trigger, RLS policy, seed.
- `db/SCHEMA_MAP.md` (~977 lines) — human-readable companion with cross-OA refs.

### 20 tables

| # | Table | Purpose | Key RLS |
|---|---|---|---|
| 1 | `users_profile` | Auth-user extension (role, nama, jabatan) | Read own / admin |
| 2 | `artisans` | UMKM profile (1 row per artisan user) | Public read (aktif) / own / admin |
| 3 | `kolaborators` | Kolab profile (1 row per kolab user) | Public read (aktif) / own / admin |
| 4 | `events` | Peken editions / events | Public read (published+) / admin / petugas read |
| 5 | `event_kolaborators` | M:N: events × kolaborators | Admin / petugas read |
| 6 | `event_artisans` | M:N: events × artisans (with stand_id) | Admin / petugas read |
| 7 | `artisan_requests` | Self-apply queue (artisans → events) | Own / admin |
| 8 | `kolaborator_requests` | Self-apply queue (kolab → events) | Own / admin |
| 9 | `zones` | A/B/C/P zone layout + stands JSONB | Admin / petugas read |
| 10 | `karya` | Polymorphic: published works (artisan OR kolab) | Public read / own / admin |
| 11 | `stories` | Polymorphic: kolab stories | Public read (aktif) / kolab own / admin moderate |
| 12 | `stok` | Artisan inventory (UMKM) | Artisan own |
| 13 | `kas` | Artisan cash ledger (masuk/keluar) | Artisan own |
| 14 | `promo` | Artisan promotion entries | Artisan own |
| 15 | `company_profile_sections` | CP marketing content (opaque JSONB per section) | Public read / admin |
| 16 | `programs` | CP program list (legacy — see SCHEMA_MAP §3.16) | Public read / admin |
| 17 | `visitors` | Visitor tap log (NFC + manual) | Admin / petugas RW (NO public; aggregate-only via service_role) |
| 18 | `notifikasi` | In-app notifications | Own |
| 19 | `otp_codes` | **LEGACY** — pre-Supabase forgot-password | service_role only (default-deny) |
| 20 | `password_reset_tokens` | **LEGACY** — pre-Supabase forgot-password | service_role only |

### Computed-by-trigger fields (NEVER write directly)

| Table | Field | Computed by |
|---|---|---|
| `artisans` | `total_penjualan` | Backend business logic from `kas` masuk |
| `artisans` | `komisi_terkumpul` | Backend: `total_penjualan * komisi_persen / 100` |
| `artisans` | `qris_updated_at` | DB trigger `trg_artisans_qris_ts` |
| `artisans` | `slug` | DB trigger `trg_artisans_slug` |
| `kolaborators` | `total_karya` | DB trigger `update_kolaborator_counts()` |
| `kolaborators` | `total_story` | DB trigger (counts aktif only) |
| `kolaborators` | `total_event` | DB trigger (excludes dibatalkan) |
| `kolaborators` | `slug` | DB trigger `trg_kolaborators_slug` |
| `events` | `peserta_count` | DB trigger `update_event_peserta_count()` |
| `kas` | `saldo_after` | Backend business logic on every kas mutation |
| 15 timestamped tables | `updated_at` | DB trigger `set_updated_at()` (BEFORE UPDATE) |

### Canonical naming (IMMUTABLE)

| Field | Allowed values | Where |
|---|---|---|
| `artisans.kategori_usaha[]` | UMKM 9 (Appendix B) | Only on `artisans` |
| `kolaborators.subsektor[]` | BEKRAF 17 (Appendix C) | Only on `kolaborators` |
| `events.subsektor[]` | BEKRAF 17 (Appendix C) | Only on `events` |
| `karya.subsektor` (SINGULAR string) | BEKRAF 17 single value | Only on `karya` |
| Role enum | `admin \| petugas \| artisan \| kolaborator` | `users_profile.role` + JWT |
| `events.status` enum | `draft \| published \| berlangsung \| selesai` | Admin sets draft/published; berlangsung/selesai derived (see §12) |
| `kas.metode` enum | `tunai \| qris` | DB CHECK + OA enums |
| `kas.jenis` enum | `masuk \| keluar` | DB CHECK |
| `visitors.status` enum | `di_dalam \| keluar` | DB CHECK |
| `stories.status` enum | `aktif \| dihapus \| disembunyikan` | DB CHECK |

### Critical DB invariants — do not violate

1. **`artisans` table has sensitive columns** (`email`, `no_hp`, `total_penjualan`, `komisi_persen`, `komisi_terkumpul`, `internal_notes`). NEVER expose via `/api/public/*` or `/api/artisan/me` — backend MUST projection-filter.
2. **`kolaborators.no_hp` and `kolaborators.internal_notes`** are admin-only (collected by admin via Gate edit drawer; never returned to kolab portal or public).
3. **`visitors.uid` (NFC card UID) is sensitive**. No public_read RLS policy by design — backend uses service_role to expose only aggregate counts in `/api/public/stats`.
4. **Polymorphic foreign keys** (`karya.owner_id`, `stories.author_id`) have NO actual FK constraint — they reference artisan OR kolaborator depending on `owner_type`/`author_type`. Backend validates on insert.
5. **`event_artisans.stand_id`** references `zones.stands[].id` (JSONB) — no FK, backend validates.

---

## 9. Cross-App Invariants — IMMUTABLE

Enforced by `bash db/verify_cross_consistency.sh` (16 checks). Must pass before ANY deploy.

| # | Check | Rule |
|---|---|---|
| 1 | YAML files exist and parse | All 4 OA load |
| 2 | DB CHECK constraints exist | Roles, statuses, enums all enforced |
| 3 | RLS enabled on all 20 tables | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| 4 | Required-fields cross-spec | Required[] match between specs and DB NOT NULL |
| 5 | OpenAPI version sync | All 4 specs at same `info.version` |
| 6 | Constants parity | UMKM 9 + BEKRAF 17 lists identical in FE + BE + this doc |
| 7 | Admin-only fields not leaked | `internal_notes`, `no_hp` (kolab) absent from public + own-portal responses |
| 8 | DB enum coverage in OA | All DB CHECK values present in OA enum |
| 9 | OA version matches SCHEMA_MAP | Latest section header date in SCHEMA_MAP matches OA `info.version` |
| 10 | Canonical naming | `kategori_usaha` never aliased as `subsektor`, vice versa |
| 11 | Karya.subsektor SINGULAR | Not an array in any spec or DB |
| 12 | Junction shape consistency | `EventArtisan`/`EventKolaborator` same fields across specs |
| 13 | Petugas RLS policies | 11 petugas policies exist (D13a + D14) |
| 14 | DB CHECK enums match OA | Same values, no drift |
| 15 | Stub endpoints documented | OTP + password reset stubs present in artisan + colab (legacy — see §10) |
| 16 | posisi/posisi_event alias | Documented in gate + artisan yaml |

### Vocabulary (CANONICAL — non-negotiable)

| Use | DON'T use |
|---|---|
| `kolaborator` | `member`, `kreator`, `collaborator` |
| `artisan` | `tenant`, `umkm`, `pedagang` |
| `aktivitas` (admin moderation feed) | `admin/stories`, `feed` |
| Path segment `/kolaborator` (singular) | `/kolaborators` |
| Path segment `/artisan` (singular) | `/artisans` |
| `mirapat` (in Banyumas language; project identity) | "regular meeting" |
| `panitia` | `staff`, `crew` (use within Indonesian context) |
| `peserta` | `member`, `attendee` |

### Money/time conventions

| Field | Convention |
|---|---|
| Currency | IDR (no symbol). `NUMERIC(15,2)` in DB. Serialized as string in JSON (`"42500.00"`) to avoid float precision. |
| Timestamps | UTC ISO 8601 (`2026-05-29T14:30:00.000Z`) |
| Dates | WIB local `YYYY-MM-DD` (no timezone — interpret as WIB) |
| Times | WIB 24-hour `HH:MM:SS` (occasionally `HH:MM`) |

### Response envelope (ALL backends)

```
Success: { "status": "success", "message": null, "data": <payload> }
Error:   { "status": "error",   "message": "<human-readable>", "data": null }
        (artisan/colab error may also have "errors": { field: [msg] } for form validation)
```

Frontend `extractData(response)` (in `lib/unwrap.js` or `services/endpoints.js`) strips envelope. Backend MUST always wrap.

---

## 10. Authentication & Roles

### Roles (canonical)

| Role | Lives in `app_metadata.role` | Provisioned by | Access summary |
|---|---|---|---|
| `admin` | yes | Supabase Dashboard (manual) OR superadmin via Gate `petugas-management` endpoints | Full Gate access; everything via gate.yaml |
| `petugas` | yes | Admin via Gate Petugas page | Dashboard + visitor scan + read-only events/zones; NO admin-only endpoints |
| `artisan` | yes | Self-register via UMKM portal (`POST /api/auth/register`) — atomic Supabase user + `artisans` row | Artisan portal only |
| `kolaborator` | yes | Self-register via Kolaborator portal | Kolaborator portal only |
| (anon) | n/a | n/a | Public CP only |

### JWT structure (post-login)

After `supabase.auth.signInWithPassword({email, password})`:
```json
{
  "iss": "supabase",
  "sub": "<user_uuid>",                   // == users_profile.id
  "aud": "authenticated",
  "exp": <unix>,                          // 1 hour default
  "app_metadata": { "role": "artisan" },  // ← read by backend + RLS
  "user_metadata": { "nama": "..." },     // ← FE display only
  ...
}
```

Backend verifies the JWT using `SUPABASE_JWT_SECRET`, extracts `app_metadata.role`, enforces per-route role guards (`@require_role("admin")` style).

### Session

- Supabase JS SDK stores session in `localStorage`. Lasts 1 hour, auto-refreshes via refresh_token.
- Each FE app has its own session storage. Logging into Gate does NOT log you into Artisan portal — they share Supabase user, but different localStorage entries.

### Login flow (per app)

1. FE: `supabase.auth.signInWithPassword({email, password})` → returns `{user, session}`.
2. FE stores via SDK; backend NEVER sees password.
3. FE: subsequent API calls include `Authorization: Bearer <access_token>`.
4. BE: `peken_common/auth/jwt.py` `CurrentUser` dep extracts user + role from JWT.
5. BE: route-specific role check rejects with 403 if mismatched (e.g. Gate artisan endpoint with kolab JWT).

### Register flow

#### Artisan / Kolaborator (self-register)

`POST /api/auth/register` to the respective backend (`umkm` or `kolaborator`).

Body:
```json
{
  "email": "...",
  "password": "...",
  "nama": "...",          // kolab full name
  "nama_usaha": "...",    // artisan business name
  "pemilik": "...",       // artisan owner name
  "no_hp": "...",
  "username": "...",      // artisan only
  ...
}
```

Backend (atomic):
1. `supabase.auth.admin.createUser(email, password, app_metadata={role: "artisan"|"kolaborator"})`
2. Insert into `users_profile` with role + nama
3. Insert into `artisans` or `kolaborators` with profile fields
4. If any step fails: rollback (delete Supabase user)

Returns: token + user_data (FE auto-logs in).

Default status: `pending`. Admin must activate via Gate.

#### Gate (admin/petugas) — admin-only provisioning

- **Admin**: created manually via Supabase Dashboard → Auth → Users → "Add user", set `app_metadata.role = "admin"`. Then insert into `users_profile` via SQL Editor:
  ```sql
  INSERT INTO public.users_profile (id, nama, role, jabatan)
  VALUES ('<auth_user_uuid>', 'Admin Name', 'admin', 'Superadmin');
  ```
- **Petugas**: created by admin via Gate UI (`/petugas` page → "Add Petugas" → form). Backend uses Supabase Admin SDK.

### Forgot-password flow (CURRENT — post PR #49, 2026-05-28)

**Channel**: Email via Supabase default SMTP (2/hour limit free tier).

1. User on `/lupa-password` page (Artisan or Kolaborator portal) submits email.
2. FE calls `supabase.auth.resetPasswordForEmail(email, {redirectTo: <origin>+'/reset-password'})`.
3. Supabase generates recovery token, embeds in URL, emails to user.
4. User clicks email link → opens browser at `<origin>/reset-password?<...token in fragment>`.
5. FE on `/reset-password` page detects recovery session via `supabase.auth.getSession()` / `onAuthStateChange("PASSWORD_RECOVERY", ...)`.
6. User enters new password.
7. FE calls `supabase.auth.updateUser({password: newPassword})`.
8. Supabase updates password + signs out recovery session.
9. FE redirects to login.

**Anti-enumeration**: Step 2 returns `200 OK` whether email is registered or not. FE shows generic message: "Jika email Anda terdaftar, kami sudah kirim link reset."

**Limitations**:
- Sender = `noreply@mail.app.supabase.io` (looks generic; may go to spam in Gmail).
- 2 emails/hour rate limit (Supabase free tier).
- Indonesia users often don't check email — see Section 20 for WhatsApp upgrade path.

### Anti-enumeration design (across all auth flows)

To prevent attackers from probing which emails are registered:

| Flow | Generic message (always) | Specific message (never) |
|---|---|---|
| Register w/ used email | "Email tidak bisa digunakan" | "Email already exists" |
| Register w/ wrong portal role | "Email tidak bisa digunakan" | "This email is for kolaborator portal" |
| Login w/ wrong email | "Email atau password salah" | "Email not found" |
| Login w/ wrong password | "Email atau password salah" | "Wrong password" |
| Forgot-password w/ unknown email | "Jika terdaftar, link sudah dikirim" | "Email not found" |

### Status guards (login)

- `users_profile.role = artisan` AND `artisans.status = pending`: login allowed, FE shows "Akun belum diaktifkan admin" banner; gated from main features.
- `users_profile.role = artisan` AND `artisans.status = suspended`: login REJECTED with message "Akun Anda telah ditangguhkan. Hubungi panitia."
- Same logic for kolaborator.

### Legacy / dead endpoints

| Endpoint | Status | In OA? | In FE? | Notes |
|---|---|---|---|---|
| `POST /api/auth/otp/request` | LEGACY stub | Yes (artisan + colab) | No | Backend returns 501; FE uses Supabase native flow |
| `POST /api/auth/otp/verify` | LEGACY stub | Yes | No | Same |
| `POST /api/auth/password/reset` | LEGACY stub | Yes | No | Replaced by Supabase Auth `updateUser` |
| Tables `otp_codes`, `password_reset_tokens` | LEGACY | n/a | n/a | Empty in prod. Safe to DROP after 2026-08-28. |

OA stubs kept to satisfy cross-consistency check 15. To fully remove (when ready): bump OA to v2.5.0, remove endpoints, update check 15 in `verify_cross_consistency.sh`.

---

## 11. Storage (Supabase Storage)

### Active bucket: `peken-uploads`

| Property | Value |
|---|---|
| Public read | Yes |
| Authenticated write | Yes (RLS-gated) |
| Max file size | 5 MB |
| Allowed MIME types | `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif` |
| Region | `ap-northeast-1` (Tokyo) |
| Created | 2026-05-25 |
| Deleted bucket (history) | `qris` (deleted 2026-05-29 — folder moved into `peken-uploads/qris/`) |

### Folder convention

Every upload goes into a domain-named folder. The folder is passed as the 2nd arg to `uploadImage(file, folder)`.

| Folder | Used by | Stores |
|---|---|---|
| `cp/` | Gate `CompanyProfile.jsx` ImageInput component | CP marketing assets (hero slides, manifesto images, tokoh portraits, etc.) |
| `event/` | Gate `EventModal` ImageUpload | Event banner + galeri |
| `profil/` | UMKM `ProfileForm` ImgField + Kolaborator `Profil.jsx` via shared ImageUpload | Artisan/kolab foto + cover |
| `qris/` | UMKM `QrisUploadSection` | Artisan QRIS payment image |
| `bukti/` | UMKM `TambahKas.jsx` + `EditKas.jsx` | Kas transaction proof images |
| `story/` | Kolaborator `Story.jsx` via shared ImageUpload | Story media attachments |
| `portofolio/` | Kolaborator `Portofolio.jsx` via shared ImageUpload | Karya gallery |
| `karya/` | (reserved — currently not in use) | |

### Client integration

Every FE that uploads images has a `lib/uploadImage.js`:

```js
import { supabase } from './supabase';

export async function uploadImage(file, folder = 'general') {
  if (!file) return '';
  if (!/^image\//.test(file.type)) throw new Error('Hanya gambar (PNG, JPG, WebP, GIF) yang diizinkan');
  if (file.size > 5 * 1024 * 1024) throw new Error('Maksimal 5 MB');

  const ext = file.name.split('.').pop().toLowerCase();
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  try {
    const { error } = await supabase.storage.from('peken-uploads').upload(key, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('peken-uploads').getPublicUrl(key);
    return publicUrl;
  } catch (e) {
    // Fallback: base64 data URL (works for <img>; reduces storage dep)
    return await toDataUrl(file);
  }
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
```

The FE just stores whichever URL is returned — both Supabase URL and `data:image/...` work fine in `<img src="">`.

### Storage RLS (on `storage.objects`)

| Policy name | Operation | Rule |
|---|---|---|
| `peken_uploads_public_read` | SELECT | `bucket_id = 'peken-uploads'` |
| `peken_uploads_authenticated_write` | INSERT | `bucket_id = 'peken-uploads' AND auth.role() = 'authenticated'` |
| `peken_uploads_owner_update` | UPDATE | `bucket_id = 'peken-uploads' AND owner = auth.uid()` |
| `peken_uploads_owner_delete` | DELETE | `bucket_id = 'peken-uploads' AND owner = auth.uid()` |

Configured via Supabase Dashboard → Storage → Policies. Service role bypasses RLS entirely (backend can do any operation).

### Provisioning new buckets (future ops)

To add a new bucket (e.g. for backups, logs):
1. Supabase Dashboard → Storage → New bucket → name, public toggle, file size limit.
2. Set RLS policies on `storage.objects` for that `bucket_id`.
3. Document in `SCHEMA_MAP.md` Storage section.

To delete: prefer Storage REST API DELETE (`storage.protect_delete` trigger blocks direct SQL):
```bash
SR_KEY=<service_role>
SUPABASE_URL=https://<your-project-ref>.supabase.co
# 1. Empty
curl -X POST -H "apikey: $SR_KEY" -H "Authorization: Bearer $SR_KEY" \
  $SUPABASE_URL/storage/v1/bucket/<name>/empty
# 2. Delete bucket
curl -X DELETE -H "apikey: $SR_KEY" -H "Authorization: Bearer $SR_KEY" \
  $SUPABASE_URL/storage/v1/bucket/<name>
```

---

## 12. Hybrid Event Status Model

### Source of truth

**`peken_common/lib/event_status.py`** — `effective_event_status()` and `is_event_live()`.

Mirror in JS for FE: each FE has its own JS helper (search for `effective_event_status` or equivalent in `lib/`). FE and BE MUST stay in sync; backend is canonical.

### Model

Admin sets only TWO status values: `draft` or `published`. The DB stores these in `events.status` (along with the legacy values `berlangsung`, `selesai` which can also be set but are derived effectively).

`effective_event_status(status, tanggal, tanggal_selesai, jam_mulai, jam_selesai, now?)` returns:

| Returned | Meaning | When |
|---|---|---|
| `draft` | Admin hasn't published | `status == 'draft'` |
| `published` | Akan datang (scheduled, hasn't started) | non-draft AND `now < start_dt` |
| `berlangsung` | Currently happening | non-draft AND `start_dt <= now <= end_dt` |
| `selesai` | Finished | non-draft AND `now > end_dt` |

Where:
- `start_dt = combine(tanggal, jam_mulai or 00:00:00) tz=WIB`
- `end_dt = combine(tanggal_selesai or tanggal, jam_selesai or 23:59:59) tz=WIB`

### Usage

#### Backend
```python
from peken_common.lib.event_status import effective_event_status, is_event_live
from peken_common.lib.timezone import now_wib

# In service: override raw status with effective (CP public — read-only):
e.status = effective_event_status(
    e.status, e.tanggal, e.tanggal_selesai, e.jam_mulai, e.jam_selesai
)

# Or expose `status_efektif` alongside raw `status` (Gate — admin uses raw for toggle):
e.status_efektif = effective_event_status(...)

# Gate visitor input — only allow taps when berlangsung:
if not is_event_live(...):
    raise HTTPException(403, "Event tidak sedang berlangsung")
```

#### Frontend (CP HomeScreen + Artisan/Kolab Event cards)

CP's `PublicProfileScreen.jsx` `EV_LABEL` maps:
```js
const EV_LABEL = {
  upcoming: 'Akan Datang',
  berlangsung: 'Berlangsung',
  selesai: 'Selesai',
  published: 'Akan Datang',   // ← effective_event_status returns 'published' for upcoming
  draft: 'Draft'
};
```

### Important consequences

- The CP backend OVERRIDES `events.status` in its responses (read-only context, no admin toggle present).
- The Gate backend EXPOSES raw `status` (admin needs it for publish toggle) + `status_efektif` field for display.
- The Artisan + Kolaborator backends do the same (their event lists show derived status).
- `is_event_live()` is the AUTHORITATIVE check for "can visitor tap right now". Used in Gate dashboard manual entry and visitor scan endpoints.

### Why this design

Original problem: Admin had to manually flip `status` from `published` → `berlangsung` → `selesai` as time passed. Error-prone. Sometimes admin forgot, so a finished event still showed "berlangsung".

Solution: Admin sets intent (draft vs published); system derives time-based status from schedule. Single source of truth = clock + schedule. Admin can't forget.

---

## 13. Money Model

### Storage

- `NUMERIC(15,2)` in DB — no float, no rounding errors.
- Serialized as STRING in JSON envelopes (`"42500.00"`) to preserve precision. FE displays with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.

### Tables involved

| Table | Field | Computed |
|---|---|---|
| `kas` | `nominal` | User-entered |
| `kas` | `saldo_after` | Backend on every insert/update |
| `artisans` | `total_penjualan` | Backend: SUM(kas masuk) per artisan |
| `artisans` | `komisi_persen` | Admin sets (0-100, NUMERIC(5,2)) |
| `artisans` | `komisi_terkumpul` | Backend: `total_penjualan * komisi_persen / 100` |

### Invariants (must hold)

1. **saldo invariant**: For any artisan's kas ledger ordered by `tgl` ASC, `created_at` ASC:
   - First entry: `saldo_after = nominal` (if jenis='masuk') OR `-nominal` (if jenis='keluar')
   - Subsequent: `saldo_after[N] = saldo_after[N-1] + nominal[N]` (if masuk) OR `saldo_after[N-1] - nominal[N]` (if keluar)
2. **total_penjualan invariant**: `artisans.total_penjualan == SUM(kas.nominal WHERE kas.artisan_id = artisans.id AND kas.jenis = 'masuk')`. This is THE canonical omset definition (v2.4.2) — no `kategori` filter: the artisan FE hardcodes `kategori='Penjualan'` on every kas masuk, so `jenis='masuk'` alone is exact (verified against the live DB 2026-06-11).
3. **komisi invariant**: `artisans.komisi_terkumpul == artisans.total_penjualan * artisans.komisi_persen / 100` (with proper Decimal rounding to 2dp).
4. **Atomic updates**: Inserting/updating/deleting a kas row MUST trigger backend re-computation of `saldo_after`, `total_penjualan`, `komisi_terkumpul` in one transaction. Use service_role bypass for these writes. ⚠️ As of 2026-06-11 the artisan backend does NOT do this (invariants 1–3 all violated in the live DB — aggregates stay 0); fix + backfill SQL = `PLANS/artisan_plan.md` ART-1.

### Kas methods

| `kas.metode` | Meaning |
|---|---|
| `tunai` | Cash |
| `qris` | QRIS payment |

`transfer` was removed in schema v2.2.2 — frontend never offered it. DO NOT add back without reviewing the FE form (`TambahKas.jsx` / `EditKas.jsx`).

### Kas jenis vs kategori

- `jenis`: enum `masuk | keluar` (income vs expense)
- `kategori`: free-text label (`Penjualan`, `Pengembalian`, `Operasional`, etc.) — used for filtering and reporting

Typical categories used by the artisan:
- masuk: `Penjualan`, `Lain-lain`, `Refund`
- keluar: `Operasional`, `Bahan Baku`, `Sewa`, `Lain-lain`

### Reporting (admin via Gate)

The Gate `/api/reports/artisan` endpoint aggregates per-artisan figures using SQL embedded in `artisans` table COMMENT (see `db/schema.sql` line ~285). Returns:
- `omset` (= total_penjualan)
- `komisi_persen`
- `transaksi` (count of masuk entries)
- `event_count` (DISTINCT events the artisan participated in)
- `stand_terakhir` (latest assigned stand)

### Verifying money integrity (operations check)

```sql
-- Re-compute total_penjualan from kas; should equal artisans.total_penjualan
SELECT a.id, a.nama_usaha, a.total_penjualan AS stored,
       COALESCE(SUM(k.nominal) FILTER (WHERE k.jenis='masuk'), 0) AS computed
FROM artisans a
LEFT JOIN kas k ON k.artisan_id = a.id
GROUP BY a.id, a.nama_usaha, a.total_penjualan
HAVING a.total_penjualan != COALESCE(SUM(k.nominal) FILTER (WHERE k.jenis='masuk'), 0);
-- Expect: 0 rows (no drift)
```

Run periodically; flag drifts.

---

## 14. Per-App Guide

### 14.1 Company Profile (CP)

**URL**: (your team's CP frontend host; see §5)

**Purpose**: Public marketing site. Showcases:
- Hero + brand identity
- Manifesto + ekosistem
- Upcoming + past events
- Karya / Publication catalogue (artisan + kolab work)
- Stories (kolab posts)
- Public profiles (`/profile/<slug>`)
- Programs

**Auth**: None (public). Has a `Login` button that opens `LoginModal` → redirects to one of the three portal sibling apps based on role detection from Supabase session (if any).

**Routing**: Single-page React, no react-router — uses internal screen state in `App.jsx`. The path `/profile/<slug>` is special-handled (extracted from URL on mount). Other paths handled internally.

**Key screens**:
| Screen | Component | API |
|---|---|---|
| Home | `HomeScreen.jsx` | `/api/public/stats`, `/api/public/events/upcoming` |
| About | `AboutScreen.jsx` | `/api/public/profile-sections?section=about,tim`, `/api/public/stats` |
| Works/Publication | `WorksScreen.jsx` | `/api/public/profile-sections?section=works` (or `/api/public/karya`) |
| Gallery | `GalleryScreen.jsx` | `/api/public/profile-sections?section=gallery` |
| Programs | `ProgramScreen.jsx`, `ProgramDetailScreen.jsx` | `/api/public/profile-sections?section=programs` |
| Public Profile | `PublicProfileScreen.jsx` | `/api/public/profiles/<slug>` |

**Content management**: CP marketing content is editable via Gate's "Kelola Company Profile" page. All sections (home, about, tim, programs, works, gallery) come from the `company_profile_sections` table — opaque JSONB content driven by the Gate editor.

**Gotchas**:
- `/api/public/karya` and `/api/public/programs` endpoints still exist on backend BUT the CP frontend no longer calls them (replaced by `company_profile_sections.works` and `.programs` sections). Kept for backward compat.
- The "KARYA → PUBLICATION" rename (in CP nav) is UI-only — backend table is still `karya`.
- Login button: if Supabase session detected (shared across `*.workers.dev` subdomains via cookies), shows profile button instead.

### 14.2 Gate (Admin Panel)

**URL**: (your team's Gate frontend host; see §5)

**Purpose**: Admin and petugas operations console.

**Auth**: Supabase login required. Role must be `admin` or `petugas`.

**Roles inside Gate**:
- `admin`: full access
- `petugas`: dashboard + visitor scan + read-only (events, zones, artisans, kolaborators); NO write to admin-only resources

**Routing**: `BrowserRouter` (in `App.jsx`). Routes guarded by `<AdminRoute>` (admin-only) or `<PetugasRoute>` (admin OR petugas).

**Pages**:

| Path | Component | Guard | Function |
|---|---|---|---|
| `/` | `Dashboard.jsx` | Admin or Petugas | Live visitor count, recent activity, manual masuk/keluar, realtime feed |
| `/dashboard` | (alias) | | |
| `/artisan` | `Artisan.jsx` | Admin | List + edit drawer (komisi slider, status toggle, event tab, kas read-only) |
| `/kolaborator` | `Kolaborator.jsx` | Admin | List + edit drawer (event tab, karya/story moderation read-only) |
| `/events` | `Events.jsx` | Admin | Event CRUD; publish toggle; participants management |
| `/events/:id` | `EventDetail.jsx` | Admin | Per-event detail: artisan assignments, kolab list, requests queue |
| `/reports` | `Reports.jsx` | Admin | Visitor report; artisan revenue report; per-event accumulation |
| `/company-profile` | `CompanyProfile.jsx` | Admin | 6-tab editor (beranda/tentang/tim/program/karya/galeri) → `company_profile_sections` |
| `/petugas` | `Petugas.jsx` | Admin | Petugas account CRUD: create, edit jabatan, disable, reset password |
| `/zones` | (in Settings) | Admin | Zone/stand layout editor |
| `/monitor` | `Monitor.jsx` | (no guard — open in new tab) | Full-screen visitor counter for public display (no NFC, no controls; just count) |
| `/notifikasi` | `Notifikasi.jsx` | Admin | Bell icon dropdown / dedicated page |
| `/profile` | `Profile.jsx` | Admin or Petugas | Self profile + redirects to sibling app's public artisan view |
| `/login` | `Login.jsx` | Public | Supabase signInWithPassword |
| `/lupa-password` | (not implemented for Gate yet; petugas reset via admin) | | |

**Realtime**: Dashboard subscribes to `visitors` INSERT/UPDATE via Supabase Realtime to live-update the activity feed.

**Manual masuk/keluar**:
- Admin (or petugas) types name → POST `/api/dashboard/manual-entry` → inserts `visitors` row.
- Gated by `is_event_live(active_event)`. If no event live → backend rejects with 403 "Tidak ada event yang sedang berlangsung."

**Monitor (display mode)**: full-screen visitor counter, switches theme by hour (Siang 06:00–18:00 cream/sage; Malam 18:00–06:00 deep-olive/light-sage). No NFC integration; just polls visitor counts every few seconds.

### 14.3 Artisan (UMKM Portal)

**URL**: (your team's Artisan/UMKM frontend host; see §5)

**Purpose**: Per-artisan dashboard for UMKM owners. Sales tracking, inventory, promo, event participation, public profile (read by CP).

**Auth**: Supabase login. Role: `artisan`. Self-register allowed via `/register`.

**Pages**:

| Path | Component | Function |
|---|---|---|
| `/` | `Dashboard.jsx` | Active event countdown, kas summary, recent activity |
| `/buku-kas` | `BukuKas.jsx` | Full kas ledger CRUD (masuk + keluar) |
| `/riwayat` | `Riwayat.jsx` | Sales history view (filtered kas masuk) |
| `/stok` | `Stok.jsx` | Inventory CRUD (with stok_min warnings) |
| `/promo` | `Promo.jsx` | Promotional campaign CRUD |
| `/karya` | `Karya.jsx` | Karya CRUD (artisan publication) |
| `/profil` | `Profile.jsx` | Edit profile, upload QRIS, foto + cover, kategori_usaha |
| `/event` | `Event.jsx` | List events; "Daftar Event" → POST `artisan_requests` |
| `/event/:id` | `EventDetail.jsx` | Single event detail + my stand assignment |
| `/notifikasi` | `Notifikasi.jsx` | Notification list |
| `/pengaturan` | `Pengaturan.jsx` | Change password (Supabase native) |
| `/login` | `auth/Login.jsx` | Supabase signIn |
| `/register` | `auth/Register.jsx` | Atomic register (backend BE-intermediary) |
| `/lupa-password` | `auth/LupaPass.jsx` | Supabase resetPasswordForEmail |
| `/reset-password` | `auth/ResetPassword.jsx` | Detect recovery session → updateUser |

**Key business logic**:

- **Kas ledger**: Adding/editing/deleting a kas row triggers re-compute of `saldo_after` chain, `total_penjualan`, `komisi_terkumpul`. Backend service handles atomicity.
- **Sidebar**: Shows `nama_usaha` (primary) + `pemilik` (subtitle).
- **Event Apply**: User clicks "Daftar Event" → optional `posisi_event` (stand preference) → POST → admin sees in Gate; admin approves → row moves to `event_artisans`.
- **QRIS**: Upload PNG/JPG via QrisUploadSection. Stored at `peken-uploads/qris/<artisan_id>.<ext>`. `qris_updated_at` auto-set by DB trigger.

### 14.4 Kolaborator (Kolab Portal)

**URL**: (your team's Kolaborator frontend host; see §5)

**Purpose**: Per-kolaborator dashboard. Karya gallery, story posts, event participation, public profile.

**Auth**: Supabase login. Role: `kolaborator`. Self-register allowed.

**Pages**:

| Path | Component | Function |
|---|---|---|
| `/` | `Dashboard.jsx` | Stats (karya count, story count, event count); upcoming events; recent stories |
| `/profil` | `Profil.jsx` | Edit profile, upload foto + cover, subsektor |
| `/portofolio` | `Portofolio.jsx` | Karya CRUD |
| `/story` | `Story.jsx` | Story CRUD (kolab posts) |
| `/event` | `Event.jsx` | List events with apply-state badges (Sudah Terdaftar / Menunggu Persetujuan / Daftar Event) |
| `/event/:id` | `EventDetail.jsx` | Single event + apply form (peran preference) |
| `/notifikasi` | `Notifikasi.jsx` | Notification list |
| `/pengaturan` | `Pengaturan.jsx` | Change password |
| `/login` | `auth/Login.jsx` | |
| `/register` | `auth/Register.jsx` | |
| `/lupa-password` | `auth/LupaPass.jsx` | |
| `/reset-password` | `auth/ResetPassword.jsx` | |

**Key business logic**:

- **Event apply 3-state** (v2.4.0): Each event card shows ONE of:
  - "✓ Sudah Terdaftar" (green) if approved (row in `event_kolaborators`)
  - "⏳ Menunggu Persetujuan" (amber) if pending (row in `kolaborator_requests`, status=pending)
  - "Daftar Event" button if neither (rejected requests are hard-deleted so user can re-apply)
- **Approved peran display** (v2.4.0): After admin approves, the event card shows "Diterima sebagai {peran}" (performer / panitia / peserta).
- **Stories soft-delete**: Kolab DELETE → backend sets `status='dihapus'` (audit trail). Admin can also moderate to `status='disembunyikan'`.

---

## 15. Frontend Patterns

### Project layout (per FE app)

```
frontend/
├── src/
│   ├── App.jsx                 # router setup
│   ├── main.jsx                # ReactDOM root
│   ├── pages/                  # routed pages
│   ├── components/             # reusable
│   ├── layouts/                # AdminLayout (Gate), Sidebar (Artisan/Kolab)
│   ├── lib/                    # supabase, uploadImage, unwrap, time, auth
│   ├── services/
│   │   ├── endpoints.js        # re-exports real OR dummy
│   │   ├── realEndpoints.js    # production: hits backend
│   │   └── dummyEndpoints.js   # demo: returns local data
│   ├── constants/              # kategoriUsaha, subsektor (mirror BE)
│   ├── data/                   # demo-mode seed data
│   └── assets/                 # styles, images
├── public/                     # favicon.png, hand-picked
├── .env.example
├── .env.production             # committed (anon key + URLs are public)
├── package.json
└── vite.config.js
```

### VITE_DUMMY_MODE pattern

Every FE has `endpoints.js`:

```js
import * as realApi from './realEndpoints';
import * as dummyApi from './dummyEndpoints';

const useReal = import.meta.env.VITE_DUMMY_MODE !== 'true';
export const authApi = useReal ? realApi.authApi : dummyApi.authApi;
export const eventApi = useReal ? realApi.eventApi : dummyApi.eventApi;
// ... etc
```

Setting `VITE_DUMMY_MODE=true` in build env makes the FE use local seed data (no backend calls). Useful for:
- Demos without internet
- Frontend-only development
- Showcasing UX without staging the backend

Production = `false`. Documented in each `.env.example`.

### Response envelope handling

`lib/unwrap.js`:

```js
export function extractData(response) {
  if (response?.status === 'success') return response.data;
  throw new Error(response?.message || 'Unknown error');
}

export function extractError(err, fallback = 'Terjadi kesalahan') {
  // Pluck human-readable message from various error shapes
  return err?.response?.data?.message
      || err?.message
      || fallback;
}
```

Used everywhere. Backend MUST always wrap.

### `apiFetch` (HTTP wrapper)

`services/realEndpoints.js`:

```js
async function apiFetch(path, opts = {}) {
  const baseUrl = import.meta.env.VITE_API_URL;
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${baseUrl}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return extractData(json);
}
```

Variants per FE — CP doesn't add Authorization (no auth); others do.

### Realtime subscriptions (Gate Dashboard)

```js
const channel = supabase
  .channel('visitors-changes')
  .on('postgres_changes',
      { event: '*', schema: 'public', table: 'visitors',
        filter: `event_id=eq.${activeEventId}` },
      (payload) => { /* live update activity feed */ })
  .subscribe();

// cleanup
return () => supabase.removeChannel(channel);
```

### Form input components (shared patterns)

Each FE has minor variants of:
- `ImageInput` (file picker + drag-drop, runs `uploadImage()`)
- `ImageUpload` (kolaborator/UMKM shared, takes folder prop)
- `Toast` (notification system)
- `PrivateRoute` / `AdminRoute` / `PetugasRoute` (Gate route guards)

### Styling

- Tailwind base (configured per app).
- Lots of inline styles in older components (legacy from initial scaffolding) — fine, no need to refactor wholesale.
- Brand color tokens (sage + cream): `#7a8a52` (sage primary), `#5a6040` (deep sage), `#f2f4e8` (cream bg), `#e4e7d4` (border), `#8a9070` (muted text), `#1e2010` (heading dark).
- Font stack: `'Montserrat', system-ui, sans-serif` (body); `'Clash Display', sans-serif` (display headings) — loaded via CDN.
- All FE favicons: 256×256 square `favicon.png` derived from the brand logo. Same file in each `public/`.

---

## 16. API Reference

Per-app OpenAPI specs (read these for endpoint details):

| App | Spec file | Paths | Lines |
|---|---|---|---|
| CP | `Peken-Banyumasan-Company-Profile/openapi-companyprof.yaml` | 8 | 832 |
| Gate | `Peken-Banyumasan-Gate-Masuk-Keluar/openapi-gate.yaml` | 46 | 3876 |
| Artisan | `peken-banyumas-UMKM-digital/openapi-artisan.yaml` | 22 | 1993 |
| Kolaborator | `Peken-Banyumasan-Kolaborator/openapi-colab.yaml` | 17 | 1355 |

### Key endpoints by domain

#### Public (CP)
- `GET /api/public/stats` → `{edisi_count, kolaborator_aktif, artisan_aktif, pengunjung_total}`
- `GET /api/public/events/upcoming?limit=N`
- `GET /api/public/events?status=published&date_from=...`
- `GET /api/public/karya?artisan_id=...|kolaborator_id=...&limit=N`
- `GET /api/public/profiles/{slug}` → `{role, nama, subsektor|kategori_usaha, foto_url, bio/deskripsi, karya[], story[], events[]}`
- `GET /api/public/profile-sections?section=home,about,tim,programs,works,gallery`

#### Auth (Artisan + Kolaborator)
- `POST /api/auth/register` → BE-intermediary: creates Supabase user atomically with profile row
- `PUT /api/auth/profile` → updates non-Supabase fields (nama_usaha, kota, subsektor, etc.)
- (login/logout/me/changePassword: Supabase-direct via FE SDK)

#### Gate
- `GET /api/dashboard/summary` → live event stats
- `POST /api/dashboard/manual-entry` → insert visitor row (admin or petugas)
- `GET /api/events` (admin sees all incl. draft)
- `POST /api/events` (create draft)
- `PATCH /api/events/{id}` (edit; FE strips `status_efektif`/`created_at`/`updated_at` to avoid `extra=forbid` rejection)
- `GET /api/events/{id}/artisan` → event-side participant list
- `POST /api/events/{id}/artisan` (assign) → 422 if `posisi_event` missing or non-string
- `GET /api/artisan` → list
- `GET /api/artisan/{id}/events` → returns `ArtisanEventEntry[]` (v2.4.0 NEW)
- `GET /api/kolaborator/{id}/events` → returns `KolaboratorEventEntry[]` (v2.4.0 NEW)
- `GET /api/reports` → `{rows: VisitorReportRow[], ringkasan: {total_kunjungan, total_nfc, total_manual}}`
- `GET /api/zones` (global layout)
- `GET /api/events/{id}/zones` (occupancy)
- `GET/POST/PATCH/DELETE /api/petugas` (petugas account mgmt)
- `PATCH /api/petugas/{id}/status` (disable via Supabase `banned_until`)
- `POST /api/petugas/{id}/reset-password` (admin-mediated)
- `PUT /api/company-profile` → accepts `oneOf: [object, array]` content (programs/works are arrays)

#### Artisan portal
- `GET /api/kas` (list with filters)
- `POST /api/kas` (re-computes saldo + totals atomically)
- `PATCH /api/kas/{id}` (re-computes)
- `DELETE /api/kas/{id}` (re-computes)
- `GET /api/stok`, `POST`, `PATCH`, `DELETE`
- `GET /api/promo`, `POST`, etc.
- `GET /api/karya`, `POST`, etc.
- `GET /api/event` (Artisan sees published+ only; status_efektif included)
- `POST /api/event/{id}/apply` (writes to `artisan_requests`)
- `POST /api/qris` (uploads to peken-uploads/qris/)

#### Kolaborator portal
- `GET /api/karya`, `POST`, etc.
- `GET /api/story`, `POST`, etc. (DELETE = soft-delete)
- `GET /api/event` → returns `Event[]` with `terdaftar` (boolean) + `request_status` (`pending`/`approved`/null) + `peran` (when approved) (v2.4.0)
- `POST /api/event/{id}/apply` (writes to `kolaborator_requests`)

---

## 17. Deployment Pipeline

**Status**: deployment platform choices are open. The dev environment used HuggingFace Spaces (backend) + Cloudflare Workers (frontend) — those are ONE valid combination, but the client team may pick differently. Pick platforms first, then implement the deployment per this section.

### Backend platform options

The 4 backends are Python FastAPI in Docker. They need:
- Python 3.11 Docker base
- Outbound HTTPS to Supabase
- Inbound HTTPS for `/health` + API endpoints
- Long-lived process (NOT request-scoped FaaS — the app uses SQLAlchemy async connection pool, Supabase Realtime, Storage SDK)
- ~200 MB RAM idle, peaks during request bursts

**Compatibility matrix** (TBD by client team):

| Platform | Compatible? | Free tier? | Cold start | Notes |
|---|---|---|---|---|
| **HuggingFace Spaces** (current dev) | ✅ Yes (Docker SDK) | ✅ Yes (CPU Basic) | ~30–60s after 48h idle | Free forever; slow wake-up; community-friendly. Requires `Dockerfile.hf` (already present in each backend) + `scripts/sync_common_for_hf.sh` + `scripts/deploy_hf_spaces.sh`. Keep-warm cron mitigates idle. |
| **Render** | ✅ Yes (native Docker support) | ✅ Yes (free web service, sleeps after 15 min idle on free tier) | ~30s wake-up | Easier UI; free tier sleeps faster than HF. |
| **Railway** | ✅ Yes (native Docker) | ⚠️ ~$5 free credit then paid | None (always on) | Best UX of the bunch; small recurring cost. |
| **Koyeb** | ✅ Yes (native Docker) | ✅ Yes (Free Starter tier: 1 service, 512MB) | None | EU/US regions; modern UX; free tier has 1 service limit (would need 4 services = paid). |
| **Fly.io** | ✅ Yes (native Docker via `fly.toml`) | ✅ Yes (hobby; auto-suspend after idle) | ~5s | Per-region deployment; mature platform. |
| **Cloudflare Workers** | ❌ NO (V8 isolates, no Python FastAPI) | n/a | n/a | Would require rewriting entire backend stack to Workers Python beta (limited stdlib, no asyncpg) — DO NOT pick this. |
| **AWS Lambda / GCP Cloud Run / Azure Functions** | ✅ Yes (Docker support) | ⚠️ Free tier limited | Varies | More setup; useful if team has existing cloud account. |
| **Self-hosted VPS** (Hetzner, DigitalOcean, etc.) | ✅ Yes | ❌ Paid (~$5/mo) | None | More control; team manages updates, certs, monitoring. |

**Recommendation order for the team** (best fit for this project's scale and complexity):
1. **Render** — easiest to migrate from HF; free tier works; reasonable cold-start.
2. **Fly.io** — best free-tier perf; per-region for Indonesia.
3. **Railway** — best UX; small recurring cost acceptable for production.
4. Stay on HF — only if budget = 0 and slow cold-start is acceptable (current dev choice).

### Frontend platform options

The 4 frontends are Vite + React SPAs that produce a `dist/` directory. Any static-site host works.

| Platform | Compatible? | Free tier? | Notes |
|---|---|---|---|
| **Cloudflare Workers/Pages** (current dev) | ✅ Yes | ✅ Yes (unlimited bandwidth) | Git auto-deploy on push; fast CDN; team UX matures. |
| **Vercel** | ✅ Yes (Vite preset) | ✅ Yes (hobby tier 100GB bandwidth) | Best DX for Vite/React; can deploy preview branches; simple custom domains. |
| **Netlify** | ✅ Yes | ✅ Yes | Similar to Vercel; mature CDN. |
| **Render Static Sites** | ✅ Yes | ✅ Yes | Pairs well if BE is also on Render. |
| **GitHub Pages** | ⚠️ Yes but limited (no SPA routing without `_redirects` hack) | ✅ Yes | NOT recommended for this app's BrowserRouter setup. |

**Recommendation** for this project: **Vercel** is the easiest pick for `Vite + React` (one-click import, auto-detected). Cloudflare also fine.

### Database/Auth/Storage (FIXED — Supabase)

Already covered in §5–§7. Team creates own Supabase project; everything in `db/schema.sql` + the `peken-uploads` bucket + Auth users.

### CI / GitHub Actions structure (depends on chosen platforms)

The current `.github/workflows/deploy-hf.yml` is **HF-specific** and uses `scripts/sync_common_for_hf.sh` + `scripts/deploy_hf_spaces.sh`. If the team picks a different backend platform:

- **Render**: Render has GitHub integration native — no GitHub Actions needed for backend deploy. Set up via Dashboard. Delete `deploy-hf.yml`.
- **Railway**: Same — git auto-deploy via Railway GitHub app. Delete `deploy-hf.yml`.
- **Koyeb / Fly**: Either platform-native git deploy OR provide custom workflow. Could adapt `deploy-hf.yml` template.
- **Vercel/CF Pages** (frontends): git auto-deploy is built-in. No workflow needed for FE.

**Keep-warm cron** (`.github/workflows/keep-warm.yml`):
- Only needed if backend platform has **cold-sleep** (HF free tier, Render free tier).
- For always-on platforms (Railway, Koyeb paid, Fly) — DELETE this workflow.
- For chosen cold-sleep platform — update the URLs in `keep-warm.yml` to match the team's backend hostnames.

### Build settings (per FE, applies to most platforms)

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm install && npm run build` |
| Build output | `dist` |
| Root directory | `<App-folder>/frontend` (per the 4 apps) |
| Production branch | `main` |
| Env vars | per §6 |

### Per-backend Dockerfile

Each `backend/Dockerfile.hf` (or rename to `Dockerfile` for non-HF platforms) is a standard Python 3.11-slim multi-stage build. Should work on any Docker-capable platform.

If switching from HF to another platform:
- Rename `Dockerfile.hf` → `Dockerfile` in each backend (or keep as-is and reference explicitly in platform's build config).
- Remove `scripts/sync_common_for_hf.sh` step from CI — instead, use:
  ```dockerfile
  COPY peken_common /app/peken_common
  RUN pip install -e /app/peken_common
  ```
  to include `peken_common` directly in the Docker build context.
- This requires the build context to include the `peken_common/` folder. Most platforms (Render, Railway, Fly, Koyeb) let you set the root directory of the build at the repo level instead of `<app>/backend/` — point it at the repo root and use `<app>/backend/Dockerfile` as the Dockerfile path.

### Deploying a hot-fix (platform-agnostic)

#### Backend
1. Edit code locally.
2. Commit + push to `main`.
3. CI/git auto-deploy triggers (platform-specific — Render auto-rebuilds, GitHub Actions runs deploy-hf for HF, etc.).
4. Wait for platform's deploy time (typically 2–5 min).
5. Verify: `curl https://<be-url>/health` → expect HTTP 200, `version: 2.4.0`.

#### Frontend
Even simpler: commit + push → host platform auto-builds. Watch via the platform dashboard.

### Manual deploy (when CI breaks)

Platform-specific. Examples:

- **HF (dev reference)**:
  ```bash
  export HF_USERNAME=<your-hf-username>
  export HF_TOKEN=hf_xxxxxxxxxxxxxxxxxx
  bash scripts/sync_common_for_hf.sh gate
  bash scripts/deploy_hf_spaces.sh gate
  # or for all 4:
  bash scripts/deploy_hf_spaces.sh
  ```
- **Render**: Dashboard → Service → "Manual Deploy".
- **Railway**: `railway up` from local with Railway CLI.
- **Vercel**: `vercel --prod` from local with Vercel CLI.

### Rollback (platform-agnostic)

#### Backend
- Most platforms keep deploy history: dashboard → previous deploy → "Restore" / "Rollback".
- Fallback: `git revert <bad-commit> && git push` → auto-redeploys previous code.

#### Frontend
- Same — platform dashboard → previous deploy → "Restore".

---

## 18. Local Development Setup

### Prereqs

- Python 3.11 (NOT 3.12+ — some deps like starlette may have issues; .venv is recommended)
- Node 18+ (LTS) + npm 9+
- Docker Desktop (optional, for `docker compose up`)
- Git
- A Supabase project (or use shared dev project with shared credentials)

### Clone

```bash
git clone <your-team-repo-url> "Peken Banyumasan"
cd "Peken Banyumasan"
```

### Backend (per app — repeat for each of the 4)

```bash
cd Peken-Banyumasan-Company-Profile/backend
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# OR
.venv\Scripts\activate      # Windows

pip install -e ../../peken_common
pip install -r requirements.txt

# Set env
cp ../../.env.example ./.env
# Edit .env with shared dev Supabase creds

# Run
uvicorn app.main:app --reload --port 8001
```

Same procedure for gate (port 8002), umkm (port 8003), kolaborator (port 8004). Or use Docker:

```bash
docker compose up -d
```

(See `docker-compose.yml` for service definitions.)

### Frontend (per app)

```bash
cd Peken-Banyumasan-Company-Profile/frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_URL=http://localhost:8001 (matching the backend port)

npm run dev
# Vite serves on http://localhost:5173 (or next available)
```

### Test seed users

Run `db/seed_demo.sql` in Supabase SQL Editor (or local Postgres) after applying `schema.sql`. This creates:

- `admin@peken.test` / `Admin123!` (role: admin)
- `petugas1@peken.test` / `Petugas123!` (role: petugas)
- `artisan@peken.test` / `Artisan123!` (role: artisan)
- `kolaborator@peken.test` / `Kolaborator123!` (role: kolaborator)

(See Appendix A for full list.)

**⚠️ Change all test passwords before client takeover.**

### Common errors

| Error | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: peken_common` | venv doesn't have peken_common installed | `pip install -e ../../peken_common` inside backend venv |
| `starlette.status has no attribute ...` | starlette version mismatch with Python 3.12+ | Use Python 3.11; or upgrade starlette via requirements.txt |
| `Tenant or user not found` (DB connect) | Wrong pooler hostname or db user | Use `aws-1-ap-southeast-1.pooler.supabase.com:6543` and `postgres.<ref>` username |
| FE 401 from backend | Token missing / wrong CORS | Check `Authorization: Bearer` header sent; check CORS_ORIGINS on BE |
| FE "Supabase belum dikonfigurasi" | `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` missing | Set in `.env` |
| HF Space stuck "Building" | OOM during build | Check Space Logs; consider multi-stage Docker; or open issue |
| `image_email_invalid` from Supabase Auth | sending email to `.test` domain | Supabase doesn't deliver to `.test`; use a real address for actual delivery |

---

## 19. Operations Runbook

### Add an admin user

1. Supabase Dashboard → Authentication → Users → Add User.
2. Enter email + temp password.
3. After created, click user → User Metadata → set `app_metadata` JSON:
   ```json
   { "role": "admin" }
   ```
4. SQL Editor:
   ```sql
   INSERT INTO public.users_profile (id, nama, role, jabatan)
   VALUES ('<auth_user_uuid>', 'Admin Name', 'admin', 'Superadmin')
   ON CONFLICT (id) DO UPDATE SET role='admin', jabatan='Superadmin';
   ```
5. Tell user to login + change password.

### Add a petugas via Gate UI

1. Login Gate as admin.
2. `/petugas` page → "Tambah Petugas".
3. Fill form (email, nama, jabatan, password).
4. Submit. Backend uses Supabase Admin SDK to create user atomically.

### Disable a petugas

1. `/petugas` → toggle "Aktif" → off.
2. Backend sets `auth.users.banned_until` to far future.
3. User can no longer login.

### Reset password (admin-mediated)

1. `/petugas` → click user → "Reset Password".
2. Choose mode:
   - `email_link`: Supabase sends email to user.
   - `temp_password`: admin gets a one-time password to relay to user.

### Activate a pending artisan

1. Gate → `/artisan` → click artisan card → edit drawer.
2. Status: `pending` → `aktif`. Save.
3. User can now login + access portal.

### Approve artisan event request

1. Gate → `/artisan/{id}` → "Event" tab → see `artisan_requests` with status=pending.
2. Choose stand (optional) → "Approve". Backend deletes request, creates `event_artisans` row.
3. Or "Reject" → backend deletes request (allows re-apply).

### Approve kolaborator event request

1. Gate → `/kolaborator/{id}` → "Event" tab → see `kolaborator_requests` with status=pending.
2. Choose peran (performer/panitia/peserta) → "Approve". Backend updates request status=approved + creates `event_kolaborators`.
3. Or "Reject" → backend deletes (re-apply allowed).

### Trash event participation

In Gate detail-event tab, the "trash" action is a HARD remove of the `event_artisans` or `event_kolaborators` row.

### Open Monitor (display mode)

1. Gate → sidebar → "Open Monitor" link → opens `/monitor` in new tab.
2. Project the tab on a TV/projector for public-facing visitor counter.

### Upload CP marketing content

1. Gate → `/company-profile` → choose tab (Beranda / Tentang / Tim / Program / Karya / Galeri).
2. Edit sections (text, images uploaded via ImageInput → Supabase Storage).
3. "Simpan" per section.
4. Backend writes to `company_profile_sections`. CP public site auto-shows updated content.

### View reports

1. Gate → `/reports`.
2. Tabs: "Pengunjung", "Artisan", "Akumulasi".
3. Filter by event / date range.

### Clean junk seed data (rare but useful pre-handoff)

```sql
-- Cleanup helper — DRY RUN first by changing DELETE → SELECT
DELETE FROM artisans WHERE nama_usaha IN ('efg', 'ghj');
DELETE FROM kolaborators WHERE nama IN ('abc', 'bcd', 'cde', 'tes', 'ww');
DELETE FROM karya WHERE judul = 'a';
-- (CASCADE will pull related rows)
```

### Diagnose visitor input rejected (no live event)

If admin types manual entry → 403 "Tidak ada event yang sedang berlangsung":

1. Gate → `/events` → verify there's an event with status `published` whose `tanggal` matches today AND `jam_mulai <= now <= jam_selesai`.
2. If no event live → that's expected; create one or wait for the next event window.
3. To create a quick test event: `/events` → new event → date today, time spanning now → publish.

---

## 20. Email & Auth Notifications

### Current state (2026-05-29)

**Sender**: Supabase default SMTP (`noreply@mail.app.supabase.io`).

**Used for**:
- Forgot-password recovery link
- Email confirmation on registration (currently `mailer_autoconfirm = false`)
- Email change confirmation
- (Optional) Magic link / OTP login — currently unused

**Limits (Supabase free tier)**:
- 2 emails per HOUR per project (HARD limit).
- After 2 in any rolling hour window, additional emails silently fail.

**Gmail spam risk**: Generic `noreply@mail.app.supabase.io` sender + "reset password" subject combo is heuristically flagged by Gmail anti-phishing → email lands in spam.

### Why this default

1. Zero config — works out of the box on Supabase.
2. Zero cost.
3. Sufficient for low-traffic usage (<2 forgot-password/hour in normal ops).

### When this is NOT enough

- Bulk onboarding sessions: admin adds 10 kolaborator users in one hour → only the first 2 confirmation emails arrive.
- Event-day spike: multiple users forgot-password near event time.
- Client wants professional sender identity (`noreply@<domain>`) for trust.

### Upgrade Path A — Custom SMTP via Resend + verified domain

**Cost**: domain ~Rp 50K–150K/year (for `.my.id`, `.xyz`, or `.com`); Resend free tier 100 emails/day.

**Effort**: ~1 hour after domain DNS available.

**Steps**:

1. **Buy a domain** (must be one client controls DNS for):
   - `.my.id` ~Rp 50K/year (Indonesia, lighter docs)
   - `.xyz` ~Rp 15K first year (international, no docs)
   - `.com` ~Rp 150K/year (international)
2. **Resend setup**:
   - Sign up at https://resend.com.
   - Domains → Add Domain → enter your domain.
   - Resend gives 4 DNS records (DKIM TXT at `resend._domainkey`, SPF TXT at `send`, MX at `send` for feedback, optional DMARC TXT at `_dmarc`).
3. **Add records to DNS** (Cloudflare / Niagahoster / etc.).
4. **Wait 5–60 min**, Resend Dashboard → Verify.
5. **Generate Resend API key**:
   - Resend Dashboard → API Keys → Create → "Sending access" only (NOT full access — leak protection).
   - Copy the key (starts `re_`).
6. **Configure Supabase Auth SMTP** via Management API:
   ```bash
   curl -X PATCH "https://api.supabase.com/v1/projects/<your-project-ref>/config/auth" \
     -H "Authorization: Bearer <management_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "smtp_admin_email": "noreply@<your-domain>",
       "smtp_host":        "smtp.resend.com",
       "smtp_port":        "465",
       "smtp_user":        "resend",
       "smtp_pass":        "<resend_api_key>",
       "smtp_sender_name": "Peken Banyumasan",
       "smtp_max_frequency": 60
     }'
   ```
   - Or via Dashboard (easier): Project → Authentication → SMTP Settings → fill in form.
7. **Test**: trigger forgot-password from a real Gmail → verify delivery.

**Result**:
- Sender: `Peken Banyumasan <noreply@<your-domain>>`
- Resend logs: track every email; can investigate bounces.
- No more 2/hour limit; subject to Resend's 100/day free tier.

### Upgrade Path B — WhatsApp via Meta Business Cloud API

**Cost**: free for ≤1,000 service conversations/month (Meta's official limit). Beyond that ~$0.005/conv.

**Effort**: 1 day (Meta Business verification + DNS).

**Why WhatsApp instead of email**:
- Indonesian audience reads WhatsApp more than email.
- Notifications arrive instantly.
- Higher trust than `noreply@*` email.

**Steps**:

1. Create Meta Business Account: https://business.facebook.com (need company info).
2. Add a WhatsApp number to the Business Account (can be a new number; must be a real mobile that can receive an SMS for verification).
3. Verify the business profile (uploads of company docs; can take 1–3 days for Meta to approve).
4. Set up a WhatsApp Business App in Meta for Developers (https://developers.facebook.com → My Apps → Create App).
5. Get the API access token + phone number ID.
6. Configure Supabase Auth **"Send Email Hook"** (NOT SMTP — replaces email entirely with WA):
   - In Supabase Dashboard → Authentication → Hooks → enable `hook_send_email_enabled`.
   - URI: a new FastAPI webhook endpoint on Gate backend (e.g. `https://<your-gate-api-host>/api/auth/hooks/send-email`).
   - Implement the webhook:
     ```python
     @router.post("/api/auth/hooks/send-email")
     async def send_email_hook(payload: dict):
         user_email = payload["user"]["email"]
         email_data = payload["email_data"]
         token_hash = email_data["token_hash"]
         reset_url = f"{settings.SITE_URL}/reset-password#token={token_hash}"
         # Look up phone from DB by email
         phone = await get_phone_by_email(user_email)
         msg = f"Reset password Peken Banyumasan: {reset_url}\nLink berlaku 1 jam."
         await send_whatsapp(phone, msg)  # Meta Cloud API call
         return {"ok": True}
     ```

7. The Meta Cloud API call (POST to `https://graph.facebook.com/v17.0/<phone_number_id>/messages`):
   ```python
   async def send_whatsapp(to_phone: str, body: str):
       async with httpx.AsyncClient() as client:
           res = await client.post(
               f"https://graph.facebook.com/v17.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages",
               headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
               json={
                   "messaging_product": "whatsapp",
                   "to": to_phone,
                   "type": "text",
                   "text": {"body": body},
               },
           )
           res.raise_for_status()
   ```

**Pre-conditions** (data model):
- All users must have `no_hp` set in E.164 format (e.g. `628123456789`).
- Backend must lookup phone from `auth.users.email` → `users_profile.id` → `artisans`/`kolaborators`/`users_profile`.
- Validation at register-time: collect + normalize phone.

**Limitations**:
- Phone change → user must update profile, OR be locked out of recovery.
- Service conversations have a 24-hour window (Meta restriction). For auth flows (one-shot reset link), this is fine.
- For sensitive actions, Meta recommends **Authentication template messages** (pre-approved, no 24h limit). Requires template approval (1–3 days).

### Upgrade Path C — Multi-channel (email + WhatsApp + SMS, user-pickable)

See Section 21.

### Decision matrix

| Goal | Recommended path |
|---|---|
| Hand off as-is, minimal client effort | Current (Supabase default). Document the limit. |
| Production scale + professional sender | Path A (Resend + custom domain) |
| Indonesian audience reach + WhatsApp-first | Path B (Meta WhatsApp Business Cloud API) |
| Maximum redundancy / user choice | Path C — see Section 21 |
| Want WA without domain owning | Twilio Verify (paid, ~$0.05/msg) or single-sender providers (SendGrid free Tier with Gmail sender) |

---

## 21. Multi-Channel Recovery (Design for Future Work)

This section is a forward-looking design — NOT implemented as of 2026-05-29. Client may request this feature later.

### Vision

User can RECOVER their account via any channel they previously linked:
- Email (always required at register)
- WhatsApp number (optional, opted in)
- SMS (optional, for users without WhatsApp)
- Alternative email (optional secondary)

On password-reset request, user **chooses the channel** they want to receive the link via:

```
Forgot password?

Enter your email or phone:  [_______________]

Send recovery link via:
  ( ) Email to a***@gmail.com
  ( ) WhatsApp to +62 81***5678
  ( ) SMS to +62 81***5678
  (•) Alternative email a***@yahoo.com

[Send link]
```

If WhatsApp is selected but the user lost their phone, they can switch to email; if email is forgotten, they can recover via WhatsApp / SMS.

### Required data model changes

```sql
ALTER TABLE public.users_profile
  ADD COLUMN no_hp           TEXT,
  ADD COLUMN no_hp_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN email_alt       TEXT,
  ADD COLUMN email_alt_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN wa_opt_in       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN sms_opt_in      BOOLEAN NOT NULL DEFAULT FALSE;

-- Recovery contact channels view (de-normalized for the forgot-password UI)
CREATE OR REPLACE VIEW public.recovery_channels AS
SELECT
  u.id AS user_id,
  u.email AS email_primary,
  up.email_alt,
  up.no_hp,
  up.wa_opt_in,
  up.sms_opt_in
FROM auth.users u
JOIN public.users_profile up ON up.id = u.id;
```

### Required Supabase Auth Hooks

Use `hook_send_email_enabled` (already available in Supabase). Implement a single webhook that dispatches to the right channel based on a query param in the recovery link request:

```python
@router.post("/api/auth/hooks/send-email")
async def send_email_hook(payload: dict):
    user_email = payload["user"]["email"]
    email_data = payload["email_data"]
    channel = email_data.get("metadata", {}).get("channel", "email")  # FE passes via options
    token = email_data["token_hash"]
    reset_url = f"{settings.SITE_URL}/reset-password#token={token}"

    contacts = await get_recovery_contacts(user_email)
    if channel == "email":
        await send_email(contacts.email_primary, "Reset password", reset_url)
    elif channel == "email_alt" and contacts.email_alt_verified:
        await send_email(contacts.email_alt, "Reset password", reset_url)
    elif channel == "wa" and contacts.no_hp_verified and contacts.wa_opt_in:
        await send_whatsapp(contacts.no_hp, f"Reset link: {reset_url}")
    elif channel == "sms" and contacts.no_hp_verified:
        await send_sms(contacts.no_hp, f"Reset: {reset_url}")
    else:
        # No channel found; silently no-op (anti-enumeration)
        pass

    return {"ok": True}
```

### Frontend UX flow

```
1. User on /lupa-password types email_primary OR no_hp.
2. FE POSTs to a new backend endpoint /api/auth/recovery/channels with the identifier.
3. Backend looks up the user; returns masked channel list:
   { channels: [
       { type: "email", masked: "a***@gmail.com", available: true },
       { type: "email_alt", masked: "a***@yahoo.com", available: true },
       { type: "wa", masked: "+62 81***5678", available: true },
       { type: "sms", masked: "+62 81***5678", available: true }
     ]
   }
4. User picks one → FE calls supabase.auth.resetPasswordForEmail(email, {
     options: { metadata: { channel: "wa" } }
   });
5. Supabase fires hook with that metadata; backend dispatches.
6. UI shows "Link sudah dikirim ke {masked channel}. Cek inbox/WA."
```

### Verification flow (channel opt-in)

To verify a new no_hp, send an OTP to that number. Track verification in `users_profile.no_hp_verified`. Same for `email_alt`.

```
POST /api/profile/no-hp/start { no_hp }   → backend sends OTP via WA/SMS
POST /api/profile/no-hp/verify { otp }    → backend marks verified
```

### Effort estimate

| Phase | Estimate |
|---|---|
| Data model migration | 1 hour |
| Backend hook + dispatcher | 4 hours |
| WhatsApp Meta integration | 4 hours (after Meta verification done) |
| SMS provider integration (Twilio) | 2 hours |
| FE forgot-password 3-step UI | 4 hours |
| Profile screen channel opt-in | 3 hours |
| OTP verification flow | 4 hours |
| Tests + docs | 4 hours |
| **TOTAL** | **~3 days of focused dev** |

### Decision recommendation

**Implement Path A (custom domain email) first**, then this multi-channel **only if the client requests it**. Multi-channel is complex; not every team wants the maintenance.

---

## 22. Testing & Verification

### Cross-consistency verifier

```bash
bash db/verify_cross_consistency.sh
# Expected: 16/16 PASS
```

**MUST PASS before any deploy**. If a check fails, the cross-layer contract is broken — fix before pushing.

### Admin-only leak audit

```bash
bash db/audit_admin_only_leaks.sh
# Expected: NO LEAKS
```

Verifies admin-only fields (`internal_notes`, kolab `no_hp`, sensitive financials) are absent from public/portal-facing OA schemas.

### Backend tests (per backend)

```bash
cd Peken-Banyumasan-Company-Profile/backend
python -m venv .venv  # if not done
source .venv/bin/activate
pip install -e ../../peken_common
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-mock
python -m pytest -q

# Expected: all green
# CP: ~63 tests
# Gate: ~608 tests
# UMKM: ~254 tests
# Kolaborator: ~178 tests
# peken_common: ~117 tests (run from peken_common/)
```

### Frontend builds

```bash
cd Peken-Banyumasan-Company-Profile/frontend
npm install
npm run build
# Expected: ✓ built successfully (warnings about chunk size OK)
```

Repeat for Gate, UMKM, Kolaborator. All 4 must build.

### Smoke tests (production)

Set BE_URLS and FE_URLS to your 4 deployment hosts, then:

```bash
# Backends — replace URLs with your team's production backend hostnames
BE_URLS=(
  https://<your-cp-api-host>
  https://<your-gate-api-host>
  https://<your-umkm-api-host>
  https://<your-kolaborator-api-host>
)
for u in "${BE_URLS[@]}"; do
  printf "%-50s " "$u"
  curl -s -o /dev/null -w "HTTP %{http_code} · %{time_total}s\n" --max-time 30 "$u/health"
done

# Frontends — replace URLs with your team's production frontend hostnames
FE_URLS=(
  https://<your-cp-fe-host>
  https://<your-gate-fe-host>
  https://<your-umkm-fe-host>
  https://<your-kolaborator-fe-host>
)
for u in "${FE_URLS[@]}"; do
  printf "%-50s " "$u"
  curl -s -o /dev/null -w "HTTP %{http_code} · %{time_total}s\n" --max-time 30 "$u/"
done
```

All should be HTTP 200. Backend response time first call may be 3–7s if platform has cold-start (HF, Render free); subsequent <1s.

### E2E (manual)

After any non-trivial deploy:

1. CP homepage loads, shows live stats.
2. CP upcoming event card shows correct event with derived "Akan Datang" badge.
3. CP `/profile/<known-slug>` shows real karya count, story, events.
4. Gate login → dashboard loads.
5. Gate `/artisan` → click → drawer opens → all fields visible.
6. Gate `/kolaborator` → event tab → shows event names + dates (not entity name).
7. Gate manual entry → succeeds if event live, rejected with 403 otherwise.
8. Gate `/reports` → all 3 tabs show data.
9. Gate `/company-profile` → save a hero slide → CP picks it up.
10. Artisan login → dashboard.
11. Artisan `/buku-kas` → add kas masuk → `total_penjualan` and `komisi_terkumpul` update.
12. Artisan `/event` → "Daftar Event" popup → submit → request shows in Gate.
13. Kolaborator login → `/event` → see 3-state badges; apply; admin approves → see "Diterima sebagai {peran}".
14. Forgot-password from Artisan or Kolaborator → email arrives (or check Resend / WA log) → click link → reset → login with new password.

---

## 23. Known Limitations & Gotchas

### Operational

- **HF Spaces sleep**: free tier sleeps after 48h idle. Keep-warm cron mitigates but doesn't guarantee. Cold-start adds 30–60s on first request after sleep.
- **Supabase free tier 500 MB DB**: monitor; consider Pro plan when approaching.
- **Supabase free tier 1 GB storage**: peken-uploads will grow. Periodic cleanup script needed.
- **Supabase project pause**: after 1 week of NO activity, project pauses (auto-resumes on first request). Keep-warm + low traffic should prevent.
- **Email rate limit**: 2/hour Supabase default. See Section 20.
- **CF Workers 100 deploys/month per project**: 4 projects × 100 = 400 total. Not a practical constraint at this scale.

### Schema / data

- **Legacy tables**: `otp_codes`, `password_reset_tokens` are dead (Supabase Auth used now). Safe to DROP after 2026-08-28.
- **Polymorphic FK fragility**: `karya.owner_id` and `stories.author_id` have NO actual FK. If you delete an artisan without first deleting their karya, you'll have orphan karya rows referencing non-existent owner. Backend SHOULD cascade.
- **Stand FK fragility**: `event_artisans.stand_id` references `zones.stands[].id` in JSONB, no FK. Backend validates.

### Code

- **VITE_DUMMY_MODE bypasses backend entirely**. Useful for demo, but make sure to set `false` in production env.
- **Per-app FE has its own `Sidebar` / `AdminLayout` / `ImageInput`** — duplicated patterns. NOT factored into a shared FE lib (no monorepo tooling). Edits to one don't propagate.
- **CP "KARYA → PUBLICATION"** is UI label only. Backend table and endpoint are still `karya`. Don't rename DB.

### Security

- **Anon key embedded in `.env.production`**: this is correct — anon is public-by-design (subject to RLS). Don't add service_role to FE.
- **service_role on HF Spaces**: stored as secret env var. NEVER log it. NEVER add it to FE.
- **JWT signing**: ES256 (asymmetric). FE verifies via JWK from Supabase. BE verifies via shared `SUPABASE_JWT_SECRET`.

### Testing

- **Local pytest needs proper venv setup** (peken_common installed). System Python 3.14 will fail with ModuleNotFoundError.
- **Cross-consistency check 15** requires the legacy OTP/reset endpoints to be in OA. Removing those without updating check 15 will fail verification.

### UI

- **CP profile screen `toSlug()`**: uses simple `lowercase().replace(/[^a-z0-9-]/g, '')`. If a kolaborator's nama has special characters, the slug computation may differ from the DB-stored slug. Use `owner_slug` from API response, NOT FE-computed.
- **Gate `/assets/*` previews** (legacy seed images): resolved via `VITE_COMPANY_URL` at render time (PR #51). If the env var is missing, previews break. Set it in CF env vars.

---

## 24. AI Prompting Guide (for the team)

This section is meta — guidance for the client's team who'll use AI assistants to maintain this codebase.

### When opening a new AI chat

**Always attach this file (`HANDOFF.md`) first.** It gives the AI the architectural context needed to give sensible answers.

For domain-specific work, additionally attach:

| Task | Additional attach |
|---|---|
| DB schema changes | `db/schema.sql`, `db/SCHEMA_MAP.md` |
| OpenAPI / endpoint changes | the relevant `openapi-*.yaml` |
| Specific frontend page | that page's `.jsx` file |
| Backend service | that service's `.py` file + the relevant repo `.py` |
| Deployment / CI | `.github/workflows/deploy-hf.yml` |
| Recovery / auth flow | Section 10 + Section 20 of this doc |

### Pasting commands the AI suggests

If an AI suggests running a command, sanity-check against:
- "Does this match a runbook in Section 19?"
- "Does this touch DB schema? If so, did the AI also say to re-run `db/verify_cross_consistency.sh`?"
- "Does this touch credentials? Don't paste credentials in the chat — refer to them by env var name."

### Common pitfalls AI assistants fall into

1. **Suggesting to rename canonical naming.** Reject. See Section 9.
2. **Suggesting `kategori_usaha` for kolaborator or `subsektor` for artisan.** Always wrong.
3. **Suggesting to remove RLS or "just use service_role".** Service role is for BE only; FE must respect RLS.
4. **Suggesting to add columns to `artisans`/`kolaborators` for things that should go in `users_profile.extra` JSONB.**
5. **Suggesting to use Supabase Edge Functions** — this project chose FastAPI on HF for portability; don't add a second backend platform.
6. **Suggesting to push to a different branch** — `main` is the production branch with auto-deploy. Use `main` directly for low-risk fixes, OR open a PR.
7. **Suggesting to commit `.env` files** — only `.env.example` and `.env.production` are committed; `.env` is gitignored.

### A good prompt template

```
[Attach: HANDOFF.md, db/SCHEMA_MAP.md, the relevant pages/services]

Context: I'm working on the Peken Banyumasan project. The HANDOFF.md attached
above is the canonical context. I'm now working on <task description>.

Task: <specific ask>

Constraints I need you to respect:
- Canonical naming (Section 9 of HANDOFF) — never rename kategori_usaha or subsektor.
- Response envelope: { status, message, data } — always wrap on backend.
- All 4 OpenAPI specs must stay in sync at the same version.
- If you change DB schema, also update SCHEMA_MAP.md and tell me to re-run
  `bash db/verify_cross_consistency.sh`.

What I've already tried: <if anything>

Please show me the exact file diff (don't just describe).
```

### A bad prompt to avoid

```
"Fix the artisan portal." → too vague; AI will hallucinate.
```

```
"Add OAuth login." → unscoped + likely breaks existing auth model.
```

### When asking AI to add a feature

Prefer **incremental** asks:

1. "Read Section X of HANDOFF; describe how the current implementation works."
2. "What would change if I added <feature>? List file paths."
3. "Write the DB migration."
4. "Now write the backend endpoint."
5. "Now write the FE component."

Each step you can review + commit.

---

## 25. Future Work / Open Items

### Recommended (when client is ready)

1. **Buy a domain** (`.my.id` ~Rp 50K/yr or `.xyz` ~Rp 15K first year). Switch from `*.banyumasan.workers.dev` to `*.banyumasan.id` (or whatever domain) via CF custom domain.
2. **Custom SMTP via Resend** (Section 20 Path A) — for >2/hour email throughput and professional sender.
3. **Drop legacy tables** `otp_codes` + `password_reset_tokens` after 2026-08-28 retention.
4. **Drop legacy stub endpoints** `/api/auth/otp/*` + `/api/auth/password/reset` — coordinate with check 15 in `verify_cross_consistency.sh`.

### Optional (nice-to-have)

5. **WhatsApp via Meta Cloud API** (Section 20 Path B) — significant UX win for Indonesian audience.
6. **Multi-channel recovery** (Section 21) — full design provided; estimate 3 days dev.
7. **Daily backup of Supabase DB** to a separate location (Supabase Pro auto-backups; or run `pg_dump` to S3 on cron).
8. **Monitor uptime** with UptimeRobot / Pingdom on the 4 backend `/health` + 4 frontend roots.
9. **Add Sentry / error tracking** to backends. Currently logs only.
10. **Internationalization** if you want to add English (currently Indonesian-only UI).
11. **PWA install prompts** for Artisan + Kolaborator mobile-first portals.
12. **OFFLINE-first PWA** for Gate visitor scan during weak-signal events.
13. **Component shared library** — extract Sidebar, ImageInput, Toast into `frontend-common/` to reduce duplication.
14. **Tests for frontends** — currently only `npm run build` smoke test. Add vitest or playwright.

### Low-priority cleanups

15. **Delete `.claude/worktrees/`** — Claude Code residual worktrees from dev sessions.
16. **Clean test seed data** before client takeover (see Section 19).
17. **Refresh `DEPLOY.md`** — has stale URLs (`*.pages.dev` instead of `*.workers.dev`). This file (HANDOFF.md) supersedes it.
18. **Lighter bundle**: Gate FE is 1.16 MB JS (gzip 339 KB). Consider code-splitting `react-simplemde-editor` (heavy Markdown editor) into a separate chunk.

---

## 26. Appendices

### Appendix A — Test seed credentials

**⚠️ All passwords below MUST be rotated before client takeover.**

| Email | Password | Role |
|---|---|---|
| `admin@peken.test` | `Admin123!` | admin |
| `petugas1@peken.test` | `Petugas123!` | petugas |
| `artisan@peken.test` | `Artisan123!` | artisan |
| `kolaborator@peken.test` | `Kolaborator123!` | kolaborator |

Provisioned by `db/seed_demo.sql`. To reset all 4 passwords after handoff:
1. Login as admin → `/petugas` page → reset each petugas password.
2. For admin, artisan, kolaborator: use Supabase Dashboard or Gate Petugas page (if extended to all roles).

### Appendix B — UMKM 9 (kategori_usaha)

Used ONLY on `artisans.kategori_usaha[]`. Canonical order:

1. F&B / Kuliner
2. Kriya
3. Fashion
4. Kosmetik
5. Furnitur
6. Aksesoris
7. Pertanian
8. Peternakan
9. Lainnya

Frontend mirror: `frontend/src/constants/kategoriUsaha.js` in Gate + UMKM. Must match.

### Appendix C — BEKRAF 17 (subsektor)

Used on `kolaborators.subsektor[]`, `events.subsektor[]`, `karya.subsektor` (singular). Canonical order (per BEKRAF):

1. Aplikasi & Game Developer
2. Arsitektur
3. Desain Interior
4. Desain Komunikasi Visual
5. Desain Produk
6. Fashion
7. Film, Animasi & Video
8. Fotografi
9. Kriya
10. Kuliner
11. Musik
12. Penerbitan
13. Periklanan
14. Seni Pertunjukan
15. Seni Rupa
16. Televisi & Radio
17. Lainnya

Frontend mirror: `constants/subsektor.js` in Gate + Kolaborator. Must match.

### Appendix D — Cross-consistency checks (16)

See `db/verify_cross_consistency.sh` for actual script. Summary:

| # | Check | What |
|---|---|---|
| 1 | YAML parse | All 4 OA load successfully |
| 2 | DB CHECK constraints | All `CHECK (... IN (...))` present |
| 3 | RLS enabled | All 20 tables have ENABLE ROW LEVEL SECURITY |
| 4 | Required cross-spec | required[] aligned between specs and DB NOT NULL |
| 5 | OA version sync | All 4 specs at same `info.version` |
| 6 | Constants parity | UMKM 9 + BEKRAF 17 lists match FE + BE |
| 7 | Admin-only fields | `internal_notes` + kolab `no_hp` NOT in public/own-portal OA |
| 8 | DB enum coverage | All DB CHECK values in OA enum |
| 9 | SCHEMA_MAP / OA sync | Latest SCHEMA_MAP delta version == OA `info.version` |
| 10 | Canonical naming | `kategori_usaha` never aliased as `subsektor` |
| 11 | Karya.subsektor singular | NOT array anywhere |
| 12 | Junction shape consistency | `EventArtisan`/`EventKolaborator` same across specs |
| 13 | Petugas RLS policies | 11 petugas policies (D13a + D14) |
| 14 | DB CHECK ⇔ OA enum | Bidirectional consistency |
| 15 | Stub endpoints | `/api/auth/otp/*` + `/api/auth/password/reset` documented in artisan + colab YAML (legacy) |
| 16 | posisi alias | `posisi_event` / `change_request` alias documented in gate + artisan YAML |

### Appendix E — Common error messages users may see

| Where | Message | Cause | User action |
|---|---|---|---|
| Login | "Email atau password salah" | Wrong creds OR account pending/suspended (anti-enum lumps these) | Try again or contact admin |
| Login | "Akun belum diaktifkan" | Profile status = `pending` | Wait for admin activation |
| Login | "Akun Anda ditangguhkan" | Profile status = `suspended` | Contact admin |
| Register | "Email tidak bisa digunakan" | Email taken OR registered in another portal | Use different email or login |
| Forgot password | "Jika email Anda terdaftar, kami sudah kirim link" | Always shown (anti-enum) | Check inbox + spam |
| Reset password | "Tautan reset tidak valid atau sudah kedaluwarsa" | Recovery session expired (>1h) or token wrong | Re-request reset |
| Visitor scan | "Tidak ada event sedang berlangsung" | No event matches now per `is_event_live` | Wait for event or create one |
| Assign artisan | "Validasi gagal" | `posisi_event` missing or non-string | Re-enter stand position |
| Edit event | 422 | FE sent `status_efektif` (computed) back to BE | FE bug — strip it (PR #42 fixed) |

### Appendix F — Glossary

| Term | Meaning |
|---|---|
| Peken | Banyumasan word for "market"; the bi-weekly community event |
| Mirapat | Banyumasan word for "rutin perjumpaan" (regular gathering) |
| Banyumas | Regency in Central Java, Indonesia |
| Kawasan Kota Lama | The old-town district in Banyumas; event venue |
| Sokaraja | Town near Banyumas, known for batik |
| Baturraden | Mountain area near Banyumas, known for coffee + tourism |
| BEKRAF | Indonesia's former creative economy agency; defined the 17 subsektor list |
| UMKM | "Usaha Mikro, Kecil, Menengah" — micro/small/medium enterprise |
| Hexa-helix | 6-pillar collaboration model (govt, academia, industry, community, media, finance) |
| QRIS | Indonesia's unified QR code payment standard |
| NFC | Near-Field Communication, used for visitor card taps |
| WIB | Waktu Indonesia Barat (UTC+7) |
| HF Spaces | HuggingFace Spaces — free hosting for Docker-based services |
| CF Workers | Cloudflare Workers — edge serverless platform; here used for static FE assets |
| RLS | Row Level Security (Postgres) |
| JWT | JSON Web Token |
| anon key | Supabase public key, RLS-bounded |
| service_role | Supabase admin key, bypasses RLS |
| ES256 | Elliptic Curve signing algorithm for JWTs |

---

## Maintenance log

| Date | By | Version | Change |
|---|---|---|---|
| 2026-05-29 | Claude (handoff) | 1.0 | Initial document. 26 sections + appendices. |
| 2026-05-29 | Claude (handoff) | (no-bump) | Restructured §1/§5/§6/§7/§14/§17/§18/§22 for deployment-agnosticism. Added "READ THIS FIRST — Deployment is NOT Fixed" banner. DEPLOY.md reframed as one reference example. OA × 4 server descriptions clarified as platform-agnostic templates. |
| 2026-05-29 | Claude (handoff) | 1.1 | Added "Maintaining These Docs (LIVING)" section with workflow, version bumping conventions, mandatory pre-merge checklist, authority ordering, AI-assistant workflow, and pruning rule for post-handoff cleanup. |
| 2026-05-29 | Claude (handoff) | 1.2 | Added "If you're working from an older snapshot (version drift handling)" subsection. Covers detection (codebase / schema / OA / DB markers via SQL query), 6-step sync workflow (codebase → DB → Storage → env → verify), edge cases (team's own diverged work, prod data at risk), and notes the current canonical baseline (schema v2.4.0, OA v2.4.1, recent PRs #47–#54). Lets a team that forked weeks ago confidently bring their snapshot current. |

When updating this document:
1. Apply your changes.
2. If structure/content changed materially, bump the `Version` at top (e.g. `1.1 → 1.2` for a clarification round; `1.x → 2.0` for a major restructure).
3. Add an entry here with date, who, version, summary.
4. Run `bash db/verify_cross_consistency.sh` → must pass 16/16 even after pure doc edits (the verifier checks SCHEMA_MAP version sync).
5. Commit with message `docs: HANDOFF.md vX.Y - <one-line summary>`.

---

**END OF HANDOFF DOCUMENT**

For questions during the handoff period (≤30 days from 2026-05-29), contact: (insert original dev contact here).

After handoff cutoff, the client team owns this codebase. Good luck and happy shipping. 🌿
