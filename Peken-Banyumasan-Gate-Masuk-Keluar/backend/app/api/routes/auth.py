from fastapi import APIRouter
from app.services.auth_service import login_user
from app.schemas.auth_schema import LoginRequest  

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(data: LoginRequest):
    return login_user(data.email, data.password)