"""Tests for response envelope builders + Pydantic models."""

from peken_common.envelope import error_payload, success
from peken_common.schemas.envelope import Envelope, ErrorEnvelope


class TestSuccess:
    def test_with_data(self):
        result = success({"id": 1, "name": "Budi"})
        assert result == {"status": "success", "message": None, "data": {"id": 1, "name": "Budi"}}

    def test_with_none_data(self):
        result = success(None)
        assert result == {"status": "success", "message": None, "data": None}

    def test_with_message(self):
        result = success({"id": 1}, message="Berhasil disimpan")
        assert result["message"] == "Berhasil disimpan"
        assert result["status"] == "success"

    def test_list_data(self):
        result = success([1, 2, 3])
        assert result["data"] == [1, 2, 3]


class TestErrorPayload:
    def test_minimal(self):
        result = error_payload("Sesi Anda telah berakhir")
        assert result == {
            "status": "error",
            "message": "Sesi Anda telah berakhir",
            "data": None,
        }
        assert "errors" not in result

    def test_with_errors(self):
        result = error_payload("Validasi gagal", {"email": ["wajib diisi"]})
        assert result["status"] == "error"
        assert result["message"] == "Validasi gagal"
        assert result["data"] is None
        assert result["errors"] == {"email": ["wajib diisi"]}

    def test_empty_errors_dict_treated_as_none(self):
        # error_payload only includes `errors` if truthy
        result = error_payload("Validasi gagal", errors={})
        assert "errors" not in result


class TestEnvelopeModel:
    def test_success_envelope_parses(self):
        env = Envelope[dict].model_validate(
            {"status": "success", "message": None, "data": {"id": "abc"}}
        )
        assert env.status == "success"
        assert env.data == {"id": "abc"}

    def test_success_default_status(self):
        env: Envelope[dict] = Envelope(data={"x": 1})
        assert env.status == "success"

    def test_error_envelope_parses(self):
        err = ErrorEnvelope.model_validate(
            {"status": "error", "message": "Sumber daya tidak ditemukan", "data": None}
        )
        assert err.message == "Sumber daya tidak ditemukan"
        assert err.errors is None

    def test_error_envelope_with_field_errors(self):
        err = ErrorEnvelope.model_validate(
            {
                "status": "error",
                "message": "Validasi gagal",
                "data": None,
                "errors": {"email": ["Format email tidak valid"]},
            }
        )
        assert err.errors == {"email": ["Format email tidak valid"]}
