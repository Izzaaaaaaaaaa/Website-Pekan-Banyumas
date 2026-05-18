from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user, get_current_user_id
from pydantic import BaseModel

from app.services.auth_service import (
    EMAIL_NOT_REGISTERED,
    WRONG_PASSWORD,
    login_user,
    update_profile
)

from app.schemas.auth_schema import ProfileUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", response_model=dict)
def login(data: LoginRequest):

    try:
        response = login_user(
            data.email,
            data.password
        )

        user = response.user
        session = response.session

        return {
            "token": session.access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.user_metadata.get("role"),
                "nama": user.user_metadata.get("nama")
            }
        }

    except Exception as e:
        error_message = str(e)

        if error_message == EMAIL_NOT_REGISTERED:
            raise HTTPException(
                status_code=404,
                detail="Email anda tidak terdaftar"
            )

        if error_message == WRONG_PASSWORD:
            raise HTTPException(
                status_code=401,
                detail="Password anda salah"
            )

        raise HTTPException(
            status_code=500,
            detail=error_message
        )

@router.put("/profile", response_model=dict)
def update_user_profile(
    data: ProfileUpdate,
    user=Depends(get_current_user),
    user_id: str = Depends(get_current_user_id)
):
    """Update custom profile fields (nama/email handled by Supabase client)."""
    try:
        result = update_profile(user_id, data.dict(exclude_unset=True))
        return success_response(None, message=result.get("message", "Profile berhasil diupdate"))
    except Exception as e:
        raise HTTPException(500, detail=error_response(str(e), 500))
