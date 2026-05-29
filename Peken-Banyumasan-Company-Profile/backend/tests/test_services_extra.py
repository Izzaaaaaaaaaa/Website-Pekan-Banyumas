"""Phase 11 service-level unit tests for the public Company Profile API.

Boosts coverage of the read-only service layer to the ≥80% bar required
by the plan. The router tests use stubbed services for HTTP-shape
assertions; these tests exercise the service code paths directly.

The polymorphic owner enrichment in `PublicKaryaService` is the trickiest
path — we mock `session.execute()` and supply a curated row-set.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, date, datetime, time
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest
from peken_common.errors import BadRequestError, NotFoundError

from app.schemas.karya import KaryaOwnerType
from app.services.company_profile_service import CompanyProfileService
from app.services.public_event_service import PublicEventService
from app.services.public_karya_service import PublicKaryaService
from app.services.public_profile_service import PublicProfileService
from app.services.public_program_service import PublicProgramService
from app.services.public_stats_service import PublicStatsService

_TEST_KOLAB_ID = UUID("00000000-0000-0000-0000-00000000b001")
_TEST_ARTISAN_ID = UUID("00000000-0000-0000-0000-00000000a001")
_TEST_KARYA_ID = UUID("00000000-0000-0000-0000-00000000ca01")
_TEST_STORY_ID = UUID("00000000-0000-0000-0000-00000000ce01")
_TEST_EVENT_ID = UUID("00000000-0000-0000-0000-00000000e001")
_TEST_PROGRAM_ID = UUID("00000000-0000-0000-0000-00000000d001")


# ---------------------------------------------------------------------------
# Lightweight ORM stand-ins
# ---------------------------------------------------------------------------


def _kolab_row(*, slug: str = "kol-test") -> SimpleNamespace:
    return SimpleNamespace(
        id=_TEST_KOLAB_ID,
        slug=slug,
        nama="Kol Test",
        kota="Banyumas",
        bio="Bio",
        foto_url=None,
        cover_url=None,
        subsektor=["Musik"],
        status="aktif",
    )


def _artisan_row(*, slug: str = "art-test") -> SimpleNamespace:
    return SimpleNamespace(
        id=_TEST_ARTISAN_ID,
        slug=slug,
        nama_usaha="Toko Test",
        kota="Banyumas",
        deskripsi="Deskripsi",
        foto_url=None,
        cover_url=None,
        kategori_usaha=["Kriya"],
        status="aktif",
    )


def _karya_row(
    *,
    owner_type: str = "kolaborator",
    owner_id: UUID = _TEST_KOLAB_ID,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=_TEST_KARYA_ID,
        judul="Karya",
        subsektor="Musik",
        deskripsi="",
        tahun=2026,
        gambar_url=None,
        featured=True,
        owner_type=owner_type,
        owner_id=owner_id,
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
        updated_at=datetime(2026, 1, 1, tzinfo=UTC),
    )


def _story_row() -> SimpleNamespace:
    return SimpleNamespace(
        id=_TEST_STORY_ID,
        konten="Konten",
        media_url=None,
        tags=[],
        like_count=0,
        status="aktif",
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
    )


def _event_row() -> SimpleNamespace:
    return SimpleNamespace(
        id=_TEST_EVENT_ID,
        nama="Event",
        slug="event-test",
        deskripsi="",
        lokasi="Banyumas",
        tanggal=date(2026, 6, 1),
        tanggal_mulai=date(2026, 6, 1),
        tanggal_selesai=date(2026, 6, 2),
        jam_mulai="08:00",
        jam_selesai="17:00",
        subsektor=["Musik"],
        status="published",
        peserta_count=0,
    )


def _program_row() -> SimpleNamespace:
    return SimpleNamespace(
        id=_TEST_PROGRAM_ID,
        nama="Program",
        slug="program-test",
        deskripsi="",
        gambar_url=None,
        aktif=True,
        urutan=1,
        konten_markdown="",
    )


# ---------------------------------------------------------------------------
# CompanyProfileService
# ---------------------------------------------------------------------------


class TestCompanyProfileService:
    @pytest.fixture
    def svc(self, fake_session: AsyncMock) -> CompanyProfileService:
        s = CompanyProfileService(fake_session)
        s.repo = AsyncMock()
        return s

    async def test_get_section_happy(self, svc: CompanyProfileService) -> None:
        svc.repo.get_section.return_value = SimpleNamespace(  # type: ignore[attr-defined]
            content={"hero": "Welcome"}
        )
        result = await svc.get_section("home")
        assert result == {"hero": "Welcome"}

    async def test_get_section_not_found(self, svc: CompanyProfileService) -> None:
        svc.repo.get_section.return_value = None  # type: ignore[attr-defined]
        with pytest.raises(NotFoundError):
            await svc.get_section("home")


# ---------------------------------------------------------------------------
# PublicEventService
# ---------------------------------------------------------------------------


class TestPublicEventService:
    @pytest.fixture
    def svc(self, fake_session: AsyncMock) -> PublicEventService:
        s = PublicEventService(fake_session)
        s.repo = AsyncMock()
        return s

    async def test_list_events(self, svc: PublicEventService) -> None:
        svc.repo.list_public.return_value = [_event_row(), _event_row()]  # type: ignore[attr-defined]
        result = await svc.list_events(status="published", limit=10)
        assert len(result) == 2

    async def test_list_events_with_date_range(
        self, svc: PublicEventService
    ) -> None:
        svc.repo.list_public.return_value = [_event_row()]  # type: ignore[attr-defined]
        result = await svc.list_events(
            date_from=date(2026, 1, 1), date_to=date(2026, 12, 31)
        )
        assert len(result) == 1

    async def test_list_upcoming(self, svc: PublicEventService) -> None:
        svc.repo.list_upcoming.return_value = [_event_row()]  # type: ignore[attr-defined]
        result = await svc.list_upcoming(limit=5)
        assert len(result) == 1


# ---------------------------------------------------------------------------
# PublicProgramService
# ---------------------------------------------------------------------------


class TestPublicProgramService:
    @pytest.fixture
    def svc(self, fake_session: AsyncMock) -> PublicProgramService:
        s = PublicProgramService(fake_session)
        s.repo = AsyncMock()
        return s

    async def test_list(self, svc: PublicProgramService) -> None:
        svc.repo.list_aktif.return_value = [_program_row()]  # type: ignore[attr-defined]
        result = await svc.list_programs()
        assert len(result) == 1

    async def test_get_by_slug_happy(self, svc: PublicProgramService) -> None:
        svc.repo.get_aktif_by_slug.return_value = _program_row()  # type: ignore[attr-defined]
        result = await svc.get_by_slug("program-test")
        assert result.slug == "program-test"

    async def test_get_by_slug_not_found(self, svc: PublicProgramService) -> None:
        svc.repo.get_aktif_by_slug.return_value = None  # type: ignore[attr-defined]
        with pytest.raises(NotFoundError):
            await svc.get_by_slug("nope")


# ---------------------------------------------------------------------------
# PublicStatsService
# ---------------------------------------------------------------------------


class TestPublicStatsService:
    @pytest.fixture
    def svc(self, fake_session: AsyncMock) -> PublicStatsService:
        s = PublicStatsService(fake_session)
        s.artisan_repo = AsyncMock()
        s.kolab_repo = AsyncMock()
        s.event_repo = AsyncMock()
        s.visitor_repo = AsyncMock()
        return s

    async def test_get_stats(self, svc: PublicStatsService) -> None:
        svc.artisan_repo.count_aktif.return_value = 5  # type: ignore[attr-defined]
        svc.kolab_repo.count_aktif.return_value = 7  # type: ignore[attr-defined]
        svc.event_repo.count_selesai_or_later.return_value = 3  # type: ignore[attr-defined]
        svc.visitor_repo.count_total.return_value = 1234  # type: ignore[attr-defined]
        result = await svc.get()
        assert result.artisan_aktif == 5
        assert result.kolaborator_aktif == 7
        assert result.edisi_count == 3
        assert result.pengunjung_total == 1234


# ---------------------------------------------------------------------------
# PublicKaryaService — the polymorphic enrichment path
# ---------------------------------------------------------------------------


def _make_execute_result(rows: list[tuple]) -> MagicMock:
    """Build a fake `await session.execute(stmt)` result whose `.all()` is rows."""
    result = MagicMock()
    result.all = MagicMock(return_value=rows)
    return result


class TestPublicKaryaService:
    @pytest.fixture
    def session(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture
    def svc(self, session: AsyncMock) -> PublicKaryaService:
        s = PublicKaryaService(session)
        s.repo = AsyncMock()
        return s

    async def test_list_karya_kolaborator_filter(
        self, svc: PublicKaryaService
    ) -> None:
        svc.repo.list_filtered.return_value = [  # type: ignore[attr-defined]
            _karya_row(owner_type="kolaborator", owner_id=_TEST_KOLAB_ID),
        ]
        # Two execute() calls: one for artisan_map (empty), one for kolab_map
        svc.session.execute.side_effect = [  # type: ignore[attr-defined]
            _make_execute_result([(_TEST_KOLAB_ID, "Kol Test", "kol-test")]),
        ]
        result = await svc.list_karya(kolaborator_id=_TEST_KOLAB_ID)
        assert len(result) == 1
        assert result[0].owner == "Kol Test"

    async def test_list_karya_artisan_filter(
        self, svc: PublicKaryaService
    ) -> None:
        svc.repo.list_filtered.return_value = [  # type: ignore[attr-defined]
            _karya_row(owner_type="artisan", owner_id=_TEST_ARTISAN_ID),
        ]
        svc.session.execute.side_effect = [  # type: ignore[attr-defined]
            _make_execute_result([(_TEST_ARTISAN_ID, "Toko", "art-test")]),
        ]
        result = await svc.list_karya(artisan_id=_TEST_ARTISAN_ID)
        assert result[0].owner == "Toko"

    async def test_list_karya_mixed_owners(
        self, svc: PublicKaryaService
    ) -> None:
        svc.repo.list_filtered.return_value = [  # type: ignore[attr-defined]
            _karya_row(owner_type="artisan", owner_id=_TEST_ARTISAN_ID),
            _karya_row(owner_type="kolaborator", owner_id=_TEST_KOLAB_ID),
        ]
        svc.session.execute.side_effect = [  # type: ignore[attr-defined]
            _make_execute_result([(_TEST_ARTISAN_ID, "Toko", "art-test")]),
            _make_execute_result([(_TEST_KOLAB_ID, "Kol Test", "kol-test")]),
        ]
        result = await svc.list_karya()
        owners = {r.owner for r in result}
        assert owners == {"Toko", "Kol Test"}

    async def test_list_karya_orphaned_dropped(
        self, svc: PublicKaryaService
    ) -> None:
        """Karya whose owner is missing is silently filtered (defense in depth)."""
        svc.repo.list_filtered.return_value = [  # type: ignore[attr-defined]
            _karya_row(owner_type="kolaborator", owner_id=_TEST_KOLAB_ID),
        ]
        # Empty lookup → orphaned row dropped from result.
        svc.session.execute.side_effect = [_make_execute_result([])]  # type: ignore[attr-defined]
        result = await svc.list_karya()
        assert result == []

    async def test_list_karya_empty(self, svc: PublicKaryaService) -> None:
        svc.repo.list_filtered.return_value = []  # type: ignore[attr-defined]
        result = await svc.list_karya()
        assert result == []

    async def test_list_karya_both_filters_rejected(
        self, svc: PublicKaryaService
    ) -> None:
        with pytest.raises(BadRequestError):
            await svc.list_karya(
                kolaborator_id=_TEST_KOLAB_ID, artisan_id=_TEST_ARTISAN_ID
            )

    async def test_list_featured_by_owner(self, svc: PublicKaryaService) -> None:
        svc.repo.list_featured_by_owner.return_value = [_karya_row()]  # type: ignore[attr-defined]
        svc.session.execute.side_effect = [  # type: ignore[attr-defined]
            _make_execute_result([(_TEST_KOLAB_ID, "Kol Test", "kol-test")]),
        ]
        result = await svc.list_featured_by_owner(
            owner_type=KaryaOwnerType.KOLABORATOR, owner_id=_TEST_KOLAB_ID
        )
        assert len(result) == 1


# ---------------------------------------------------------------------------
# PublicProfileService
# ---------------------------------------------------------------------------


class TestPublicProfileService:
    @pytest.fixture
    def session(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture
    def svc(self, session: AsyncMock) -> Iterator[PublicProfileService]:
        s = PublicProfileService(session)
        s.artisan_repo = AsyncMock()
        s.kolab_repo = AsyncMock()
        s.story_repo = AsyncMock()
        s.event_repo = AsyncMock()
        s.event_repo.list_joined_by_owner.return_value = []
        # Avoid invoking the karya service's real session.execute path
        s.karya_service = AsyncMock()
        s.karya_service.list_karya.return_value = []
        yield s

    async def test_get_by_slug_kolaborator(
        self, svc: PublicProfileService
    ) -> None:
        svc.kolab_repo.get_aktif_by_slug.return_value = _kolab_row()  # type: ignore[attr-defined]
        svc.story_repo.list_aktif_by_author.return_value = [_story_row()]  # type: ignore[attr-defined]
        svc.event_repo.list_joined_by_owner.return_value = [  # type: ignore[attr-defined]
            {
                "id": UUID("11111111-1111-1111-1111-111111111111"),
                "nama": "Event Test",
                "tanggal": date(2026, 5, 1),
                "tanggal_selesai": date(2026, 5, 3),
                "jam_mulai": time(9, 0),
                "jam_selesai": time(20, 0),
                "lokasi": "Purwokerto",
                "deskripsi": "",
                "status": "published",
                "peran": "peserta",
            }
        ]
        result = await svc.get_by_slug("kol-test")
        assert result.role.value == "kolaborator"
        assert len(result.story) == 1
        # GATE/CP fix: indicators read these — must reflect real counts + events.
        assert result.total_story == 1
        assert result.total_event == 1
        assert len(result.events) == 1
        assert result.events[0].nama == "Event Test"

    async def test_get_by_slug_artisan(self, svc: PublicProfileService) -> None:
        svc.kolab_repo.get_aktif_by_slug.return_value = None  # type: ignore[attr-defined]
        svc.artisan_repo.get_aktif_by_slug.return_value = _artisan_row()  # type: ignore[attr-defined]
        svc.story_repo.list_aktif_by_author.return_value = []  # type: ignore[attr-defined]
        result = await svc.get_by_slug("art-test")
        assert result.role.value == "artisan"
        assert result.bio == "Deskripsi"  # ← artisan's deskripsi mirrored as bio
        assert result.total_event == 0
        assert result.events == []

    async def test_get_by_slug_not_found(self, svc: PublicProfileService) -> None:
        svc.kolab_repo.get_aktif_by_slug.return_value = None  # type: ignore[attr-defined]
        svc.artisan_repo.get_aktif_by_slug.return_value = None  # type: ignore[attr-defined]
        with pytest.raises(NotFoundError):
            await svc.get_by_slug("nope")
