from fastapi import APIRouter
from pydantic import BaseModel
from app.services.auth_service import login_user

router = APIRouter(prefix="/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(data: LoginRequest):
    return login_user(data.email, data.password)