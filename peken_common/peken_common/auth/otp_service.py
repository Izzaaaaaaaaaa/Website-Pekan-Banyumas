"""OTP service — port/adapter pattern (plan §14, Decision Log D-05).

Three actors:
1. `OtpGateway` (Protocol) — outbound port (WA / SMS provider).
2. `OtpService` — orchestrates code generation + storage + send.
3. `StubOtpGateway` — adapter that raises 501. Swapped in for Fonnte /
   Twilio later by changing one DI line in `app/core/dependencies.py`.

`OtpService` requires a repository abstraction (`OtpCodeRepository`) so
peken_common doesn't depend on per-app ORM models. The repo Protocol
below is the contract per-app implementations must satisfy.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Protocol, runtime_checkable

from peken_common.constants.error_messages import ErrorMessages
from peken_common.errors import BadRequestError, NotImplementedStub
from peken_common.lib.timezone import now_utc

_OTP_TTL = timedelta(minutes=5)
_OTP_DIGITS = 6


@runtime_checkable
class OtpGateway(Protocol):
    """Outbound port: send a code to a phone number."""

    async def send_otp(self, phone: str, code: str) -> None: ...


@runtime_checkable
class OtpCodeRepository(Protocol):
    """Per-app implementation (UMKM/Kolaborator) backed by `otp_codes` table.

    `purpose` is one of `password_reset`, `verify`, `register`
    (`OtpPurpose` enum). `expires_at` is UTC.
    """

    async def create(
        self,
        *,
        phone: str,
        code: str,
        purpose: str,
        expires_at: datetime,
    ) -> None: ...

    async def consume(self, *, phone: str, code: str, purpose: str) -> bool:
        """Atomically validate + delete a matching unexpired code.

        Returns True if the code matched; False otherwise.
        """
        ...


class StubOtpGateway:
    """Adapter that raises 501 — OTP not wired up yet.

    Swap to FonnteOtpGateway / TwilioOtpGateway in `app/core/dependencies.py`
    when ready. No other code changes needed.
    """

    async def send_otp(self, phone: str, code: str) -> None:
        raise NotImplementedStub(ErrorMessages.OTP_GATEWAY_DISABLED)


class OtpService:
    """Use case: request + verify OTP for a given phone + purpose.

    Code generation is `secrets.randbelow(10**6)` → zero-padded
    6-digit string. Cryptographically uniform.
    """

    def __init__(self, repo: OtpCodeRepository, gateway: OtpGateway) -> None:
        self.repo = repo
        self.gateway = gateway

    @staticmethod
    def _generate_code() -> str:
        n = secrets.randbelow(10**_OTP_DIGITS)
        return f"{n:0{_OTP_DIGITS}d}"

    async def request(self, phone: str, purpose: str) -> None:
        """Generate, store, and dispatch a fresh OTP.

        Raises `BadRequestError` if phone is empty. Raises whatever the
        gateway raises (e.g., `NotImplementedStub` for the stub).
        """
        if not phone:
            raise BadRequestError("Nomor HP wajib diisi")
        code = self._generate_code()
        await self.repo.create(
            phone=phone,
            code=code,
            purpose=purpose,
            expires_at=now_utc() + _OTP_TTL,
        )
        await self.gateway.send_otp(phone, code)

    async def verify(self, phone: str, code: str, purpose: str) -> bool:
        """Return True iff the code matches an unexpired entry for the
        same (phone, purpose). The match is consumed (single-use).
        """
        if not phone or not code:
            return False
        return await self.repo.consume(phone=phone, code=code, purpose=purpose)


__all__ = ["OtpCodeRepository", "OtpGateway", "OtpService", "StubOtpGateway"]
