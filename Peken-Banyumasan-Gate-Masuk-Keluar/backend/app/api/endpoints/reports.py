from fastapi import APIRouter
from app.utils.response import success

router = APIRouter()

@router.get("/")
def get_reports():
    return success({})