# Frontend Testing — Kolaborator Portal

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
`test:perf` auto-detects Chrome. On Windows without Chrome, point it at Edge first:
```bash
set CHROME_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
```

## Run
| Command | Layer | What it checks |
|---|---|---|
| `npm test` | unit + component | helpers (unwrap / slug / kotaList / subsektor), auth + storageKeys logic, Toast component |
| `npm run test:coverage` | + coverage | same, writes coverage to `./coverage` |
| `npm run test:e2e` | E2E / UI | login render + validation + nav, and the authenticated dashboard shell (real browser, API mocked) |
| `npm run test:perf` | performance | builds + Lighthouse on the SPA; report in `./lighthouse-report` |
| `npm run test:all` | **regression** | unit + component, then E2E — run before every release/PR |

## The three layers
1. **Unit** (`src/lib`, `src/constants`) — pure logic + auth/storage state, deterministic. localStorage-backed modules use an in-memory Storage stub.
2. **Component** (`src/components/*.test.jsx`) — renders React components in jsdom and asserts behavior.
3. **E2E** (`e2e/*.spec.js`) — Playwright drives a real browser against the dev server; every `**/api/**` call is stubbed (and an authenticated session is seeded into localStorage for protected routes), so **no backend or Docker is required**.

## Regression discipline (not new tests)
Regression = re-running `test:all` (plus `test:perf` for releases) after every change and confirming it stays green vs. the last run.

| Case | Layer | File |
|---|---|---|
| extractData / extractMessage / extractError | unit | `src/lib/unwrap.test.js` |
| toSlug / profileUrl | unit | `src/lib/slug.test.js` |
| token / user / role helpers / clearAuth | unit | `src/lib/auth.test.js` |
| storage keys + logout cleanup list | unit | `src/lib/storageKeys.test.js` |
| KOTA_LIST integrity | unit | `src/constants/kotaList.test.js` |
| SUBSEKTOR (BEKRAF 17) integrity | unit | `src/constants/subsektor.test.js` |
| Toast show / variant / auto-dismiss | component | `src/components/Toast.test.jsx` |
| login render / validation / register nav | e2e | `e2e/login.spec.js` |
| authenticated dashboard + pending→/status guard | e2e | `e2e/dashboard.spec.js` |
| SPA Lighthouse scores | perf | `scripts/lighthouse.mjs` |

## Performance runner
`test:perf` builds, then runs `scripts/lighthouse.mjs` — a small runner that
serves `dist/` on an ephemeral port and audits the SPA entry with Lighthouse.
It launches Chrome with a fixed user-data-dir and writes the report **before**
closing Chrome, so it **always emits a report** to `lighthouse-report/`
(HTML + JSON) and exits 0 — even on Windows with real-time antivirus that would
otherwise make the default `lhci` temp cleanup fail with `EPERM`. Scores are
mobile-emulation; run in CI (Linux) for canonical numbers.

## Reports to collect (the "laporan pengujian" artifacts)
- `coverage/` — HTML + lcov coverage
- `playwright-report/` — HTML E2E report (`npm run test:e2e:report` to open)
- `lighthouse-report/` — Lighthouse HTML/JSON
All are gitignored; copy them into your testing dossier per run.
