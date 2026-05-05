from pydantic import BaseModel, EmailStr


class RegisterKolaboratorRequest(BaseModel):
    """POST /api/auth/register body.

    Matches OpenAPI RegisterKolaboratorBody schema:
    required: [role, nama, email, password, kota, subsektor]
    """
    role: str = "kolaborator"
    nama: str
    email: EmailStr
    password: str
    kota: str
    subsektor: list[str]
    bio: str | None = None


class UpdateProfileRequest(BaseModel):
    """PUT /api/auth/profile body.

    Custom fields only — nama/email go to Supabase directly on the frontend.
    Matches OpenAPI UpdateProfileBody schema.
    """
    subsektor: list[str] | None = None
    kota: str | None = None
    bio: str | None = None
    foto_url: str | None = None
    cover_url: str | None = None
