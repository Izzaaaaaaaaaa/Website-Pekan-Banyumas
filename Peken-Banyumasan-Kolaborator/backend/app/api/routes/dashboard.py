from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.dashboard_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def stats(_: dict = Depends(get_current_user)) -> dict:
    return get_dashboard_stats()
