from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_user
from app.schemas.auth_schema import LoginRequest
from app.services.auth_service import login_user, register_user
from app.services.profile_service import update_profile

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    result = login_user(payload.email, payload.password)
    if "error" in result:
        return JSONResponse(status_code=401, content={"status": "error", "message": result["error"]})
    return result


class RegisterRequest(BaseModel):
    nama: str
    email: EmailStr
    password: str
    kota: str | None = None
    subsektor: list[str] = []
    bio: str | None = None
    role: str = "kolaborator"


class ProfileUpdateRequest(BaseModel):
    nama: str | None = None
    email: EmailStr | None = None
    kota: str | None = None
    bio: str | None = None
    subsektor: list[str] | None = None
    foto_url: str | None = None
    cover_url: str | None = None


@router.post("/register")
def register(payload: RegisterRequest) -> dict:
    result = register_user(payload.model_dump())
    if "error" in result:
        return JSONResponse(status_code=400, content={"status": "error", "message": result["error"]})
    return result


@router.put("/profile")
def update_profile_route(payload: ProfileUpdateRequest, user: dict = Depends(get_current_user)) -> dict:
    return {"data": update_profile(user, payload.model_dump())}
