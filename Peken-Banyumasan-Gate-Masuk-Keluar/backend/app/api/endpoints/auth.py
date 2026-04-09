from fastapi import APIRouter
from app.utils.response import success

router = APIRouter()

@router.post("/login")
def login():
    return success({
        "token": "dummy-token",
        "user": {
            "id": 1,
            "nama": "Admin",
            "email": "admin@mail.com",
            "role": "admin"
        }
    })