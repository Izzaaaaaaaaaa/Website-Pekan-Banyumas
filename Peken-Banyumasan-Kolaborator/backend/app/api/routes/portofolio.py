from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.portfolio_service import get_portfolio

router = APIRouter(prefix="/portofolio", tags=["Portofolio"])


@router.get("")
def portfolio(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_portfolio(user)}
