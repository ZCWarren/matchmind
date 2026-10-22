"""MatchForge tests: shape, determinism, hero evidence, and output files."""

from __future__ import annotations

import json
from pathlib import Path

from matchmind.matchforge import generate_match
from matchmind.models.event import Event


def test_generate_match_shape() -> None:
    bundle = generate_match(seed=20261018)

    assert 1050 <= len(bundle.events) <= 1500
    assert bundle.events[0].type == "kickoff"
    assert bundle.events[-1].type == "full_time"
    assert bundle.match.final_score.home == 2
    assert bundle.match.final_score.away == 1
    assert len(bundle.match.lineups) == 32
    assert len(bundle.labels) >= 5

    ids = [event.event_id for event in bundle.events]
    assert len(ids) == len(set(ids))
    assert bundle.events[0].match_id == bundle.match.match_id


def test_hero_moment_evidence() -> None:
    bundle = generate_match(seed=20261018)
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
    bundle = generate_match(seed=20261018)
    sprints = [event for event in bundle.events if event.type == "sprint"]
    speeds = sorted((event.speed_kmh for event in sprints if event.speed_kmh), reverse=True)
    assert speeds[0] == 33.8
    assert speeds[1] == 33.4


def test_deterministic() -> None:
    first = generate_match(seed=20261018)
    second = generate_match(seed=20261018)
    assert len(first.events) == len(second.events)
    assert first.events[0].event_id == second.events[0].event_id
    assert first.events[-1].event_id == second.events[-1].event_id
    assert [label.moment_id for label in first.labels] == [
        label.moment_id for label in second.labels
    ]


def test_write_outputs(tmp_path: Path) -> None:
    bundle = generate_match(seed=20261018, output_dir=tmp_path)

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
