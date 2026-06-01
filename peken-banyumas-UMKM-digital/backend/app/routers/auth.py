from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginSchema, RegisterSchema, ResetPasswordSchema, OtpRequestSchema, OtpVerifySchema
from app.services import auth_service
from app.models.model import TokenResponse, MessageResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginSchema):
    try:
        return auth_service.login(body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterSchema):
    try:
        return auth_service.register(body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/otp/request", response_model=MessageResponse)
def otp_request(body: OtpRequestSchema):
    """
    Minta OTP dikirim ke nomor HP via WhatsApp (manual oleh admin).
    Backend insert ke otp_codes dengan purpose yang sesuai.
    """
    # TODO: integrasi WhatsApp API / notifikasi admin
    # Untuk sekarang hanya insert OTP ke DB (admin kirim manual)
    import uuid, os
    from datetime import datetime, timedelta, timezone
    from app.db.supabase import db_insert

    code = str(uuid.uuid4().int)[:4]  # 4 digit OTP
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    db_insert("otp_codes", {
        "id": str(uuid.uuid4()),
        "phone": body.phone,
        "code": code,
        "purpose": body.purpose,
        "expires_at": expires_at,
    })

    return {"message": "Permintaan OTP berhasil dikirim, tunggu konfirmasi admin via WhatsApp"}


@router.post("/otp/verify", response_model=MessageResponse)
def otp_verify(body: OtpVerifySchema):
    """Verifikasi OTP — dipakai sebelum reset password."""
    from datetime import datetime, timezone
    from app.db.supabase import db_select

    now = datetime.now(timezone.utc)
    record = db_select("otp_codes", filters={"phone": body.phone, "code": body.code, "purpose": body.purpose}, single=True)

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kode OTP tidak valid")

    if record.get("used_at"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kode OTP sudah dipakai")

    expires_at = record.get("expires_at", "")
    if expires_at:
        from datetime import datetime as dt
        exp = dt.fromisoformat(expires_at.replace("Z", "+00:00"))
        if now > exp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kode OTP sudah kadaluarsa")

    return {"message": "OTP valid"}


@router.post("/password/reset", response_model=MessageResponse)
def reset_password(body: ResetPasswordSchema):
    try:
        return auth_service.reset_password(body.phone, body.code, body.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
