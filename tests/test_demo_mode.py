"""Public demo mode: cached insights only, never a live model call."""

from __future__ import annotations

from fastapi.testclient import TestClient

from matchmind.analytics import detect_moments, load_match
from matchmind.api.main import app
from matchmind.config import settings

HERO = "ast-2026-1018-nhr-orn"


def test_public_demo_serves_cached_insight_only(monkeypatch) -> None:
    bundle = load_match(HERO)
    moment = next(
        item
        for item in detect_moments(bundle)
        if item.type == "line_break" and item.clock.minute >= 70
    )
    monkeypatch.setattr(settings, "allow_live_generation", False)
    client = TestClient(app)

    config = client.get("/api/config")
    assert config.status_code == 200
    assert "allow_live_generation" in config.json()

    cached = client.post(
        f"/api/matches/{HERO}/insights",
        json={
            "moment_id": moment.moment_id,
            "profiles": ["analyst", "casual", "player"],
            "languages": ["en", "es", "zh"],
            "use_cache": True,
        },
    )
    assert cached.status_code == 200
    assert cached.json()["verification"]["status"] == "pass"

    missing = client.post(
        f"/api/matches/{HERO}/insights",
        json={
            "moment_id": "mo-not-cached",
            "profiles": ["analyst"],
            "languages": ["en"],
            "use_cache": True,
        },
    )
    assert missing.status_code == 503
    assert "disabled" in missing.json()["detail"]
