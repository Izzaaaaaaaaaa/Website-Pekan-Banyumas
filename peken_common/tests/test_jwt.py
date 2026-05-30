"""Tests for the Supabase JWT decoder (HS256 secret + ES256/JWKS)."""

import base64
from datetime import UTC, datetime, timedelta

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from jose import jwt as jose_jwt

from peken_common.auth.jwt import CurrentUser, decode_jwt
from peken_common.errors import UnauthorizedError

_SECRET = "test-secret-do-not-use-in-prod-very-long-string-padding"


def _sign(claims: dict, secret: str = _SECRET) -> str:
    return jose_jwt.encode(claims, secret, algorithm="HS256")


def _now_ts() -> int:
    return int(datetime.now(UTC).timestamp())


# --- ES256 fixtures ----------------------------------------------------------
# Throwaway P-256 keypairs stand in for Supabase's asymmetric signing key.


def _gen_ec_private_pem() -> str:
    key = ec.generate_private_key(ec.SECP256R1())
    return key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()


def _public_jwk(private_pem: str, kid: str) -> dict:
    """Build the public JWK for an EC private key, shaped like a Supabase
    JWKS entry (kty/crv/x/y/kid)."""
    private = serialization.load_pem_private_key(private_pem.encode(), password=None)
    numbers = private.public_key().public_numbers()  # type: ignore[attr-defined]

    def _b64url(value: int) -> str:
        return base64.urlsafe_b64encode(value.to_bytes(32, "big")).rstrip(b"=").decode()

    return {
        "kty": "EC",
        "crv": "P-256",
        "alg": "ES256",
        "use": "sig",
        "kid": kid,
        "x": _b64url(numbers.x),
        "y": _b64url(numbers.y),
    }


_ES256_KID = "test-es256-key-1"
_EC_PRIVATE_PEM = _gen_ec_private_pem()
_EC_OTHER_PRIVATE_PEM = _gen_ec_private_pem()  # unrelated key, for signature-mismatch
_PUBLIC_JWK = _public_jwk(_EC_PRIVATE_PEM, _ES256_KID)
_FAKE_JWKS_URL = "https://test.supabase.co/auth/v1/.well-known/jwks.json"


def _sign_es256(
    claims: dict, *, private_pem: str = _EC_PRIVATE_PEM, kid: str = _ES256_KID
) -> str:
    return jose_jwt.encode(claims, private_pem, algorithm="ES256", headers={"kid": kid})


@pytest.fixture
def patched_jwks(monkeypatch: pytest.MonkeyPatch) -> None:
    """Stub the JWKS fetch so `decode_jwt` resolves to the test public key."""

    def _fake_fetch(jwks_url: str, *, force: bool = False) -> dict:
        return {_ES256_KID: _PUBLIC_JWK}

    monkeypatch.setattr("peken_common.auth.jwt._fetch_jwks", _fake_fetch)


class TestDecodeJwt:
    """HS256 path — verification against the shared project secret."""

    def test_valid_admin_token(self):
        token = _sign(
            {
                "sub": "user-uuid-123",
                "email": "admin@peken.test",
                "exp": _now_ts() + 3600,
                "app_metadata": {"role": "admin", "status": "aktif"},
            }
        )
        user = decode_jwt(token, _SECRET)
        assert isinstance(user, CurrentUser)
        assert user.id == "user-uuid-123"
        assert user.email == "admin@peken.test"
        assert user.role == "admin"
        assert user.status == "aktif"

    def test_artisan_pending(self):
        token = _sign(
            {
                "sub": "art-uuid",
                "email": "artisan@x.com",
                "exp": _now_ts() + 3600,
                "app_metadata": {"role": "artisan", "status": "pending"},
            }
        )
        user = decode_jwt(token, _SECRET)
        assert user.role == "artisan"
        assert user.status == "pending"

    def test_missing_app_metadata_yields_empty_role(self):
        token = _sign({"sub": "x", "exp": _now_ts() + 60})
        user = decode_jwt(token, _SECRET)
        assert user.role == ""
        assert user.status is None

    def test_expired_token_raises_unauthorized(self):
        token = _sign(
            {
                "sub": "u",
                "exp": _now_ts() - 60,
                "app_metadata": {"role": "admin"},
            }
        )
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET)

    def test_invalid_signature_raises(self):
        token = _sign({"sub": "u", "exp": _now_ts() + 60})
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, "wrong-secret-totally-different-from-original")

    def test_malformed_token_raises(self):
        with pytest.raises(UnauthorizedError):
            decode_jwt("not.a.valid.jwt", _SECRET)

    def test_missing_sub_raises(self):
        token = _sign({"exp": _now_ts() + 60})
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET)

    def test_immutable(self):
        token = _sign(
            {"sub": "u", "exp": _now_ts() + 60, "app_metadata": {"role": "admin"}}
        )
        user = decode_jwt(token, _SECRET)
        # frozen=True
        with pytest.raises(Exception):  # noqa: B017 — pydantic ValidationError or AttributeError
            user.role = "petugas"  # type: ignore[misc]


class TestDecodeJwtAsymmetric:
    """ES256 path — verification against the project JWKS (modern Supabase)."""

    def test_valid_es256_token(self, patched_jwks):
        token = _sign_es256(
            {
                "sub": "es-user-1",
                "email": "es@peken.test",
                "exp": _now_ts() + 3600,
                "app_metadata": {"role": "admin", "status": "aktif"},
            }
        )
        user = decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)
        assert isinstance(user, CurrentUser)
        assert user.id == "es-user-1"
        assert user.email == "es@peken.test"
        assert user.role == "admin"
        assert user.status == "aktif"

    def test_es256_status_none_allowed(self, patched_jwks):
        # Tokens issued before app_metadata.status is mirrored carry no status.
        token = _sign_es256(
            {
                "sub": "es-user-2",
                "email": "k@peken.test",
                "exp": _now_ts() + 3600,
                "app_metadata": {"role": "kolaborator"},
            }
        )
        user = decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)
        assert user.role == "kolaborator"
        assert user.status is None

    def test_es256_without_jwks_url_raises(self, patched_jwks):
        token = _sign_es256({"sub": "u", "exp": _now_ts() + 60})
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET)  # asymmetric token, no JWKS configured

    def test_es256_unknown_kid_raises(self, patched_jwks):
        token = _sign_es256({"sub": "u", "exp": _now_ts() + 60}, kid="not-in-jwks")
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)

    def test_es256_signature_mismatch_raises(self, patched_jwks):
        # Header advertises the known kid, but the token is signed by an
        # unrelated private key — signature verification must fail.
        token = _sign_es256(
            {"sub": "u", "exp": _now_ts() + 60},
            private_pem=_EC_OTHER_PRIVATE_PEM,
        )
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)

    def test_es256_expired_raises(self, patched_jwks):
        token = _sign_es256({"sub": "u", "exp": _now_ts() - 60})
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)

    def test_es256_missing_sub_raises(self, patched_jwks):
        token = _sign_es256({"exp": _now_ts() + 60})
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)

    def test_hs256_still_works_when_jwks_url_present(self):
        # A backend configured with a JWKS URL must still accept HS256 tokens.
        token = _sign(
            {
                "sub": "hs-user",
                "email": "a@b",
                "exp": _now_ts() + 60,
                "app_metadata": {"role": "admin"},
            }
        )
        user = decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)
        assert user.role == "admin"

    def test_unsupported_algorithm_raises(self):
        # HS512 is neither the HS256 path nor an asymmetric alg we accept.
        token = jose_jwt.encode(
            {"sub": "u", "exp": _now_ts() + 60}, _SECRET, algorithm="HS512"
        )
        with pytest.raises(UnauthorizedError):
            decode_jwt(token, _SECRET, jwks_url=_FAKE_JWKS_URL)


class TestCurrentUser:
    def test_construct(self):
        u = CurrentUser(id="x", email="a@b", role="admin", status="aktif")
        assert u.role == "admin"

    def test_status_optional(self):
        u = CurrentUser(id="x", email="a@b", role="admin")
        assert u.status is None

    def test_extra_fields_ignored(self):
        u = CurrentUser.model_validate(
            {
                "id": "x",
                "email": "a@b",
                "role": "admin",
                "status": "aktif",
                "unknown_field": "ignored",
            }
        )
        assert u.id == "x"

    def test_future_expiry(self):
        far_future = datetime.now(UTC) + timedelta(days=30)
        token = _sign(
            {
                "sub": "u",
                "exp": int(far_future.timestamp()),
                "app_metadata": {"role": "kolaborator", "status": "aktif"},
            }
        )
        user = decode_jwt(token, _SECRET)
        assert user.role == "kolaborator"
