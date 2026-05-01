from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_user
from app.services.profile_service import get_profile, update_profile
from app.services.portfolio_service import create_portfolio, delete_portfolio, get_portfolio, update_portfolio
from app.services.story_service import create_story, delete_story, get_stories

router = APIRouter(prefix="/kolaborator", tags=["Kolaborator"])


class ProfileUpdateRequest(BaseModel):
    nama: str | None = None
    email: EmailStr | None = None
    kota: str | None = None
    bio: str | None = None
    subsektor: list[str] | None = None
    foto_url: str | None = None
    cover_url: str | None = None


class PortfolioCreateRequest(BaseModel):
    judul: str
    subsektor: str | None = None
    deskripsi: str | None = None
    tahun: int | None = None
    featured: bool = False
    gambar_url: str | None = None


class PortfolioUpdateRequest(BaseModel):
    judul: str | None = None
    subsektor: str | None = None
    deskripsi: str | None = None
    tahun: int | None = None
    featured: bool | None = None
    gambar_url: str | None = None


class StoryCreateRequest(BaseModel):
    konten: str
    media_url: str | None = None
    tags: list[str] = []


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_profile(user)}


@router.patch("/me")
def update_me(payload: ProfileUpdateRequest, user: dict = Depends(get_current_user)) -> dict:
    return {"data": update_profile(user, payload.model_dump())}


@router.get("/me/portofolio")
def list_portofolio(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_portfolio(user)}


@router.post("/me/portofolio")
def create_portofolio(payload: PortfolioCreateRequest, user: dict = Depends(get_current_user)) -> dict:
    return {"data": create_portfolio(user, payload.model_dump())}


@router.patch("/me/portofolio/{item_id}")
def update_portofolio(item_id: str, payload: PortfolioUpdateRequest, user: dict = Depends(get_current_user)) -> dict:
    return {"data": update_portfolio(user, item_id, payload.model_dump())}


@router.delete("/me/portofolio/{item_id}")
def delete_portofolio(item_id: str, user: dict = Depends(get_current_user)) -> dict:
    return {"data": delete_portfolio(user, item_id)}


@router.get("/me/story")
def list_story(user: dict = Depends(get_current_user)) -> dict:
    return {"data": get_stories(user)}


@router.post("/me/story")
def create_story_route(payload: StoryCreateRequest, user: dict = Depends(get_current_user)) -> dict:
    return {"data": create_story(user, payload.model_dump())}


@router.delete("/me/story/{story_id}")
def delete_story_route(story_id: str, user: dict = Depends(get_current_user)) -> dict:
    return {"data": delete_story(user, story_id)}
