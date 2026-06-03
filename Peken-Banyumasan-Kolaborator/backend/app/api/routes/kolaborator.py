from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.api.deps import get_current_user
from app.api.utils import _envelope, _error_envelope
from app.services.portfolio_service import create_portfolio, delete_portfolio, get_portfolio, update_portfolio
from app.services.profile_service import get_profile, update_profile
from app.services.story_service import create_story, delete_story, get_stories, update_story

router = APIRouter(prefix="/kolaborator", tags=["Kolaborator"])




class PatchKolaboratorBody(BaseModel):
    """PATCH /api/kolaborator/me body.

    Allowed: nama, email, kota, bio, foto_url, cover_url, subsektor.
    NOT allowed: status, total_*, tanggal_daftar.
    """
    nama: str | None = None
    email: EmailStr | None = None
    kota: str | None = None
    bio: str | None = None
    subsektor: list[str] | None = None
    foto_url: str | None = None
    cover_url: str | None = None


class CreateKaryaBody(BaseModel):
    """POST /api/kolaborator/me/portofolio body."""
    judul: str
    subsektor: str
    deskripsi: str = ""
    tahun: int
    featured: bool = False
    gambar_url: str | None = None


class PatchKaryaBody(BaseModel):
    """PATCH /api/kolaborator/me/portofolio/{id} body."""
    judul: str | None = None
    subsektor: str | None = None
    deskripsi: str | None = None
    tahun: int | None = None
    featured: bool | None = None
    gambar_url: str | None = None


class CreateStoryBody(BaseModel):
    """POST /api/kolaborator/me/story body."""
    konten: str
    media_url: str | None = None
    tags: list[str] = []


class PatchStoryBody(BaseModel):
    """PATCH /api/kolaborator/me/story/{id} body."""
    konten: str | None = None
    media_url: str | None = None
    tags: list[str] | None = None


# ── Self-Profile ────────────────────────────────────────────────────────────

@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    data = get_profile(user)
    if not data:
        return _error_envelope("Kolaborator tidak ditemukan", 404)
    return _envelope(data)


@router.patch("/me")
def update_me(payload: PatchKolaboratorBody, user: dict = Depends(get_current_user)):
    data = update_profile(user, payload.model_dump(exclude_none=True))
    if not data:
        return _error_envelope("Kolaborator tidak ditemukan", 404)
    return _envelope(data)


# ── Portfolio (Karya) ───────────────────────────────────────────────────────

@router.get("/me/portofolio")
def list_portofolio(user: dict = Depends(get_current_user)):
    return _envelope(get_portfolio(user))


@router.post("/me/portofolio")
def create_portofolio(payload: CreateKaryaBody, user: dict = Depends(get_current_user)):
    data = create_portfolio(user, payload.model_dump())
    if not data:
        return _error_envelope("Gagal membuat portofolio", 500)
    return _envelope(data)


@router.patch("/me/portofolio/{item_id}")
def update_portofolio(item_id: str, payload: PatchKaryaBody, user: dict = Depends(get_current_user)):
    data = update_portfolio(user, item_id, payload.model_dump(exclude_none=True))
    if not data:
        return _error_envelope("Item portofolio tidak ditemukan", 404)
    return _envelope(data)


@router.delete("/me/portofolio/{item_id}")
def delete_portofolio(item_id: str, user: dict = Depends(get_current_user)):
    return _envelope(delete_portfolio(user, item_id), message="Item portofolio dihapus")


# ── Story ───────────────────────────────────────────────────────────────────

@router.get("/me/story")
def list_story(user: dict = Depends(get_current_user)):
    return _envelope(get_stories(user))


@router.post("/me/story")
def create_story_route(payload: CreateStoryBody, user: dict = Depends(get_current_user)):
    data = create_story(user, payload.model_dump())
    if not data:
        return _error_envelope("Gagal membuat story", 500)
    return _envelope(data)


@router.patch("/me/story/{story_id}")
def update_story_route(story_id: str, payload: PatchStoryBody, user: dict = Depends(get_current_user)):
    data = update_story(user, story_id, payload.model_dump(exclude_unset=True))
    if not data:
        return _error_envelope("Story tidak ditemukan", 404)
    return _envelope(data)


@router.delete("/me/story/{story_id}")
def delete_story_route(story_id: str, user: dict = Depends(get_current_user)):
    return _envelope(delete_story(user, story_id), message="Story dihapus")
