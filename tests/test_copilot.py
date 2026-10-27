"""Live Copilot evidence validation and explicit degraded behavior."""

from __future__ import annotations

from fastapi.testclient import TestClient

from matchmind.agents import copilot
from matchmind.agents.blackboard import CopilotQA
from matchmind.agents.contracts import MetricRef
from matchmind.analytics import load_match
from matchmind.api.main import app
from matchmind.config import settings

HERO = "ast-2026-1018-nhr-orn"
EVENT_ID = "e-000974"


def _answer(**updates) -> CopilotQA:
    values = {
        "id": "live-test",
        "question": "How strong was the pressure?",
        "question_zh": "压迫强度是多少？",
        "answer": "The event carried 0.82 pressure.",
        "answer_zh": "该事件的压迫指数为 0.82。",
        "event_ids": [EVENT_ID],
        "metric_refs": [
            MetricRef(
                name="event_pressure",
                value=0.82,
                formula_version="event-v1",
                event_ids=[EVENT_ID],
            )
        ],
        "verified": True,
        "source": "live",
        "notice": "",
    }
    values.update(updates)
    return CopilotQA(**values)


def test_copilot_event_evidence_passes() -> None:
    bundle = load_match(HERO)
    event = next(event for event in bundle.events if event.event_id == EVENT_ID)
    answer = _answer(
        answer=f"The event carried {event.pressure:.2f} pressure.",
        answer_zh=f"该事件的压迫指数为 {event.pressure:.2f}。",
        metric_refs=[
            MetricRef(
                name="event_pressure",
                value=event.pressure,
                formula_version="event-v1",
                event_ids=[EVENT_ID],
            )
        ],
    )
    assert copilot.validate_copilot_answer(answer, bundle) == []


def test_copilot_rejects_unknown_event_and_unsupported_number() -> None:
    bundle = load_match(HERO)
    assert copilot.validate_copilot_answer(
        _answer(event_ids=["e-does-not-exist"]), bundle
    ) == ["Unknown event references: e-does-not-exist"]
    assert "English answer contains unsupported number 94.6" in copilot.validate_copilot_answer(
        _answer(answer="The pressure was 94.6."), bundle
    )


async def test_custom_copilot_uses_live_path(monkeypatch) -> None:
    async def fake_live(match_id: str, question: str, context: dict) -> CopilotQA:
        assert match_id == HERO
        assert question == "What changed after the pass?"
        assert context["story_arc"]
        return _answer(question=question)

    monkeypatch.setattr(copilot, "_run_live_copilot", fake_live)
    result = await copilot.answer_copilot_question(HERO, "What changed after the pass?")
    assert result.source == "live"


async def test_custom_copilot_does_not_fake_live_when_disabled(monkeypatch) -> None:
    monkeypatch.setattr(settings, "allow_live_generation", False)
    try:
        await copilot.answer_copilot_question(HERO, "A question with no preset")
    except RuntimeError as exc:
        assert "Live Copilot is disabled" in str(exc)
    else:
        raise AssertionError("disabled live Copilot should not return a fabricated answer")


async def test_exact_preset_does_not_need_live_generation(monkeypatch) -> None:
    monkeypatch.setattr(settings, "allow_live_generation", False)
    board = copilot.build_blackboard(HERO)
    result = await copilot.answer_copilot_question(HERO, board.copilot_presets[0].question)
    assert result.source == "preset"
    assert result.verified is True


def test_copilot_endpoint_awaits_live_answer(monkeypatch) -> None:
    async def fake_answer(match_id: str, question: str) -> CopilotQA:
        return _answer(question=question)

    monkeypatch.setattr("matchmind.api.insights.answer_copilot_question", fake_answer)
    response = TestClient(app).post(
        f"/api/matches/{HERO}/copilot", json={"question": "A live tactical question"}
    )
    assert response.status_code == 200
    assert response.json()["source"] == "live"
