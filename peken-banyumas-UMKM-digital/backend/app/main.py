from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, stok, kas, riwayat, event, notifikasi, pengaturan

app = FastAPI(
    title="Peken Banyumas — Artisan API",
    description="Backend API untuk platform artisan UMKM Peken Banyumas — schema v2.4.2",
    version="2.4.2",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_origin_regex=".*" accepts ANY origin (current *.pages.dev AND any future
# custom domain — zero config) while staying CORS-spec-valid with credentials:
# Starlette echoes the request's Origin back instead of the literal "*". A bare
# allow_origins=["*"] + allow_credentials=True is illegal per spec and browsers
# reject it once cookies are involved. Matches gate/kolab; no domain switch will
# require editing this.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
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
