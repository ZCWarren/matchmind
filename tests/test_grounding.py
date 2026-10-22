"""Deterministic guard against generic or non-English broadcast headlines."""

from __future__ import annotations

from matchmind.agents.contracts import Claim, InsightCandidate
from matchmind.agents.grounding import ensure_grounded, grounded_insight, needs_grounding
from matchmind.analytics import detect_moments, load_match
from matchmind.analytics.engine import build_snapshot


def _candidate(moment_id: str, match_id: str, headline: str, why: str) -> InsightCandidate:
    return InsightCandidate(
        moment_id=moment_id,
        match_id=match_id,
        headline=headline,
        why_it_matters=why,
        claims=[Claim(text=headline, event_ids=[], confidence=0.5)],
    )


def test_grounding_replaces_generic_and_chinese() -> None:
    bundle = load_match("ast-2026-1025-vel-kep")
    moment = next(
        item
        for item in detect_moments(bundle)
        if item.type == "line_break" and item.clock.minute >= 70
    )
    snapshot = build_snapshot(bundle, until_event_id=moment.event_id)

    generic = _candidate(
        moment.moment_id,
        moment.match_id,
        "Line break under pressure",
        "Generic explanation.",
    )
    chinese = _candidate(
        moment.moment_id,
        moment.match_id,
        "VEL 突破防线",
        "这是一次突破。",
    )
    assert needs_grounding(generic, moment)
    assert needs_grounding(chinese, moment)

    grounded = grounded_insight(bundle, moment, snapshot)
    assert "breaks the" in grounded.headline
    assert " at " in grounded.headline
    assert grounded.headline != "Line break under pressure"

    kept = _candidate(
        moment.moment_id,
        moment.match_id,
        "Nestor Vale breaks the KEPLER line at 82:47",
        "A specific explanation.",
    )
    assert ensure_grounded(kept, bundle, moment, snapshot) is kept
