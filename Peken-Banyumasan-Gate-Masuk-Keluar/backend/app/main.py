from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


app = FastAPI(title="Peken Banyumasan Gate Admin API", version="2.4.2")

# CORS Middleware
# allow_origin_regex=".*" accepts ANY origin (current *.pages.dev AND any future
# custom domain — zero config) while staying CORS-spec-valid with credentials:
# Starlette echoes the request's Origin back instead of the literal "*". A bare
# allow_origins=["*"] + allow_credentials=True is illegal per spec and browsers
# reject it once cookies are involved. No domain switch will require editing this.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
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
    return {"message": "Backend is running 🚀", "version": "2.4.2"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "gate", "version": "2.4.2"}
