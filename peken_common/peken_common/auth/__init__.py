"""Authentication layer — Supabase JWT decode + FastAPI deps + Admin SDK.

Per-app wires the secret + admin client in its `app/core/dependencies.py`;
peken_common provides decoupled primitives and a factory for the
`get_current_user` dependency.
"""

from peken_common.auth.dependencies import make_get_current_user, require_role
from peken_common.auth.jwt import CurrentUser, decode_jwt
from peken_common.auth.otp_service import OtpGateway, OtpService, StubOtpGateway
from peken_common.auth.supabase_admin import SupabaseAdminClient

__all__ = [
    "CurrentUser",
    "OtpGateway",
    "OtpService",
    "StubOtpGateway",
    "SupabaseAdminClient",
    "decode_jwt",
    "make_get_current_user",
    "require_role",
]
