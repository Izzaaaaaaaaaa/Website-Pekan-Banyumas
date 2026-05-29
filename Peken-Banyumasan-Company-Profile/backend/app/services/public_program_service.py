"""Public program listing service."""

from __future__ import annotations

from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import NotFoundError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.program_repo import ProgramRepository
from app.schemas.program import Program


class PublicProgramService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ProgramRepository(session)

    async def list_programs(self) -> list[Program]:
        rows = await self.repo.list_aktif()
        return [Program.model_validate(r) for r in rows]

    async def get_by_slug(self, slug: str) -> Program:
        row = await self.repo.get_aktif_by_slug(slug)
        if row is None:
            raise NotFoundError(ErrorMessages.NOT_FOUND)
        return Program.model_validate(row)
