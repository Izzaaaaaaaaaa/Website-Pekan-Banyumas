"""Public CP endpoints (8 routes) — see openapi-companyprof.yaml v2.3.0.

All routes are GET, unauthenticated, and emit the standard envelope.
Services are injected via FastAPI dependencies so tests can override.
"""

from __future__ import annotations

from datetime import date
from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query
from peken_common.envelope import success
from peken_common.schemas.enums import CpSection

from app.api.v1.deps import (
    get_company_profile_service,
    get_public_event_service,
    get_public_karya_service,
    get_public_profile_service,
    get_public_program_service,
    get_public_stats_service,
)
from app.services import (
    CompanyProfileService,
    PublicEventService,
    PublicKaryaService,
    PublicProfileService,
    PublicProgramService,
    PublicStatsService,
)

router = APIRouter(prefix="/api/public", tags=["public"])


class PublicEventStatus(StrEnum):
    """Public-only subset of `events.status` (drops `draft`)."""

    PUBLISHED = "published"
    BERLANGSUNG = "berlangsung"
    SELESAI = "selesai"


# ---------------------------------------------------------------------------
# 1. /api/public/company-profile?section=...
# ---------------------------------------------------------------------------


@router.get("/company-profile")
async def get_company_profile_section(
    section: Annotated[CpSection, Query(description="Section name (one of 6)")],
    svc: CompanyProfileService = Depends(get_company_profile_service),
) -> dict[str, Any]:
    content = await svc.get_section(section.value)
    return success(content)


# ---------------------------------------------------------------------------
# 2. /api/public/programs
# 3. /api/public/programs/{slug}
# ---------------------------------------------------------------------------


@router.get("/programs")
async def list_public_programs(
    svc: PublicProgramService = Depends(get_public_program_service),
) -> dict[str, Any]:
    items = await svc.list_programs()
    return success([p.model_dump(mode="json") for p in items])


@router.get("/programs/{slug}")
async def get_public_program(
    slug: Annotated[str, Path(description="URL-safe slug")],
    svc: PublicProgramService = Depends(get_public_program_service),
) -> dict[str, Any]:
    item = await svc.get_by_slug(slug)
    return success(item.model_dump(mode="json"))


# ---------------------------------------------------------------------------
# 4. /api/public/karya?subsektor=&featured=&limit=&kolaborator_id=&artisan_id=
# ---------------------------------------------------------------------------


@router.get("/karya")
async def list_public_karya(
    subsektor: Annotated[str | None, Query()] = None,
    featured: Annotated[bool | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    kolaborator_id: Annotated[UUID | None, Query()] = None,
    artisan_id: Annotated[UUID | None, Query()] = None,
    svc: PublicKaryaService = Depends(get_public_karya_service),
) -> dict[str, Any]:
    items = await svc.list_karya(
        subsektor=subsektor,
        featured=featured,
        kolaborator_id=kolaborator_id,
        artisan_id=artisan_id,
        limit=limit,
    )
    return success([k.model_dump(mode="json") for k in items])


# ---------------------------------------------------------------------------
# 5. /api/public/profiles/{slug}
# ---------------------------------------------------------------------------


@router.get("/profiles/{slug}")
async def get_public_profile(
    slug: Annotated[str, Path(description="Profile slug")],
    svc: PublicProfileService = Depends(get_public_profile_service),
) -> dict[str, Any]:
    profile = await svc.get_by_slug(slug)
    return success(profile.model_dump(mode="json"))


# ---------------------------------------------------------------------------
# 6. /api/public/events?status=&limit=&from=&to=
# 7. /api/public/events/upcoming?limit=
# ---------------------------------------------------------------------------


@router.get("/events/upcoming")
async def list_public_events_upcoming(
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
    svc: PublicEventService = Depends(get_public_event_service),
) -> dict[str, Any]:
    # Defined BEFORE the generic /events handler so FastAPI matches
    # the more specific path first.
    items = await svc.list_upcoming(limit=limit)
    return success([e.model_dump(mode="json") for e in items])


@router.get("/events")
async def list_public_events(
    status: Annotated[PublicEventStatus | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    date_from: Annotated[date | None, Query(alias="from")] = None,
    date_to: Annotated[date | None, Query(alias="to")] = None,
    svc: PublicEventService = Depends(get_public_event_service),
) -> dict[str, Any]:
    items = await svc.list_events(
        status=status.value if status else None,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )
    return success([e.model_dump(mode="json") for e in items])


# ---------------------------------------------------------------------------
# 8. /api/public/stats
# ---------------------------------------------------------------------------


@router.get("/stats")
async def get_public_stats(
    svc: PublicStatsService = Depends(get_public_stats_service),
) -> dict[str, Any]:
    stats = await svc.get()
    return success(stats.model_dump(mode="json"))
