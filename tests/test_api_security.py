"""API hardening: static path containment and bounded insight requests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from matchmind.api.main import app
from matchmind.api.security import live_rate_limiter
from matchmind.config import settings

client = TestClient(app)
HERO = "ast-2026-1018-nhr-orn"


def test_static_routes_do_not_escape_web_dist() -> None:
    for path in (
        "/../.env",
        "/%2e%2e/%2e%2e/etc/passwd",
        "/assets/../../src/matchmind/config.py",
    ):
        response = client.get(path)
        assert "DEEPSEEK_API_KEY" not in response.text, path
        assert "root:x:0:0" not in response.text, path


def test_insight_request_is_bounded() -> None:
    response = client.post(
        f"/api/matches/{HERO}/insights",
        json={
            "moment_id": "mo-e-000974",
            "profiles": ["analyst", "casual", "player", "analyst"],
            "languages": ["en"],
            "use_cache": True,
        },
    )
    assert response.status_code == 422


def test_live_endpoints_are_rate_limited(monkeypatch) -> None:
    live_rate_limiter.reset()
    monkeypatch.setattr(settings, "live_rate_limit_per_minute", 1)
    board = client.get(f"/api/matches/{HERO}/blackboard").json()
    question = board["copilot_presets"][0]["question"]
    first = client.post(f"/api/matches/{HERO}/copilot", json={"question": question})
    second = client.post(f"/api/matches/{HERO}/copilot", json={"question": question})
    live_rate_limiter.reset()
    assert first.status_code == 200
    assert second.status_code == 429
    assert int(second.headers["Retry-After"]) >= 1
