from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    nama: str
    email: str
    role: str