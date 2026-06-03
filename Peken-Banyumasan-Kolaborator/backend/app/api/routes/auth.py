from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.utils import _envelope, _error_envelope
from app.schemas.auth_schema import RegisterKolaboratorRequest, UpdateProfileRequest
from app.services.auth_service import register_kolaborator, update_auth_profile

router = APIRouter(prefix="/auth", tags=["Auth"])




@router.post("/register")
def register(payload: RegisterKolaboratorRequest):
    """POST /api/auth/register — BE-intermediary (no auth required)."""
    result = register_kolaborator(payload.model_dump())
    if "error" in result:
        status_code = result.get("status_code", 400)
        return _error_envelope(result["error"], status_code)

    return _envelope(
        data={"message": result["message"], "status": result["status"]},
        message=result["message"],
    )


@router.put("/profile")
def update_profile_route(payload: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    """PUT /api/auth/profile — HYBRID (custom fields only, requires auth)."""
    result = update_auth_profile(user["user_id"], payload.model_dump(exclude_none=True))
    if "error" in result:
        status_code = result.get("status_code", 400)
        return _error_envelope(result["error"], status_code)

    return _envelope(data=result, message="Profile berhasil diupdate")


# ── OTP password-reset stubs ────────────────────────────────────────────────
# Not yet implemented — frontend throws 'Not implemented yet' for these.

@router.post("/otp/request")
def request_otp():
    """POST /api/auth/otp/request — STUB."""
    return _error_envelope("Not implemented yet", 501)


@router.post("/otp/verify")
def verify_otp():
    """POST /api/auth/otp/verify — STUB."""
    return _error_envelope("Not implemented yet", 501)


@router.post("/password/reset")
def reset_password():
    """POST /api/auth/password/reset — STUB."""
    return _error_envelope("Not implemented yet", 501)
