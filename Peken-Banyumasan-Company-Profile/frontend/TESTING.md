# Frontend Testing — Company Profile (public site)

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
| `npm test` | unit + component | `apiFetch` + endpoint URLs, `toSlug`, `categoryHelper`, `PillButton` / `SectionHeader` / `Modal` |
| `npm run test:coverage` | + coverage | same, writes coverage to `./coverage` |
| `npm run test:e2e` | E2E / UI | nav renders, navigation through all sections, footer landmark (real browser, API mocked) |
| `npm run test:perf` | performance | builds + Lighthouse on the home SPA; report in `./lighthouse-report` |
| `npm run test:all` | **regression** | unit + component, then E2E — run before every release/PR |

> Note: E2E uses the Vite **dev server** (port **5173**). Playwright sets `PW_TEST`, which suppresses this app's `open:true` so no browser tab pops during the run. No build needed.

## The three layers
1. **Unit** (`src/services`, `src/lib`) — `apiFetch` (mocked `fetch`), endpoint URL builders (mocked `apiFetch`), `toSlug`, `categoryHelper`. Pure, deterministic.
2. **Component** (`src/components/**/*.test.jsx`) — `PillButton` (label/click/aria/type), `SectionHeader` (eyebrow/title/slot), `Modal` (open/close, Escape, backdrop dismiss).
3. **E2E** (`e2e/*.spec.js`) — Playwright drives a real browser; every `**/api/**` call is stubbed, so **no backend is required**. Selectors are scoped to the `<nav>` landmark (the footer repeats the same labels).

## Regression discipline (not new tests)
Regression = re-running `test:all` (+ `test:perf` for releases) after every change and keeping it green vs. the last run.

| Case | Layer | File |
|---|---|---|
| apiFetch unwrap / errors / headers | unit | `src/services/api.test.js` |
| endpoint URL building | unit | `src/services/endpoints.test.js` |
| toSlug | unit | `src/lib/slug.test.js` |
| getCategory (artisan/kolaborator resolution) | unit | `src/lib/categoryHelper.test.js` |
| PillButton label / click / aria / type | component | `src/components/shared/PillButton.test.jsx` |
| SectionHeader eyebrow / title / slot | component | `src/components/shared/SectionHeader.test.jsx` |
| Modal open/close / Escape / backdrop | component | `src/components/shared/Modal.test.jsx` |
| nav render / section navigation / footer | e2e | `e2e/home.spec.js`, `e2e/navigation.spec.js` |
| home SPA Lighthouse scores | perf | `scripts/lighthouse.mjs` |

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
