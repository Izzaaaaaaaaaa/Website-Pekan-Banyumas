from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

from app.services.auth_service import (
    login_user,
    get_me,
    update_profile,
    update_password
)

from app.schemas.auth_schema import (
    LoginRequest,
    ProfileUpdate,
    PasswordUpdate
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# 🔐 LOGIN
@router.post("/login")
def login(data: LoginRequest):
    return login_user(data.email, data.password)


# 🔥 GET CURRENT USER
@router.get("/me")
def me(user=Depends(get_current_user)):
    return get_me(user["user_id"])


# 🔥 UPDATE PROFILE
@router.put("/profile")
def profile(data: ProfileUpdate, user=Depends(get_current_user)):
    return update_profile(user["user_id"], data.nama)


# 🔥 UPDATE PASSWORD
@router.put("/password")
def password(data: PasswordUpdate, user=Depends(get_current_user)):
    return update_password(
        user["user_id"],
        data.old_password,
        data.new_password
    )