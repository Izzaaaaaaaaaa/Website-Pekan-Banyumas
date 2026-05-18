from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.supabase import supabase
from app.utils.response import error_response

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify Supabase access token using Supabase SDK.
    """

    try:

        token = credentials.credentials

        response = supabase.auth.get_user(token)

        user = response.user

        if not user:
            raise HTTPException(
                status_code=401,
                detail=error_response(
                    "Token tidak valid atau sudah kedaluwarsa",
                    401
                )
            )

        return {
            "sub": user.id,
            "email": user.email,
            "app_metadata": user.app_metadata,
            "user_metadata": user.user_metadata
        }

    except Exception as e:

        raise HTTPException(
            status_code=401,
            detail=error_response(str(e), 401)
        )


def get_current_user_id(
    user=Depends(get_current_user)
) -> str:

    return user.get("sub")


def get_admin_only(
    user=Depends(get_current_user)
):

    role = user.get("app_metadata", {}).get("role")

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail=error_response(
                "Anda tidak memiliki akses untuk fitur ini",
                403
            )
        )

    return user