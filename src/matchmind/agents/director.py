"""Deterministic airtime constraints for the Director agent."""

from __future__ import annotations

from typing import Any

from matchmind.agents.contracts import RundownDecision, RundownEntry, VerificationResult
from matchmind.analytics.models import Moment
from matchmind.models.event import Clock, Event

STOPPAGE_TYPES = {"foul", "card", "goal", "substitution", "half_time", "full_time"}


def clock_seconds(clock: Clock) -> int:
    return (clock.period - 1) * 45 * 60 + clock.minute * 60 + clock.second


def next_stoppage(moment: Moment, events: list[Event]) -> Clock:
    start = clock_seconds(moment.clock)
    for event in events:
        seconds = clock_seconds(event.clock)
        if event.type in STOPPAGE_TYPES and start + 15 <= seconds <= start + 120:
            return event.clock
    return moment.clock


def is_duplicate(candidate: Moment, other: Moment) -> bool:
    if candidate.moment_id == other.moment_id:
        return False
    if candidate.event_id == other.event_id:
        return True
    return (
        candidate.type == other.type
        and abs(clock_seconds(candidate.clock) - clock_seconds(other.clock)) <= 60
    )


def director_options(
    moments: list[Moment], selected: Moment, events: list[Event]
) -> list[dict[str, Any]]:
    return [
        {
            "moment_id": moment.moment_id,
            "clock": moment.clock.model_dump(),
            "type": moment.type,
            "importance": moment.importance,
            "selected": moment.moment_id == selected.moment_id,
            "duplicate": is_duplicate(selected, moment),
            "earliest_air_at": next_stoppage(moment, events).model_dump(),
        }
        for moment in sorted(moments, key=lambda item: item.importance, reverse=True)[:12]
    ]


def normalize_decision(
    decision: RundownDecision,
    verification: VerificationResult,
    moments: list[Moment],
    selected: Moment,
    events: list[Event],
) -> RundownDecision:
    valid_ids = {moment.moment_id for moment in moments}
    ranked = [selected.moment_id]
    ranked.extend(
        moment_id
        for moment_id in decision.ranked_moment_ids
        if moment_id in valid_ids and moment_id not in ranked
    )
    ranked.extend(
        moment.moment_id
        for moment in sorted(moments, key=lambda item: item.importance, reverse=True)
        if moment.moment_id not in ranked
    )
    action = decision.action if verification.status == "pass" else "hold"
    return decision.model_copy(
        update={
            "action": action,
            "ranked_moment_ids": ranked,
            "air_at": next_stoppage(selected, events) if action == "approve" else None,
        }
    )


def build_rundown(
    decision: RundownDecision, moments: list[Moment], selected: Moment
) -> list[RundownEntry]:
    by_id = {moment.moment_id: moment for moment in moments}
    entries = []
    for rank, moment_id in enumerate(decision.ranked_moment_ids, start=1):
        moment = by_id.get(moment_id)
        if moment is None:
            continue
        current = moment_id == selected.moment_id
        duplicate = is_duplicate(selected, moment)
        entries.append(
            RundownEntry(
                moment_id=moment_id,
                rank=rank,
                action=decision.action if current else "hold",
                air_at=decision.air_at if current else None,
                reason=(
                    decision.reason
                    if current
                    else "Within the 60-second duplicate window"
                    if duplicate
                    else "Deferred by the Director"
                ),
            )
        )
    return entries
