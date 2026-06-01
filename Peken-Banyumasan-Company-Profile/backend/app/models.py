from pydantic import BaseModel
from typing import Optional


class Stats(BaseModel):
    karya: int
    story: int
    event: int


class Karya(BaseModel):
    id: str
    judul: str
    img: Optional[str]
    subsektor: str
    tahun: str
    deskripsi: str


class Story(BaseModel):
    id: str
    konten: str
    tanggal: str


class Event(BaseModel):
    id: str
    nama: str
    tanggal: str
    lokasi: str
    status: str
    peran: str
    deskripsi: str


class Profile(BaseModel):
    id: str
    slug: str
    nama: str
    role: str
    subsektor: list[str]
    kota: str
    verified: bool
    foto: Optional[str]
    cover: Optional[str]
    bio: str
    tahun_bergabung: str
    stats: Stats
    karya: list[Karya]
    story: list[Story]
    events: list[Event]


class Work(BaseModel):
    id: str
    title: str
    owner: str
    role: str
    year: str
    img: str
    description: str


class Program(BaseModel):
    n: str
    title: str
    img: str
    body: str
