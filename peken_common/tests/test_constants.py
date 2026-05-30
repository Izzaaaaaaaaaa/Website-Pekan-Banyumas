"""Tests for canonical constants — UMKM 9 and BEKRAF 17 must NEVER regress."""

from peken_common.constants.error_messages import ErrorMessages
from peken_common.constants.kategori_usaha import KATEGORI_USAHA, UMKM_9
from peken_common.constants.subsektor import BEKRAF_17, SUBSEKTOR


class TestKategoriUsaha:
    def test_size_is_9(self):
        assert len(KATEGORI_USAHA) == 9
        assert len(UMKM_9) == 9

    def test_required_values_present(self):
        # Spot-check critical / commonly-missed values
        assert "F&B / Kuliner" in UMKM_9
        assert "Kriya" in UMKM_9
        assert "Lainnya" in UMKM_9

    def test_subsektor_terms_not_aliased(self):
        # The two lists overlap on a few terms (Kriya, Fashion, Lainnya),
        # but Musik / Seni Pertunjukan must NEVER appear in UMKM.
        bekraf_only = {"Musik", "Seni Pertunjukan", "Arsitektur", "Periklanan"}
        assert UMKM_9.isdisjoint(bekraf_only)

    def test_order_matches_frontend(self):
        # FE relies on order for select-box display
        expected_order = (
            "F&B / Kuliner",
            "Kriya",
            "Fashion",
            "Kosmetik",
            "Furnitur",
            "Aksesoris",
            "Pertanian",
            "Peternakan",
            "Lainnya",
        )
        assert expected_order == KATEGORI_USAHA

    def test_immutable(self):
        # frozenset is immutable
        import pytest

        with pytest.raises(AttributeError):
            UMKM_9.add("HackedValue")  # type: ignore[attr-defined]


class TestSubsektor:
    def test_size_is_17(self):
        assert len(SUBSEKTOR) == 17
        assert len(BEKRAF_17) == 17

    def test_required_values_present(self):
        for v in (
            "Kuliner",
            "Musik",
            "Seni Pertunjukan",
            "Film & Animasi",
            "Aplikasi Digital",
            "Riset & Pengembangan",
            "Lainnya",
        ):
            assert v in BEKRAF_17

    def test_artisan_terms_not_aliased(self):
        # `F&B / Kuliner` is artisan-only; BEKRAF uses just `Kuliner`
        assert "F&B / Kuliner" not in BEKRAF_17
        # `Kosmetik`, `Furnitur`, `Aksesoris`, `Pertanian`, `Peternakan`
        # are artisan-only
        artisan_only = {"Kosmetik", "Furnitur", "Aksesoris", "Pertanian", "Peternakan"}
        assert BEKRAF_17.isdisjoint(artisan_only)

    def test_order_matches_frontend(self):
        expected_order = (
            "Kuliner",
            "Kriya",
            "Fashion",
            "Musik",
            "Seni Pertunjukan",
            "Film & Animasi",
            "Fotografi",
            "Desain Produk",
            "Arsitektur",
            "Periklanan",
            "Penerbitan",
            "Seni Rupa",
            "Televisi & Radio",
            "Game",
            "Aplikasi Digital",
            "Riset & Pengembangan",
            "Lainnya",
        )
        assert expected_order == SUBSEKTOR


class TestErrorMessages:
    def test_canonical_strings_present(self):
        # These exact strings appear in OpenAPI specs and must match
        assert ErrorMessages.SESSION_EXPIRED == "Sesi Anda telah berakhir"
        assert ErrorMessages.FORBIDDEN == "Anda tidak memiliki akses"
        assert ErrorMessages.NOT_FOUND == "Sumber daya tidak ditemukan"
        assert ErrorMessages.EMAIL_REGISTERED == "Email sudah terdaftar"
        assert ErrorMessages.USERNAME_TAKEN == "Username sudah digunakan"
        assert ErrorMessages.VALIDATION_FAILED == "Validasi gagal"
        assert ErrorMessages.NOT_IMPLEMENTED == "Fitur belum tersedia"
