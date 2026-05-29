"""Top-level API router. Aggregates health + public routers."""

from fastapi import APIRouter

from app.api.v1.routers.health import router as health_router
from app.api.v1.routers.public import router as public_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(public_router)
