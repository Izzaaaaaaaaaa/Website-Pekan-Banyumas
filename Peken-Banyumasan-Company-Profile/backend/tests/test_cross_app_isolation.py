"""Phase 11 — Cross-app isolation for the Company Profile (CP) API.

CP is the PUBLIC read-only backend. Unlike Gate/UMKM/Kolaborator, it MUST
have **zero** authenticated routes — admin/petugas/artisan/kolaborator JWTs
have no meaning here and the API never inspects the Authorization header.

This test asserts the inverse claim: no route in the CP app pulls in a
peken_common auth dependency. It catches regression where a future PR
accidentally adds `Depends(require_role)` to a CP endpoint.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from fastapi.routing import APIRoute

from app.main import app


def _walk_dep_callables(dependant: Any) -> Iterator[Any]:
    yield dependant.call
    for sub in dependant.dependencies:
        yield from _walk_dep_callables(sub)


def _route_pulls_auth_dep(route: APIRoute) -> bool:
    """Return True if any dep in this route's tree is defined in peken_common.auth.*"""
    for call in _walk_dep_callables(route.dependant):
        module = getattr(call, "__module__", "") or ""
        if module.startswith("peken_common.auth"):
            return True
    return False


def test_no_route_uses_auth_dependencies() -> None:
    """Every CP route must be public — no peken_common.auth.* in any dep tree."""
    offenders = [
        f"{sorted(route.methods or [])} {route.path}"
        for route in app.routes
        if isinstance(route, APIRoute) and _route_pulls_auth_dep(route)
    ]
    assert offenders == [], (
        "Company Profile is the PUBLIC backend — these routes pulled an auth "
        f"dependency by mistake: {offenders}"
    )


def test_route_count_sane() -> None:
    """Sanity: CP currently exposes 8 public endpoints + /health (Phase 2)."""
    routes = [r for r in app.routes if isinstance(r, APIRoute)]
    assert len(routes) >= 8, (
        f"Expected at least 8 public CP routes, found {len(routes)}. "
        "Did Phase 2 endpoint inventory drift?"
    )
