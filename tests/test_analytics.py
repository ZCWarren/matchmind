"""Deterministic analytics tests with hand-checkable invariants."""

from __future__ import annotations

import pytest

from matchmind.analytics import build_snapshot, detect_moments, load_match
from matchmind.analytics.xg import shot_xg
from matchmind.analytics.xt import pass_xt_delta, xt
from matchmind.models.event import Location

HERO = "ast-2026-1018-nhr-orn"


def test_xg_increases_closer_to_goal_and_drops_under_pressure() -> None:
    close = shot_xg(Location(x=94.0, y=50.0), pressure=0.1)
    far = shot_xg(Location(x=70.0, y=50.0), pressure=0.1)
    pressured = shot_xg(Location(x=94.0, y=50.0), pressure=0.9)

    assert close > far
    assert close > pressured
    assert 0.01 <= far <= 0.9
    assert 0.01 <= close <= 0.9


def test_xt_grid_rewards_progression() -> None:
    deep = xt(Location(x=20.0, y=50.0))
    advanced = xt(Location(x=70.0, y=50.0))
    wide = xt(Location(x=70.0, y=5.0))
    assert advanced > deep
    assert advanced > wide

    bundle = load_match(HERO)
    hero_pass = next(
        event for event in bundle.events if event.type == "pass" and "hero" in event.tags
    )
    assert hero_pass.end_location is not None
    delta = pass_xt_delta(hero_pass.location, hero_pass.end_location)
    assert delta > 0.15


def test_snapshot_contains_evidence_and_core_metrics() -> None:
    bundle = load_match(HERO)
    snapshot = build_snapshot(bundle)
    metrics = snapshot.metrics

    for key in (
        "xg_home",
        "xg_away",
        "xt_home",
        "xt_away",
        "pressure",
        "control_home",
        "control_away",
        "chaos",
        "momentum",
        "pass_completion",
        "line_breaks",
        "top_speed",
        "sprint_count",
        "ball_speed",
        "shot_speed",
    ):
        assert key in metrics, key

    assert metrics["xg_home"].value > 0
    assert metrics["xg_away"].value > 0
    assert 0 <= metrics["control_home"].value <= 1
    assert 0 <= metrics["control_away"].value <= 1
    assert 0 <= metrics["chaos"].value <= 1
    assert -1 <= metrics["momentum"].value <= 1
    assert metrics["top_speed"].value == 33.8
    assert 10 <= metrics["line_breaks"].value <= 30

    event_ids = {event.event_id for event in bundle.events}
    for metric in metrics.values():
        assert set(metric.event_ids).issubset(event_ids)
        assert metric.formula_version


def test_snapshot_until_event_is_a_prefix() -> None:
    bundle = load_match(HERO)
    hero_pass = next(
        event for event in bundle.events if event.type == "pass" and "hero" in event.tags
    )
    snapshot = build_snapshot(bundle, until_event_id=hero_pass.event_id)
    assert snapshot.window_end_event == hero_pass.event_id
    assert snapshot.event_count < len(bundle.events)
    assert snapshot.clock.minute == 72

    with pytest.raises(ValueError):
        build_snapshot(bundle, until_event_id="e-does-not-exist")


def test_moments_include_hero_and_red_card() -> None:
    bundle = load_match(HERO)
    moments = detect_moments(bundle)
    hero_pass = next(
        event for event in bundle.events if event.type == "pass" and "hero" in event.tags
    )
    hero_moment = next(moment for moment in moments if moment.event_id == hero_pass.event_id)
    assert hero_moment.type == "line_break"
    assert hero_moment.metrics["xt_delta"].value > 0.15
    assert any(moment.type == "goal" for moment in moments)

    red_bundle = load_match("ast-2026-1101-orn-vel")
    red_moments = detect_moments(red_bundle)
    assert any(moment.type == "red_card" for moment in red_moments)


def test_load_unknown_match() -> None:
    with pytest.raises(FileNotFoundError):
        load_match("does-not-exist")
