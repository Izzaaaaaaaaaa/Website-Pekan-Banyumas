from fastapi import APIRouter

from app.schemas.auth_schema import LoginRequest
from app.services.auth_service import login_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    return login_user(payload.email, payload.password)
