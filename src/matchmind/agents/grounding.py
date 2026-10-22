"""Deterministic headline guard for LLM candidates.

The analyst occasionally returns a generic moment label or a non-English
headline. Broadcast output cannot ship that. This module builds a specific,
event-grounded candidate from the same evidence, keeping the LLM candidate when
it is already good.
"""

from __future__ import annotations

import re

from matchmind.agents.contracts import Claim, InsightCandidate, MetricRef
from matchmind.analytics.models import FeatureSnapshot, Metric, Moment
from matchmind.models.event import Event, MatchBundle

CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")


def _player_name(bundle: MatchBundle, player_id: str | None) -> str:
    if not player_id:
        return "the carrier"
    player = next(
        (item for item in bundle.match.lineups if item.player_id == player_id), None
    )
    return player.name if player else player_id


def _team_code(bundle: MatchBundle, team_id: str | None) -> str:
    for team in (bundle.match.home, bundle.match.away):
        if team.team_id == team_id:
            return team.short_name.upper()
    return "the opposition"


def _opponent_code(bundle: MatchBundle, team_id: str | None) -> str:
    if team_id == bundle.match.home.team_id:
        return bundle.match.away.short_name.upper()
    return bundle.match.home.short_name.upper()


def _clock(moment: Moment) -> str:
    return f"{moment.clock.minute}:{moment.clock.second:02d}"


def _metric(moment: Moment, snapshot: FeatureSnapshot, name: str) -> Metric | None:
    return moment.metrics.get(name) or snapshot.metrics.get(name)


def _ref(metric: Metric | None) -> MetricRef | None:
    if metric is None:
        return None
    return MetricRef(
        name=metric.name,
        value=metric.value,
        formula_version=metric.formula_version,
        event_ids=metric.event_ids,
    )


def needs_grounding(candidate: InsightCandidate, moment: Moment) -> bool:
    headline = candidate.headline.strip()
    if not headline:
        return True
    if CJK_RE.search(headline) or CJK_RE.search(candidate.why_it_matters):
        return True
    if headline.lower() == moment.headline.strip().lower():
        return True
    return moment.type.startswith("line_break") and len(headline) < 28


def ensure_grounded(
    candidate: InsightCandidate,
    bundle: MatchBundle,
    moment: Moment,
    snapshot: FeatureSnapshot,
) -> InsightCandidate:
    if needs_grounding(candidate, moment):
        return grounded_insight(bundle, moment, snapshot)
    return candidate


def grounded_insight(
    bundle: MatchBundle, moment: Moment, snapshot: FeatureSnapshot
) -> InsightCandidate:
    event = next(
        (item for item in bundle.events if item.event_id == moment.event_id),
        None,
    )
    return _build(bundle, moment, snapshot, event)


def _build(
    bundle: MatchBundle, moment: Moment, snapshot: FeatureSnapshot, event: Event | None
) -> InsightCandidate:
    player = _player_name(bundle, event.player_id if event else None)
    team = _team_code(bundle, event.team_id if event else None)
    opponent = _opponent_code(bundle, event.team_id if event else None)
    clock = _clock(moment)
    pressure = _metric(moment, snapshot, "event_pressure")
    xt = _metric(moment, snapshot, "xt_delta")
    xg = _metric(moment, snapshot, "xg")
    speed = _metric(moment, snapshot, "event_speed") or _metric(
        moment, snapshot, "top_speed"
    )

    if moment.type.startswith("line_break"):
        headline = f"{player} breaks the {opponent} line at {clock}"
        why = (
            f"{player} completed a pass through the {opponent} line at {clock}"
            + (f" under {pressure.value:.2f} pressure" if pressure else "")
            + (f", adding {xt.value:+.2f} expected threat" if xt else "")
            + f". It moved {team} from a congested phase into the attacking third."
        )
        claims = [
            Claim(
                text=f"{player} completed a line-breaking pass at {clock}.",
                event_ids=[moment.event_id],
                confidence=0.85,
            )
        ]
        if pressure:
            claims.append(
                Claim(
                    text=f"The pass was completed under {pressure.value:.2f} pressure.",
                    event_ids=[moment.event_id],
                    metric_refs=[_ref(pressure)],
                    confidence=0.85,
                )
            )
        if xt:
            claims.append(
                Claim(
                    text=f"The pass added {xt.value:+.2f} expected threat.",
                    event_ids=[moment.event_id],
                    metric_refs=[_ref(xt)],
                    confidence=0.85,
                )
            )
        watch = f"Watch whether {opponent} can reset its line before {team} attacks again."
    elif moment.type == "goal":
        headline = f"{player} scores for {team} at {clock}"
        why = (
            f"{player} converted for {team} at {clock}"
            + (f" from a {xg.value:.2f} xG chance" if xg else "")
            + f". The goal changed the scoreline and forced {opponent} to respond."
        )
        claims = [
            Claim(
                text=f"{player} scored for {team} at {clock}.",
                event_ids=[moment.event_id],
                confidence=0.9,
            )
        ]
        if xg:
            claims.append(
                Claim(
                    text=f"The shot carried {xg.value:.2f} expected goals.",
                    event_ids=[moment.event_id],
                    metric_refs=[_ref(xg)],
                    confidence=0.85,
                )
            )
        watch = f"Watch whether {opponent} changes its rest defence after the goal."
    elif moment.type.startswith("sprint"):
        headline = f"{player} hits {speed.value:.1f} km/h at {clock}" if speed else moment.headline
        why = (
            f"{player} reached {speed.value:.1f} km/h at {clock}, the fastest tracked "
            f"speed in this passage. The run stretched {opponent} and created space "
            f"for the next action."
            if speed
            else f"{player} produced the sprint peak at {clock}."
        )
        claims = [
            Claim(
                text=headline,
                event_ids=[moment.event_id],
                metric_refs=[_ref(speed)] if speed else [],
                confidence=0.85,
            )
        ]
        watch = f"Watch whether {opponent} can match the next transition."
    elif moment.type == "big_chance":
        headline = f"{player} forces a big chance at {clock}"
        why = (
            f"{player} created a high-value chance for {team} at {clock}. "
            f"The shot outcome was {event.outcome if event else 'recorded'}."
        )
        claims = [
            Claim(
                text=headline,
                event_ids=[moment.event_id],
                confidence=0.8,
            )
        ]
        watch = f"Watch whether {opponent} closes the shooting lane earlier."
    else:
        headline = moment.headline
        why = (
            f"A {moment.type.replace('_', ' ')} was detected at {clock}. "
            "The interpretation is limited to the supplied event window."
        )
        claims = [
            Claim(text=headline, event_ids=[moment.event_id], confidence=0.7)
        ]
        watch = ""

    return InsightCandidate(
        moment_id=moment.moment_id,
        match_id=moment.match_id,
        headline=headline,
        why_it_matters=why,
        watch_next=watch,
        claims=claims,
        importance=moment.importance,
        confidence=0.82,
    )
