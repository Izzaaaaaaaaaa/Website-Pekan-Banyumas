from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    dashboard,
    events,
    visitors,
    members,
    reports,
    tenants
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(visitors.router, prefix="/visitors", tags=["Visitors"])
api_router.include_router(members.router, prefix="/members", tags=["Members"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])