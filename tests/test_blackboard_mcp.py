"""Tests for MatchBlackboard, story arc, hallucination lab, and tactical MCP tools."""

from __future__ import annotations

from fastapi.testclient import TestClient

from matchmind.api.main import app
from matchmind.mcp.server import get_pressure_comparison, get_tactical_chain

HERO = "ast-2026-1018-nhr-orn"


def test_mcp_tactical_chain_and_pressure_comparison() -> None:
    chain = get_tactical_chain(HERO, "e-000974", window_size=6)
    assert chain["match_id"] == HERO
    assert chain["anchor_event_id"] == "e-000974"
    assert chain["sequence_length"] >= 4
    assert len(chain["chain_event_ids"]) >= 4

    comparison = get_pressure_comparison(HERO, "e-000974")
    assert comparison["match_id"] == HERO
    assert comparison["event_pressure"] >= 0.8
    assert comparison["match_peak_speed_kmh"] > comparison["event_speed_kmh"]
    assert comparison["is_match_fastest_sprint"] is False


def test_blackboard_copilot_and_arc_endpoints() -> None:
    client = TestClient(app)
    board_res = client.get(f"/api/matches/{HERO}/blackboard")
    assert board_res.status_code == 200
    board = board_res.json()
    assert len(board["story_arc"]) == 3
    assert len(board["mcp_invocations"]) >= 4
    assert len(board["hallucination_challenges"]) >= 2
    assert len(board["copilot_presets"]) >= 3

    copilot_res = client.post(
        f"/api/matches/{HERO}/copilot",
        json={"question": board["copilot_presets"][1]["question"]},
    )
    assert copilot_res.status_code == 200
    answer = copilot_res.json()
    assert answer["verified"] is True
    assert len(answer["event_ids"]) >= 1

    first_arc_moment = board["story_arc"][0]["moment_id"]
    arc_res = client.get(f"/api/matches/{HERO}/arc/{first_arc_moment}")
    assert arc_res.status_code == 200
    arc_data = arc_res.json()
    assert arc_data["verification"]["status"] == "pass"
    assert len(arc_data["fan_cards"]) == 9
