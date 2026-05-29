"""Health endpoint smoke test."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient, override_session) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "peken-cp-api"
    assert body["version"] == "2.3.0"


def test_health_response_has_request_id_header(client: TestClient, override_session) -> None:
    resp = client.get("/health")
    # request_context middleware echoes back the request id
    assert "X-Request-Id" in resp.headers


def test_health_request_id_echo(client: TestClient, override_session) -> None:
    resp = client.get("/health", headers={"X-Request-Id": "abc-123"})
    assert resp.headers["X-Request-Id"] == "abc-123"
