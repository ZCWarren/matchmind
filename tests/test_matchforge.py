"""MatchForge tests: all fixtures, determinism, hero evidence, and output files."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from matchmind.matchforge import FIXTURES, generate_all, generate_match
from matchmind.models.event import Event

EXPECTED_SCORES = {
    "ast-2026-1018-nhr-orn": (2, 1),
    "ast-2026-1025-vel-kep": (3, 2),
    "ast-2026-1101-orn-vel": (1, 1),
    "ast-2026-1108-kep-nhr": (0, 2),
    "ast-2026-1115-nhr-vel": (3, 3),
}


def test_all_fixtures_generate_realistic_matches() -> None:
    for fixture in FIXTURES:
        bundle = generate_match(fixture.match_id)
        events = bundle.events
        types = Counter(event.type for event in events)
        passes = [event for event in events if event.type == "pass"]
        completion = sum(event.outcome == "complete" for event in passes) / len(passes)

        assert 1100 <= len(events) <= 1500, fixture.match_id
        assert events[0].type == "kickoff"
        assert events[-1].type == "full_time"
        assert (bundle.match.final_score.home, bundle.match.final_score.away) == (
            EXPECTED_SCORES[fixture.match_id]
        )
        assert len(bundle.match.lineups) == 32
        assert len(bundle.labels) >= 2
        assert 0.75 <= completion <= 0.88
        assert 16 <= types["shot"] <= 32
        assert 15 <= types["foul"] <= 35
        assert 1 <= types["card"] <= 7
        assert 0 <= types["goal"] <= 6

        ids = [event.event_id for event in events]
        assert len(ids) == len(set(ids))
        all_ids = set(ids)
        for label in bundle.labels:
            assert label.event_ids
            assert all(event_id in all_ids for event_id in label.event_ids)

        seconds = [event.clock.minute * 60 + event.clock.second for event in events]
        assert all(later >= earlier for earlier, later in zip(seconds, seconds[1:], strict=False))


def test_hero_moment_evidence() -> None:
    bundle = generate_match("ast-2026-1018-nhr-orn")
    hero = next(label for label in bundle.labels if label.moment_id == "m-072-01")
    assert hero.type == "line_break_under_press"
    assert hero.importance > 0.9

    by_id = {event.event_id: event for event in bundle.events}
    assert all(event_id in by_id for event_id in hero.event_ids)
    line_break = by_id[hero.event_ids[1]]
    assert line_break.type == "pass"
    assert "line_break" in line_break.tags
    assert line_break.difficulty == 8.7
    assert line_break.ball_speed_kmh == 18.4

    sprint = by_id[hero.event_ids[2]]
    assert sprint.type == "sprint"
    assert sprint.speed_kmh == 33.4


def test_second_fastest_sprint_for_verifier_demo() -> None:
    bundle = generate_match("ast-2026-1018-nhr-orn")
    sprints = [event for event in bundle.events if event.type == "sprint"]
    speeds = sorted((event.speed_kmh for event in sprints if event.speed_kmh), reverse=True)
    assert speeds[0] == 33.8
    assert speeds[1] == 33.4


def test_deterministic() -> None:
    first = generate_match("ast-2026-1018-nhr-orn")
    second = generate_match("ast-2026-1018-nhr-orn")
    assert len(first.events) == len(second.events)
    assert first.events[0].event_id == second.events[0].event_id
    assert first.events[-1].event_id == second.events[-1].event_id
    assert [label.moment_id for label in first.labels] == [
        label.moment_id for label in second.labels
    ]


def test_write_outputs(tmp_path: Path) -> None:
    bundle = generate_match("ast-2026-1018-nhr-orn", output_dir=tmp_path)

    events_path = tmp_path / "events.jsonl"
    match_path = tmp_path / "match.json"
    labels_path = tmp_path / "labels.json"
    assert events_path.exists()
    assert match_path.exists()
    assert labels_path.exists()

    lines = [line for line in events_path.read_text().splitlines() if line.strip()]
    assert len(lines) == len(bundle.events)
    for line in lines[:10]:
        Event.model_validate_json(line)

    match = json.loads(match_path.read_text())
    assert match["final_score"] == {"home": 2, "away": 1}
    labels = json.loads(labels_path.read_text())
    assert any(label["moment_id"] == "m-072-01" for label in labels)


def test_generate_all_outputs(tmp_path: Path) -> None:
    bundles = generate_all(tmp_path)
    assert len(bundles) == 5
    for fixture in FIXTURES:
        directory = tmp_path / fixture.match_id
        assert (directory / "events.jsonl").exists()
        assert (directory / "match.json").exists()
        assert (directory / "labels.json").exists()
