"""Tests for Pydantic kategori / subsektor whitelist validators."""

import pytest
from pydantic import BaseModel, ValidationError

from peken_common.schemas.enums import KategoriUsahaList, SubsektorList, SubsektorStr


class ArtisanFields(BaseModel):
    kategori_usaha: KategoriUsahaList


class KolaboratorFields(BaseModel):
    subsektor: SubsektorList


class KaryaFields(BaseModel):
    subsektor: SubsektorStr


class TestKategoriUsahaList:
    def test_valid_subset(self):
        m = ArtisanFields(kategori_usaha=["Kriya", "Fashion"])
        assert m.kategori_usaha == ["Kriya", "Fashion"]

    def test_all_9_valid(self):
        m = ArtisanFields(
            kategori_usaha=[
                "F&B / Kuliner",
                "Kriya",
                "Fashion",
                "Kosmetik",
                "Furnitur",
                "Aksesoris",
                "Pertanian",
                "Peternakan",
                "Lainnya",
            ]
        )
        assert len(m.kategori_usaha) == 9

    def test_empty_list_allowed(self):
        # No items means nothing to validate; Pydantic should accept.
        m = ArtisanFields(kategori_usaha=[])
        assert m.kategori_usaha == []

    def test_invalid_value_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            ArtisanFields(kategori_usaha=["Kriya", "Bukan Kategori"])
        assert "kategori_usaha tidak valid" in str(exc_info.value)

    def test_subsektor_alias_rejected(self):
        # Critical invariant — artisans MUST NOT use BEKRAF terms
        with pytest.raises(ValidationError):
            ArtisanFields(kategori_usaha=["Musik"])

    def test_non_list_rejected(self):
        with pytest.raises(ValidationError):
            ArtisanFields(kategori_usaha="Kriya")  # type: ignore[arg-type]

    def test_non_string_element_rejected(self):
        with pytest.raises(ValidationError):
            ArtisanFields(kategori_usaha=["Kriya", 123])  # type: ignore[list-item]


class TestSubsektorList:
    def test_valid_subset(self):
        m = KolaboratorFields(subsektor=["Musik", "Film & Animasi"])
        assert m.subsektor == ["Musik", "Film & Animasi"]

    def test_all_17_valid(self):
        m = KolaboratorFields(
            subsektor=[
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
            ]
        )
        assert len(m.subsektor) == 17

    def test_invalid_value_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            KolaboratorFields(subsektor=["Musik", "Bukan Subsektor"])
        assert "subsektor tidak valid" in str(exc_info.value)

    def test_artisan_alias_rejected(self):
        # `F&B / Kuliner` is UMKM-only; BEKRAF uses bare `Kuliner`
        with pytest.raises(ValidationError):
            KolaboratorFields(subsektor=["F&B / Kuliner"])

    def test_kosmetik_rejected_for_bekraf(self):
        # `Kosmetik` is artisan-only
        with pytest.raises(ValidationError):
            KolaboratorFields(subsektor=["Kosmetik"])


class TestSubsektorStr:
    def test_valid_singular(self):
        m = KaryaFields(subsektor="Musik")
        assert m.subsektor == "Musik"

    def test_invalid_value_rejected(self):
        with pytest.raises(ValidationError):
            KaryaFields(subsektor="Bukan Subsektor")

    def test_artisan_term_rejected(self):
        with pytest.raises(ValidationError):
            KaryaFields(subsektor="Kosmetik")

    def test_list_rejected(self):
        # SINGULAR string — array NOT allowed (matches DB column type)
        with pytest.raises(ValidationError):
            KaryaFields(subsektor=["Musik"])  # type: ignore[arg-type]
