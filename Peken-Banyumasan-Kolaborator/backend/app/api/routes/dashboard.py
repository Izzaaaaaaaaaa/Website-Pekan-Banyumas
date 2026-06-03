from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.utils import _envelope
from app.services.dashboard_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def stats(user: dict = Depends(get_current_user)):
    """GET /api/dashboard/stats — global + personal stats untuk kolaborator yang login."""
    return _envelope(get_dashboard_stats(user))
