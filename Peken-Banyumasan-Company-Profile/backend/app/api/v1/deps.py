"""Service-level FastAPI dependencies (re-usable across routers).

Each function wires the AsyncSession into a service instance. Tests
override these directly via `app.dependency_overrides[get_xyz_service]`.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db_session
from app.services import (
    CompanyProfileService,
    PublicEventService,
    PublicKaryaService,
    PublicProfileService,
    PublicProgramService,
    PublicStatsService,
)

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]


def get_company_profile_service(session: SessionDep) -> CompanyProfileService:
    return CompanyProfileService(session)


def get_public_event_service(session: SessionDep) -> PublicEventService:
    return PublicEventService(session)


def get_public_karya_service(session: SessionDep) -> PublicKaryaService:
    return PublicKaryaService(session)


def get_public_profile_service(session: SessionDep) -> PublicProfileService:
    return PublicProfileService(session)


def get_public_program_service(session: SessionDep) -> PublicProgramService:
    return PublicProgramService(session)


def get_public_stats_service(session: SessionDep) -> PublicStatsService:
    return PublicStatsService(session)
