"""Company profile section reader — opaque JSONB content passthrough."""

from __future__ import annotations

from typing import Any

from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import NotFoundError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.company_profile_repo import CompanyProfileRepository


class CompanyProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = CompanyProfileRepository(session)

    async def get_section(self, section: str) -> dict[str, Any]:
        row = await self.repo.get_section(section)
        if row is None:
            raise NotFoundError(ErrorMessages.NOT_FOUND)
        # Pass JSONB content through verbatim — its shape is FE-driven.
        return row.content
