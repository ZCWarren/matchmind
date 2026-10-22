"""Deterministic match recap contract."""

from __future__ import annotations

from fastapi.testclient import TestClient

from matchmind.analytics import load_match
from matchmind.analytics.recap import build_recap
from matchmind.api.main import app

HERO = "ast-2026-1018-nhr-orn"


def test_recap_has_score_goals_and_hero_moment() -> None:
    recap = build_recap(load_match(HERO))
    assert recap.title == "Nova Harbor 2-1 Orion North"
    assert recap.final_score == {"home": 2, "away": 1}
    assert "beat Orion North" in recap.summary
    assert any(moment.clock.minute == 72 for moment in recap.key_moments)
    assert recap.top_speed_kmh == 33.8
    assert recap.generated_by == "recap-v1"


def test_recap_endpoint() -> None:
    client = TestClient(app)
    response = client.get(f"/api/matches/{HERO}/recap")
    assert response.status_code == 200
    body = response.json()
    assert body["final_score"] == {"home": 2, "away": 1}
    assert len(body["key_moments"]) >= 4
