"""Deterministic key-moment detection for the agent layer."""

from __future__ import annotations

from matchmind.analytics.models import Metric, Moment
from matchmind.analytics.xg import XG_VERSION, shot_xg
from matchmind.analytics.xt import XT_VERSION, pass_xt_delta
from matchmind.models.event import Event, MatchBundle

SPEED_VERSION = "speed-v1"
PRESSURE_VERSION = "pressure-v1"


def _metric(name: str, value: float, unit: str, formula: str, event_ids: list[str]) -> Metric:
    return Metric(
        name=name,
        value=round(float(value), 4),
        unit=unit,
        formula_version=formula,
        event_ids=event_ids,
    )


def _headline(event: Event) -> str:
    if event.type == "goal":
        return f"Goal for {event.team_id} ({event.player_id})"
    if event.type == "shot":
        return f"Big chance for {event.team_id} ({event.player_id})"
    if event.type == "pass":
        return "Line break under pressure"
    if event.type == "sprint":
        return f"Sprint at {event.speed_kmh} km/h ({event.player_id})"
    if event.type == "card":
        return f"{str(event.outcome).title()} card for {event.player_id}"
    return event.type


def detect_moments(bundle: MatchBundle, min_importance: float = 0.0) -> list[Moment]:
    """Detect deterministic moment candidates. No labels are used."""
    events = bundle.events
    moments: list[Moment] = []

    for index, event in enumerate(events):
        if event.type == "goal":
            previous_shot = next(
                (
                    candidate
                    for candidate in reversed(events[:index])
                    if candidate.type == "shot"
                    and candidate.team_id == event.team_id
                    and candidate.possession_id == event.possession_id
                ),
                None,
            )
            xg = shot_xg(previous_shot.location, previous_shot.pressure) if previous_shot else 0.0
            event_ids = [event.event_id]
            metrics = {}
            if previous_shot:
                event_ids.insert(0, previous_shot.event_id)
                metrics["xg"] = _metric(
                    "xg",
                    xg,
                    "goals",
                    XG_VERSION,
                    [previous_shot.event_id],
                )
            moments.append(
                Moment(
                    moment_id=f"mo-{event.event_id}",
                    match_id=bundle.match.match_id,
                    event_id=event.event_id,
                    clock=event.clock,
                    type="goal",
                    importance=0.95,
                    headline=_headline(event),
                    event_ids=event_ids,
                    metrics=metrics,
                )
            )
            continue

        if event.type == "shot" and event.outcome != "goal":
            xg = shot_xg(event.location, event.pressure)
            if xg < 0.12:
                continue
            moments.append(
                Moment(
                    moment_id=f"mo-{event.event_id}",
                    match_id=bundle.match.match_id,
                    event_id=event.event_id,
                    clock=event.clock,
                    type="big_chance",
                    importance=min(0.9, 0.45 + xg),
                    headline=_headline(event),
                    event_ids=[event.event_id],
                    metrics={
                        "xg": _metric("xg", xg, "goals", XG_VERSION, [event.event_id]),
                        "pressure": _metric(
                            "pressure",
                            event.pressure,
                            "0-1",
                            PRESSURE_VERSION,
                            [event.event_id],
                        ),
                    },
                )
            )
            continue

        if event.type == "pass" and "line_break" in event.tags and event.end_location:
            delta = pass_xt_delta(event.location, event.end_location)
            moments.append(
                Moment(
                    moment_id=f"mo-{event.event_id}",
                    match_id=bundle.match.match_id,
                    event_id=event.event_id,
                    clock=event.clock,
                    type="line_break",
                    importance=0.8,
                    headline=_headline(event),
                    event_ids=[event.event_id],
                    metrics={
                        "xt_delta": _metric(
                            "xt_delta", delta, "threat", XT_VERSION, [event.event_id]
                        ),
                        "pressure": _metric(
                            "pressure",
                            event.pressure,
                            "0-1",
                            PRESSURE_VERSION,
                            [event.event_id],
                        ),
                    },
                )
            )
            continue

        if event.type == "sprint" and event.speed_kmh and event.speed_kmh >= 33.0:
            moments.append(
                Moment(
                    moment_id=f"mo-{event.event_id}",
                    match_id=bundle.match.match_id,
                    event_id=event.event_id,
                    clock=event.clock,
                    type="sprint",
                    importance=0.55,
                    headline=_headline(event),
                    event_ids=[event.event_id],
                    metrics={
                        "speed": _metric(
                            "speed",
                            event.speed_kmh,
                            "km/h",
                            SPEED_VERSION,
                            [event.event_id],
                        )
                    },
                )
            )
            continue

        if event.type == "card":
            importance = 0.9 if event.outcome == "red" else 0.4
            moments.append(
                Moment(
                    moment_id=f"mo-{event.event_id}",
                    match_id=bundle.match.match_id,
                    event_id=event.event_id,
                    clock=event.clock,
                    type=f"{event.outcome}_card",
                    importance=importance,
                    headline=_headline(event),
                    event_ids=[event.event_id],
                )
            )

    return [moment for moment in moments if moment.importance >= min_importance]
