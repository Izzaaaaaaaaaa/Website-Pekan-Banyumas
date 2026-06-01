import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.routers import company_profile, programs, karya, profiles, events, stats

load_dotenv()

app = FastAPI(
    title="Peken Banyumasan — Company Profile API",
    description="Public-only API untuk Company Profile Peken Banyumasan",
    version="2.3.1",
)

# CORS
origins = [os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Global HTTP exception handler — pastikan selalu pakai envelope
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"status": "error", "message": "Sumber daya tidak ditemukan", "data": None},
    )

@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Terjadi kesalahan pada server", "data": None},
    )

# Routers
app.include_router(company_profile.router)
app.include_router(programs.router)
app.include_router(karya.router)
app.include_router(profiles.router)
app.include_router(events.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"status": "success", "message": "Peken Banyumasan Company Profile API v2.3.1", "data": None}
