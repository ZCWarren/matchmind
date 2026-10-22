"""WebSocket replay contract tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from matchmind.analytics import load_match
from matchmind.api.main import app

HERO = "ast-2026-1018-nhr-orn"


def test_replay_streams_events_and_cached_insight() -> None:
    bundle = load_match(HERO)
    hero_pass = next(
        event for event in bundle.events if event.type == "pass" and "hero" in event.tags
    )
    client = TestClient(app)
    with client.websocket_connect(
        f"/ws/matches/{HERO}?speed=60&start_event_id={hero_pass.event_id}"
    ) as websocket:
        hello = websocket.receive_json()
        assert hello["type"] == "hello"
        assert hello["total"] == len(bundle.events)
        assert hello["insight_available"] is True

        event_message = websocket.receive_json()
        assert event_message["type"] == "event"
        assert event_message["event"]["event_id"] == hero_pass.event_id

        insight_message = websocket.receive_json()
        assert insight_message["type"] == "insight"
        assert insight_message["result"]["verification"]["status"] == "pass"
