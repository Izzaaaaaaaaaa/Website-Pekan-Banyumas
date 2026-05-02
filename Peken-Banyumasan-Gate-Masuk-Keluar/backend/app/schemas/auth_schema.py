from pydantic import BaseModel, EmailStr


# 🔐 LOGIN
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    user_id: str
    role: str


# 🔥 PROFILE RESPONSE
class UserResponse(BaseModel):
    id: str
    nama: str
    email: EmailStr
    role: str


# 🔥 UPDATE PROFILE
class ProfileUpdate(BaseModel):
    nama: str


# 🔥 UPDATE PASSWORD
class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str