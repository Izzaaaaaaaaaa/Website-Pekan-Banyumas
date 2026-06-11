# Frontend Testing — Gate (Admin & Petugas)

Three automated layers + performance, all runnable **without a backend**.

## Stack
- **Unit + Component** — Vitest 4 + React Testing Library (jsdom)
- **E2E / UI functionality** — Playwright (Chromium); backend calls are mocked
- **Performance** — Lighthouse via a custom runner (`scripts/lighthouse.mjs`)

## One-time setup
```bash
npm install
npx playwright install chromium    # downloads the browser once
```
Performance (`test:perf`) needs Chrome — auto-detected. On Windows without Chrome, set `CHROME_PATH` to Edge first.

## Run
| Command | Layer | What it checks |
|---|---|---|
| `npm test` | unit + component | `unwrap` helpers, `eventZones` layout + occupancy, auth state, `Toast` + `ConfirmDialog` |
| `npm run test:coverage` | + coverage | same, writes coverage to `./coverage` |
| `npm run test:e2e` | E2E / UI | admin login + required fields, and the authenticated admin shell (real browser, API mocked) |
| `npm run test:perf` | performance | builds + Lighthouse on the login SPA; report in `./lighthouse-report` |
| `npm run test:all` | **regression** | unit + component, then E2E — run before every release/PR |

## The three layers
1. **Unit** (`src/lib`) — `unwrap` (envelope + error handling), `auth` (token/user/role/clearAuth), and `eventZones` (zone-stats, layout mutations, per-event occupancy) against an in-memory localStorage. Pure / deterministic.
2. **Component** (`src/components/*.test.jsx`) — `Toast` (show / variant / auto-dismiss) and `ConfirmDialog` (open/close + confirm/cancel callbacks).
3. **E2E** (`e2e/*.spec.js`) — Playwright drives a real browser against the dev server (port 5174); `**/api/**` is stubbed and an admin session is seeded into localStorage for protected routes, so **no backend or Docker is required**.

## Regression discipline (not new tests)
Regression = re-running `test:all` (+ `test:perf` for releases) after every change and keeping it green vs. the last run.

| Case | Layer | File |
|---|---|---|
| extractData / extractMessage / extractError | unit | `src/lib/unwrap.test.js` |
| token / user / role helpers / clearAuth | unit | `src/lib/auth.test.js` |
| zone stats / templates / layout mutations / per-event occupancy | unit | `src/lib/eventZones.test.js` |
| Toast show / variant / auto-dismiss | component | `src/components/Toast.test.jsx` |
| ConfirmDialog open/close + confirm/cancel | component | `src/components/ConfirmDialog.test.jsx` |
| admin login render / required fields | e2e | `e2e/login.spec.js` |
| authenticated admin dashboard shell | e2e | `e2e/dashboard.spec.js` |
| SPA Lighthouse scores | perf | `scripts/lighthouse.mjs` |

## Performance runner
`test:perf` builds, then runs `scripts/lighthouse.mjs` — a small runner that
serves `dist/` on an ephemeral port and audits the SPA entry with Lighthouse.
It launches Chrome with a fixed user-data-dir and writes the report **before**
closing Chrome, so it **always emits a report** to `lighthouse-report/`
(HTML + JSON) and exits 0 — even on Windows with real-time antivirus that would
otherwise make the default `lhci` temp cleanup fail with `EPERM`. Scores are
mobile-emulation; run in CI (Linux) for canonical numbers.

## Reports to collect
- `coverage/`, `playwright-report/`, `lighthouse-report/` — all gitignored; copy into the testing dossier per run.
