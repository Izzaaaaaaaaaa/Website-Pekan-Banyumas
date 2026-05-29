---
title: Peken CP API
emoji: 🏪
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Peken Banyumasan — Company Profile API

Public read-only API backing the Company Profile frontend. Serves marketplace
data (artisans, karya, events, programs, stats) without authentication.

- **Stack:** FastAPI · SQLAlchemy (async) · Supabase Postgres
- **Auth:** none (public)
- **Health:** `GET /health` → `{"status":"ok"}`
- **OpenAPI:** `GET /openapi.json`

## Required secrets (set in Space Settings → Variables & secrets)

| Name | Source |
|---|---|
| `SUPABASE_URL` | Supabase Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API → service_role |
| `SUPABASE_DB_URL` | Pooler URL (`postgresql+asyncpg://...`) |
| `CORS_ORIGINS` | Comma-separated FE origins (e.g. `https://peken-cp.jauharfz.workers.dev`) |

Source repo: `https://github.com/jauharfz/peken-dev`
