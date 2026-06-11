
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, dashboard, event, kolaborator, notifikasi, pengaturan
from fastapi import APIRouter

app = FastAPI(
    title="Peken Banyumasan Kolaborator API",
    description="Backend API untuk portal Kolaborator Peken Banyumasan.",
    version="2.4.2",
)

# CORS — izinkan request dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ganti dengan domain spesifik saat production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(dashboard.router)
api.include_router(event.router)
api.include_router(kolaborator.router)
api.include_router(notifikasi.router)
api.include_router(pengaturan.router)

app.include_router(api)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Backend Kolaborator is running"}


@app.get("/health")
def health() -> dict[str, str]:
    """Lightweight health probe — used by Docker healthcheck and monitoring."""
    return {"status": "ok", "service": "peken-kolab-api", "version": "2.4.2"}
