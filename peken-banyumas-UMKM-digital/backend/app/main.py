from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, stok, kas, riwayat, event, notifikasi, pengaturan

app = FastAPI(
    title="Peken Banyumas — Artisan API",
    description="Backend API untuk platform artisan UMKM Peken Banyumas — schema v2.3.0",
    version="2.3.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": "Peken Banyumas Artisan API",
        "schema_version": "2.3.0",
    }
