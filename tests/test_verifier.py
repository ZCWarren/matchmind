"""Verifier tests: deterministic gate, event-level evidence, and advisory review."""

from __future__ import annotations

from matchmind.agents.contracts import (
    Claim,
    InsightCandidate,
    MetricRef,
    VerificationResult,
)
from matchmind.agents.verifier import (
    fallback_cue,
    fallback_insight,
    merge_verifications,
    verify_cue,
    verify_deterministic,
)
from matchmind.analytics import build_snapshot, detect_moments, load_match

HERO = "ast-2026-1018-nhr-orn"


def _hero_inputs():
    bundle = load_match(HERO)
    hero_pass = next(
        event for event in bundle.events if event.type == "pass" and "hero" in event.tags
    )
    moment = next(m for m in detect_moments(bundle) if m.event_id == hero_pass.event_id)
    snapshot = build_snapshot(bundle, until_event_id=moment.event_id)
    events_by_id = {event.event_id: event for event in bundle.events}
    return bundle, moment, snapshot, events_by_id


def test_fallback_candidate_passes() -> None:
    _, moment, snapshot, events_by_id = _hero_inputs()
    candidate = fallback_insight(moment, snapshot)
    result = verify_deterministic(candidate, snapshot, moment, events_by_id)
    assert result.status == "pass"


def test_event_level_pressure_is_valid_evidence() -> None:
    _, moment, snapshot, events_by_id = _hero_inputs()
    candidate = fallback_insight(moment, snapshot)
    candidate.claims.append(
        Claim(
            text="The press applied 0.82 pressure on the ball carrier.",
            event_ids=[moment.event_id],
            metric_refs=[
                MetricRef(
                    name="event_pressure",
                    value=0.82,
                    formula_version="pressure-v1",
                    event_ids=[moment.event_id],
                )
            ],
        )
    )
    result = verify_deterministic(candidate, snapshot, moment, events_by_id)
    assert result.status == "pass"


def test_fastest_sprint_is_rejected() -> None:
    bundle = load_match(HERO)
    sprint = next(
        moment
        for moment in detect_moments(bundle)
        if moment.type == "sprint" and moment.metrics["event_speed"].value == 33.4
    )
    snapshot = build_snapshot(bundle, until_event_id=sprint.event_id)
    events_by_id = {event.event_id: event for event in bundle.events}
    candidate = InsightCandidate(
        moment_id=sprint.moment_id,
        match_id=HERO,
        headline="Sprint",
        why_it_matters="A sprint.",
        claims=[
            Claim(
                text="This was the fastest sprint of the match.",
                event_ids=[sprint.event_id],
                metric_refs=[
                    MetricRef(
                        name="event_speed",
                        value=33.4,
                        formula_version="speed-v1",
                        event_ids=[sprint.event_id],
                    )
                ],
            )
        ],
    )
    result = verify_deterministic(candidate, snapshot, sprint, events_by_id)
    assert result.status == "reject"
    assert any(issue.code == "unsupported_superlative" for issue in result.issues)


def test_model_review_is_advisory() -> None:
    _, moment, snapshot, events_by_id = _hero_inputs()
    candidate = fallback_insight(moment, snapshot)
    deterministic = verify_deterministic(candidate, snapshot, moment, events_by_id)
    model = VerificationResult(
        status="reject",
        issues=[],
        notes="model disagrees",
    )
    merged = merge_verifications(deterministic, model)
    assert merged.status == "pass"
    assert "advisory" in merged.notes

    reject = VerificationResult(status="reject", issues=[])
    merged_reject = merge_verifications(reject, VerificationResult(status="pass"))
    assert merged_reject.status == "reject"


def test_verification_contract_normalizes_model_json() -> None:
    result = VerificationResult.model_validate(
        {
            "status": "PASSED",
            "issues": ["style warning", {"message": "minor", "severity": "warning"}],
            "extra_field": "ignored",
        }
    )
    assert result.status == "pass"
    assert len(result.issues) == 2
    assert all(issue.severity == "warn" for issue in result.issues)


def test_cue_verifier_rejects_new_numbers() -> None:
    _, moment, snapshot, _ = _hero_inputs()
    candidate = fallback_insight(moment, snapshot)
    cue = fallback_cue(candidate)
    cue.payload["headline"] = "A 99.9 m pass changes the match"
    result = verify_cue(cue, candidate)
    assert result.status == "reject"
    assert result.issues[0].code == "unsupported_cue_number"


def test_model_revise_requests_bounded_revision() -> None:
    _, moment, snapshot, events_by_id = _hero_inputs()
    candidate = fallback_insight(moment, snapshot)
    deterministic = verify_deterministic(candidate, snapshot, moment, events_by_id)
    merged = merge_verifications(deterministic, VerificationResult(status="revise"))
    assert merged.status == "revise"
