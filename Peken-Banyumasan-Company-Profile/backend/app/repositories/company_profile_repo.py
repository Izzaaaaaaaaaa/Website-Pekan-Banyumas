"""Company profile section reader (opaque JSONB)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.company_profile_section import CompanyProfileSection


class CompanyProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_section(self, section: str) -> CompanyProfileSection | None:
        stmt = select(CompanyProfileSection).where(CompanyProfileSection.section == section)
        return (await self.session.scalars(stmt)).one_or_none()
