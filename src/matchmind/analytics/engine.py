"""Load synthetic matches and compute deterministic feature snapshots."""

from __future__ import annotations

import json
import statistics
from collections import Counter
from functools import lru_cache
from pathlib import Path

from matchmind.analytics.models import ANALYTICS_VERSION, FeatureSnapshot, Metric
from matchmind.analytics.xg import XG_VERSION, shot_xg
from matchmind.analytics.xt import XT_VERSION, pass_xt_delta
from matchmind.config import settings
from matchmind.models.event import Event, MatchBundle, MatchMeta, MomentLabel

PRESSURE_VERSION = "pressure-v1"
CONTROL_VERSION = "control-v1"
CHAOS_VERSION = "chaos-v1"
MOMENTUM_VERSION = "momentum-v1"
RHYTHM_VERSION = "rhythm-v1"
PASS_VERSION = "pass-quality-v1"
SPEED_VERSION = "speed-v1"


@lru_cache(maxsize=32)
def load_match(match_id: str) -> MatchBundle:
    """Load one generated match from the demo data root."""
    root = Path(settings.match_data_dir)
    if not root.exists():
        raise FileNotFoundError(f"match data directory not found: {root}")
    for directory in sorted(path for path in root.iterdir() if path.is_dir()):
        meta_path = directory / "match.json"
        if not meta_path.exists():
            continue
        meta = MatchMeta.model_validate_json(meta_path.read_text(encoding="utf-8"))
        if meta.match_id != match_id:
            continue
        events = [
            Event.model_validate_json(line)
            for line in (directory / "events.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        labels_path = directory / "labels.json"
        labels = (
            [
                MomentLabel.model_validate(item)
                for item in json.loads(labels_path.read_text(encoding="utf-8"))
            ]
            if labels_path.exists()
            else []
        )
        return MatchBundle(match=meta, events=events, labels=labels)
    raise FileNotFoundError(f"match not found: {match_id}")


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _unique(ids: list[str], limit: int = 12) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for event_id in ids:
        if event_id in seen:
            continue
        seen.add(event_id)
        result.append(event_id)
        if len(result) >= limit:
            break
    return result


def _metric(
    name: str,
    value: float,
    unit: str,
    formula: str,
    event_ids: list[str] | None = None,
    inputs: dict[str, float] | None = None,
    label: str | None = None,
) -> Metric:
    return Metric(
        name=name,
        value=round(float(value), 4),
        unit=unit,
        formula_version=formula,
        event_ids=_unique(event_ids or []),
        inputs={key: round(float(item), 4) for key, item in (inputs or {}).items()},
        label=label,
    )


def _threat(event: Event) -> float:
    if event.type == "shot" and event.team_id:
        return shot_xg(event.location, event.pressure)
    if event.type == "pass" and event.outcome == "complete" and event.end_location:
        return pass_xt_delta(event.location, event.end_location)
    return 0.0


def _control(
    events: list[Event],
    team_id: str,
    passes: list[Event],
) -> float:
    possession_events = [event for event in events if event.type in {"pass", "carry", "shot"}]
    team_events = [event for event in possession_events if event.team_id == team_id]
    total = max(1, len(possession_events))
    possession = len(team_events) / total

    team_passes = [event for event in passes if event.team_id == team_id]
    completed = sum(event.outcome == "complete" for event in team_passes)
    pass_completion = completed / max(1, len(team_passes))

    territory = (
        sum(event.location.x for event in team_events) / max(1, len(team_events)) / 100.0
    )
    return _clamp(0.4 * possession + 0.3 * pass_completion + 0.3 * territory)


def _chaos(events: list[Event]) -> tuple[float, list[str]]:
    passes = [event for event in events if event.type == "pass"]
    incomplete = [event for event in passes if event.outcome != "complete"]
    fouls = [event for event in events if event.type == "foul"]
    tackles = [event for event in events if event.type == "tackle" and event.outcome == "won"]
    turnovers = incomplete + fouls + tackles
    turnover_rate = len(turnovers) / max(1, len(events))

    pressure_values = [event.pressure for event in events if event.pressure > 0]
    pressure_std = statistics.pstdev(pressure_values) if len(pressure_values) > 1 else 0.0

    team_sequence = [event.team_id for event in events if event.team_id]
    switches = sum(
        1
        for previous, current in zip(team_sequence, team_sequence[1:], strict=False)
        if previous != current
    )
    switch_rate = switches / max(1, len(team_sequence))

    value = _clamp(
        0.5 * min(1.0, turnover_rate * 6.0)
        + 0.3 * min(1.0, pressure_std * 2.0)
        + 0.2 * min(1.0, switch_rate * 4.0)
    )
    return value, [event.event_id for event in turnovers[-12:]]


def _momentum(events: list[Event], home_id: str) -> tuple[float, list[str], float, float]:
    last_seconds = events[-1].clock.minute * 60 + events[-1].clock.second
    window = [
        event
        for event in events
        if event.clock.minute * 60 + event.clock.second >= max(0, last_seconds - 600)
    ]
    home = 0.0
    away = 0.0
    threat_events: list[str] = []
    for event in window:
        threat = _threat(event)
        if threat <= 0 or not event.team_id:
            continue
        threat_events.append(event.event_id)
        if event.team_id == home_id:
            home += threat
        else:
            away += threat
    total = home + away
    value = 0.0 if total <= 0 else (home - away) / total
    return _clamp(value, -1.0, 1.0), threat_events[-12:], home, away


def build_snapshot(
    bundle: MatchBundle,
    until_event_id: str | None = None,
) -> FeatureSnapshot:
    """Compute a deterministic snapshot, optionally up to a specific event."""
    events = bundle.events
    if until_event_id is not None:
        index = next(
            (position for position, event in enumerate(events) if event.event_id == until_event_id),
            None,
        )
        if index is None:
            raise ValueError(f"unknown event_id: {until_event_id}")
        events = events[: index + 1]
    if not events:
        raise ValueError("cannot build a snapshot from an empty match")

    last = events[-1]
    home_id = bundle.match.home.team_id
    away_id = bundle.match.away.team_id
    passes = [event for event in events if event.type == "pass"]
    shots = [event for event in events if event.type == "shot"]
    sprints = [event for event in events if event.type == "sprint"]

    team_events = Counter(event.team_id for event in events if event.team_id in {home_id, away_id})
    xg_home = sum(
        shot_xg(event.location, event.pressure) for event in shots if event.team_id == home_id
    )
    xg_away = sum(
        shot_xg(event.location, event.pressure) for event in shots if event.team_id == away_id
    )
    xt_home = sum(
        pass_xt_delta(event.location, event.end_location)
        for event in passes
        if event.team_id == home_id
        and event.outcome == "complete"
        and event.end_location is not None
    )
    xt_away = sum(
        pass_xt_delta(event.location, event.end_location)
        for event in passes
        if event.team_id == away_id
        and event.outcome == "complete"
        and event.end_location is not None
    )

    pressure_values = [event.pressure for event in events if event.pressure > 0]
    pressure = statistics.fmean(pressure_values) if pressure_values else 0.0
    high_pressure = [event for event in events if event.pressure >= 0.75]

    completion = sum(event.outcome == "complete" for event in passes) / max(1, len(passes))
    home_passes = [event for event in passes if event.team_id == home_id]
    away_passes = [event for event in passes if event.team_id == away_id]
    home_completion = sum(event.outcome == "complete" for event in home_passes) / max(
        1, len(home_passes)
    )
    away_completion = sum(event.outcome == "complete" for event in away_passes) / max(
        1, len(away_passes)
    )
    difficulties = [event.difficulty for event in passes if event.difficulty is not None]
    pass_difficulty = statistics.fmean(difficulties) if difficulties else 0.0
    line_breaks = [event for event in passes if "line_break" in event.tags]

    control_home = _control(events, home_id, passes)
    control_away = _control(events, away_id, passes)
    chaos, chaos_ids = _chaos(events)
    momentum, momentum_ids, home_threat, away_threat = _momentum(events, home_id)

    first_seconds = events[0].clock.minute * 60 + events[0].clock.second
    last_seconds = last.clock.minute * 60 + last.clock.second
    duration = max(1.0, (last_seconds - first_seconds) / 60.0)
    rhythm = len(events) / duration
    completed_passes = [event for event in passes if event.outcome == "complete"]
    vertical = sum(
        1
        for event in completed_passes
        if event.end_location is not None and event.end_location.x - event.location.x > 15
    )
    verticality = vertical / max(1, len(completed_passes))
    transitions = len(chaos_ids) / duration

    speeds = [event.speed_kmh for event in sprints if event.speed_kmh is not None]
    distances = [event.distance_m for event in sprints if event.distance_m is not None]
    ball_speeds = [
        event.ball_speed_kmh for event in passes if event.ball_speed_kmh is not None
    ]
    shot_speeds = [
        event.shot_speed_kmh for event in shots if event.shot_speed_kmh is not None
    ]

    metrics = {
        "xg_home": _metric(
            "xg_home",
            xg_home,
            "goals",
            XG_VERSION,
            [event.event_id for event in shots if event.team_id == home_id],
            {"shots": len([event for event in shots if event.team_id == home_id])},
        ),
        "xg_away": _metric(
            "xg_away",
            xg_away,
            "goals",
            XG_VERSION,
            [event.event_id for event in shots if event.team_id == away_id],
            {"shots": len([event for event in shots if event.team_id == away_id])},
        ),
        "xt_home": _metric(
            "xt_home",
            xt_home,
            "threat",
            XT_VERSION,
            [event.event_id for event in passes if event.team_id == home_id][-12:],
            {"completed_passes": len(home_passes)},
        ),
        "xt_away": _metric(
            "xt_away",
            xt_away,
            "threat",
            XT_VERSION,
            [event.event_id for event in passes if event.team_id == away_id][-12:],
            {"completed_passes": len(away_passes)},
        ),
        "pressure": _metric(
            "pressure",
            pressure,
            "0-1",
            PRESSURE_VERSION,
            [event.event_id for event in high_pressure][-12:],
            {"high_pressure_events": len(high_pressure), "samples": len(pressure_values)},
        ),
        "control_home": _metric(
            "control_home",
            control_home,
            "0-1",
            CONTROL_VERSION,
            [event.event_id for event in events if event.team_id == home_id][-12:],
        ),
        "control_away": _metric(
            "control_away",
            control_away,
            "0-1",
            CONTROL_VERSION,
            [event.event_id for event in events if event.team_id == away_id][-12:],
        ),
        "chaos": _metric("chaos", chaos, "0-1", CHAOS_VERSION, chaos_ids),
        "momentum": _metric(
            "momentum",
            momentum,
            "-1..1",
            MOMENTUM_VERSION,
            momentum_ids,
            {"home_threat": home_threat, "away_threat": away_threat},
        ),
        "rhythm_events_per_min": _metric(
            "rhythm_events_per_min",
            rhythm,
            "events/min",
            RHYTHM_VERSION,
            [event.event_id for event in events][-12:],
            {"duration_minutes": duration},
        ),
        "verticality": _metric(
            "verticality",
            verticality,
            "0-1",
            RHYTHM_VERSION,
            [event.event_id for event in completed_passes][-12:],
        ),
        "transitions_per_min": _metric(
            "transitions_per_min",
            transitions,
            "events/min",
            RHYTHM_VERSION,
            chaos_ids,
        ),
        "pass_completion": _metric(
            "pass_completion",
            completion,
            "0-1",
            PASS_VERSION,
            [event.event_id for event in passes][-12:],
            {"passes": len(passes)},
        ),
        "pass_completion_home": _metric(
            "pass_completion_home",
            home_completion,
            "0-1",
            PASS_VERSION,
            [event.event_id for event in home_passes][-12:],
        ),
        "pass_completion_away": _metric(
            "pass_completion_away",
            away_completion,
            "0-1",
            PASS_VERSION,
            [event.event_id for event in away_passes][-12:],
        ),
        "pass_difficulty": _metric(
            "pass_difficulty",
            pass_difficulty,
            "0-10",
            PASS_VERSION,
            [event.event_id for event in passes][-12:],
        ),
        "line_breaks": _metric(
            "line_breaks",
            len(line_breaks),
            "count",
            PASS_VERSION,
            [event.event_id for event in line_breaks],
        ),
        "top_speed": _metric(
            "top_speed",
            max(speeds) if speeds else 0.0,
            "km/h",
            SPEED_VERSION,
            [event.event_id for event in sprints],
        ),
        "sprint_count": _metric(
            "sprint_count",
            len(sprints),
            "count",
            SPEED_VERSION,
            [event.event_id for event in sprints],
        ),
        "sprint_distance": _metric(
            "sprint_distance",
            sum(distances),
            "m",
            SPEED_VERSION,
            [event.event_id for event in sprints],
        ),
        "ball_speed": _metric(
            "ball_speed",
            statistics.fmean(ball_speeds) if ball_speeds else 0.0,
            "km/h",
            SPEED_VERSION,
            [event.event_id for event in passes if event.ball_speed_kmh is not None][-12:],
        ),
        "shot_speed": _metric(
            "shot_speed",
            statistics.fmean(shot_speeds) if shot_speeds else 0.0,
            "km/h",
            SPEED_VERSION,
            [event.event_id for event in shots if event.shot_speed_kmh is not None],
        ),
        "team_events_home": _metric(
            "team_events_home",
            team_events[home_id],
            "count",
            ANALYTICS_VERSION,
        ),
        "team_events_away": _metric(
            "team_events_away",
            team_events[away_id],
            "count",
            ANALYTICS_VERSION,
        ),
    }

    return FeatureSnapshot(
        match_id=bundle.match.match_id,
        event_id=last.event_id,
        clock=last.clock,
        score=last.score,
        event_count=len(events),
        window_start_event=events[0].event_id,
        window_end_event=last.event_id,
        metrics=metrics,
    )
