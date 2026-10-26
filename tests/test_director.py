"""Director ranking, duplicate suppression, and deterministic airtime rules."""

from matchmind.agents.contracts import RundownDecision, VerificationResult
from matchmind.agents.director import (
    build_rundown,
    clock_seconds,
    is_duplicate,
    next_stoppage,
    normalize_decision,
)
from matchmind.analytics import detect_moments, load_match


def test_director_normalizes_ranking_and_airtime() -> None:
    bundle = load_match("ast-2026-1018-nhr-orn")
    moments = detect_moments(bundle)
    selected = next(moment for moment in moments if moment.event_id == "e-000974")
    alternatives = [moment for moment in moments if moment.moment_id != selected.moment_id]
    decision = RundownDecision(
        action="approve",
        reason="Verified tactical shift",
        ranked_moment_ids=[alternatives[0].moment_id, "invented-moment"],
    )
    normalized = normalize_decision(
        decision,
        VerificationResult(status="pass"),
        moments,
        selected,
        bundle.events,
    )
    assert normalized.ranked_moment_ids[0] == selected.moment_id
    assert "invented-moment" not in normalized.ranked_moment_ids
    assert normalized.air_at is not None
    assert clock_seconds(normalized.air_at) >= clock_seconds(selected.clock) + 15
    rundown = build_rundown(normalized, moments, selected)
    assert rundown[0].action == "approve"
    assert all(entry.action == "hold" for entry in rundown[1:])


def test_duplicate_window_and_stoppage_are_deterministic() -> None:
    bundle = load_match("ast-2026-1018-nhr-orn")
    moments = detect_moments(bundle)
    selected = next(moment for moment in moments if moment.event_id == "e-000974")
    nearby = selected.model_copy(
        update={
            "moment_id": "nearby-moment",
            "clock": selected.clock.model_copy(update={"second": 30}),
        }
    )
    assert is_duplicate(selected, nearby) is True
    air_at = next_stoppage(selected, bundle.events)
    event_types = {event.type for event in bundle.events if event.clock == air_at}
    assert event_types & {"foul", "card", "goal", "substitution", "half_time", "full_time"}


def test_failed_verification_cannot_be_approved() -> None:
    bundle = load_match("ast-2026-1018-nhr-orn")
    moments = detect_moments(bundle)
    selected = moments[0]
    decision = RundownDecision(action="approve", reason="Model attempted approval")
    normalized = normalize_decision(
        decision,
        VerificationResult(status="reject"),
        moments,
        selected,
        bundle.events,
    )
    assert normalized.action == "hold"
    assert normalized.air_at is None
