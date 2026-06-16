import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, stok, kas, riwayat, event, notifikasi, pengaturan

app = FastAPI(
    title="Peken Banyumas — Artisan API",
    description="Backend API untuk platform artisan UMKM Peken Banyumas — schema v2.4.2",
    version="2.4.2",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_credentials=True forbids the "*" wildcard origin (CORS spec), so we list
# explicit origins. Production frontend is the Cloudflare Pages deployment; the
# regex additionally admits Pages *preview* deploys (e.g.
# https://<hash>.artisan-pekenbanyumasan.pages.dev). Extra origins can be added
# via the comma-separated CORS_ORIGINS env var on Railway without a code change.
_DEFAULT_ORIGINS = [
    "https://artisan-pekenbanyumasan.pages.dev",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_ENV_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_DEFAULT_ORIGINS + _ENV_ORIGINS,
    allow_origin_regex=r"https://([a-z0-9-]+\.)*artisan-pekenbanyumasan\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api")
app.include_router(stok.router,       prefix="/api/artisan")
app.include_router(kas.router,        prefix="/api/artisan")
app.include_router(riwayat.router,    prefix="/api/artisan")
app.include_router(event.router,      prefix="/api")
app.include_router(notifikasi.router, prefix="/api")
app.include_router(pengaturan.router, prefix="/api/artisan")


# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
def _health_payload():
    return {
        "status": "ok",
        "app": "Peken Banyumas Artisan API",
        "schema_version": "2.4.2",
    }


@app.get("/", tags=["Health"])
def root():
    return _health_payload()


# Mirror of "/" so Railway (and the other 3 backends' convention) can health-check
# at /health. Both paths return the same payload.
@app.get("/health", tags=["Health"])
def health():
    return _health_payload()
