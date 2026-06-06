# Kolaborator — Plan (FE + BE)

Collaborator portal. **BE** standalone (supabase-py REST, no peken_common, 0 tests, 21 endpoints). Verifies **Supabase JWT** (role `kolaborator`). **FE** React/Vite, logs in via Supabase `signInWithPassword`. Backend `localhost:8003` (root `/`, no `/health`).

## Verified 2026-06-05
- Root `/` 200; protected endpoints 401 without token.
- With a **minted kolaborator token** (real JWT secret), all no-param GETs returned 200 + live data: `dashboard/stats, events, events/my-requests, kolaborator/me, kolaborator/me/portofolio, kolaborator/me/story, notifikasi, pengaturan`.
- FE `npm run build` exit 0.
- The running container verifies tokens with the **real** JWT secret (a placeholder-signed token was rejected). `.env` had the placeholder string in-file → aligned to the real secret so a restart stays consistent.

## Issues

### KOL-1 · 🔴 `GET /test/db` returns data without auth
- Live: `curl localhost:8003/test/db` (no token) → **200** with real event rows. A debug endpoint exposing data on a deployed service.
- Fix: remove the route.
- Done when: `GET /test/db` → 404 (or at minimum auth-gated, but removal is correct).

### KOL-2 · 🟡 Login after activation works (DB trigger) — but the trigger is missing from this repo's schema file
- The login guard reads `app_metadata.status` (`deps.py:55`). A live DB trigger copies `kolaborators.status` into `app_metadata.status` whenever status changes, so an activated collaborator can log in. Live-tested: register pending → admin activates → `app_metadata.status=aktif` → login passes. **No application-code change needed.**
- 🟡 Risk: that trigger exists in the live DB but is **absent from `backend/supabase_schema.sql`** (the committed file only has the role-sync). If the DB is ever rebuilt from this file, activation→login silently breaks.
- Fix: add the trigger to `backend/supabase_schema.sql` (use the existing role-sync function as the pattern):
  ```sql
  CREATE OR REPLACE FUNCTION public.sync_kolaborator_status_to_auth()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      UPDATE auth.users
      SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('status', NEW.status)
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;
  END; $$;
  CREATE TRIGGER trg_sync_kolaborator_status
    AFTER UPDATE OF status ON public.kolaborators
    FOR EACH ROW EXECUTE FUNCTION public.sync_kolaborator_status_to_auth();
  ```
- Done when: the schema file contains this trigger and a rebuild-from-file preserves activation→login.

### KOL-3 · 🟠 0 automated tests for 21 endpoints
- Fix: smoke tests for register, login guard, profile read/update, portofolio + story CRUD, event apply.
- Done when: a green `pytest` run covers those paths.

### KOL-4 · 🟢 No `/health` endpoint
- Only `/`. Docker healthcheck uses `/` (already configured). Optional: add a light `/health` endpoint.

### KOL-5 · 🟢 OTP endpoint is a 501 stub (correct)
- `/api/auth/otp/request` → 501. Password reset is meant to go through Supabase native flow. Just ensure the FE never calls this stub.

### KOL-FE · 🟢 Reading `app_metadata.status` is correct; per-page audit pending
- The collaborator FE derives status from `app_metadata.status` (`services/realEndpoints.js`, `lib/auth.js` onAuthStateChange, `App.jsx` isBlocked). This is **correct** — the DB trigger keeps that claim accurate, so no FE change is needed (a client-side `kolaborators.status` query was considered and rejected as fragile).
- Per-page audit still pending: Dashboard, Profil, Portofolio, Story, Event, Notifikasi — check each renders live data.

## Checklist
- [ ] KOL-1 remove `/test/db`
- [ ] KOL-2 add the status-sync trigger to `backend/supabase_schema.sql` (match the live DB)
- [ ] KOL-3 add smoke tests for critical paths
- [ ] KOL-4 (optional) add `/health`
- [ ] KOL-FE per-page audit vs live backend (no FE status workaround)
- [x] E2E **done** (live-tested): register → admin activates → status syncs → login works
- [ ] E2E: apply to event → status "menunggu" → admin approves → shows "diterima sebagai {peran}"

## Not yet verified
- POST/PUT flows (update profile, create portofolio/story, apply to event) — testable now with a minted kolaborator token; not yet exercised.
