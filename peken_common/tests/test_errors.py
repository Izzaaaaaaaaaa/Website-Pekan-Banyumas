"""Tests for the AppError exception hierarchy."""

import pytest

from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import (
    AppError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    NotImplementedStub,
    UnauthorizedError,
    ValidationFailedError,
)


class TestAppErrorDefaults:
    def test_app_error_500(self):
        e = AppError()
        assert e.status_code == 500
        assert e.message == ErrorMessages.INTERNAL_ERROR
        assert e.errors is None

    def test_bad_request_400(self):
        e = BadRequestError()
        assert e.status_code == 400
        assert e.message == ErrorMessages.INVALID_REQUEST

    def test_unauthorized_401(self):
        e = UnauthorizedError()
        assert e.status_code == 401
        assert e.message == ErrorMessages.SESSION_EXPIRED

    def test_forbidden_403(self):
        e = ForbiddenError()
        assert e.status_code == 403
        assert e.message == ErrorMessages.FORBIDDEN

    def test_not_found_404(self):
        e = NotFoundError()
        assert e.status_code == 404
        assert e.message == ErrorMessages.NOT_FOUND

    def test_conflict_409(self):
        e = ConflictError()
        assert e.status_code == 409
        assert e.message == ErrorMessages.DUPLICATE_REQUEST

    def test_validation_422(self):
        e = ValidationFailedError()
        assert e.status_code == 422
        assert e.message == ErrorMessages.VALIDATION_FAILED

    def test_not_implemented_stub_501(self):
        e = NotImplementedStub()
        assert e.status_code == 501
        assert e.message == ErrorMessages.NOT_IMPLEMENTED


class TestCustomMessage:
    def test_override_message(self):
        e = NotFoundError("Event tidak ditemukan")
        assert e.message == "Event tidak ditemukan"
        assert e.status_code == 404

    def test_pass_errors_dict(self):
        e = ValidationFailedError("Validasi gagal", errors={"email": ["wajib diisi"]})
        assert e.errors == {"email": ["wajib diisi"]}


class TestIsException:
    def test_can_be_raised_and_caught(self):
        with pytest.raises(NotFoundError):
            raise NotFoundError("Artisan tidak ditemukan")

    def test_subclass_relationship(self):
        # All subclasses inherit from AppError
        with pytest.raises(AppError):
            raise ForbiddenError()


class TestOtpStub:
    def test_stub_message(self):
        e = NotImplementedStub("OTP gateway belum dikonfigurasi")
        assert e.status_code == 501
        assert e.message == "OTP gateway belum dikonfigurasi"
