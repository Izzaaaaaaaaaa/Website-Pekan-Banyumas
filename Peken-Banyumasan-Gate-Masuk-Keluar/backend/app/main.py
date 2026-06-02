from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import test
from app.api.routes import dashboard
from app.api.routes import auth
from app.api.routes import events
from app.api.routes import reports
from app.api.routes import kolaborator
from app.api.routes import artisan
from app.api.routes import aktivitas
from app.api.routes import zones
from app.api.routes import petugas
from app.api.routes import notifikasi
from app.api.routes import company_profile


app = FastAPI(title="Peken Banyumasan Gate Admin API", version="2.4.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(test.router)
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(reports.router)
app.include_router(kolaborator.router)
app.include_router(artisan.router)
app.include_router(aktivitas.router)
app.include_router(zones.router)
app.include_router(petugas.router)
app.include_router(notifikasi.router)
app.include_router(company_profile.router)


@app.get("/")
def root():
    return {"message": "Backend is running 🚀", "version": "2.4.0"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "gate", "version": "2.4.0"}
