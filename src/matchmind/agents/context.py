"""Shared event-window helpers for the pipeline and graph."""

from __future__ import annotations

from matchmind.models.event import Event, MatchBundle


def window(
    bundle: MatchBundle, event_id: str, before: int = 6, after: int = 6
) -> list[Event]:
    index = next(
        (
            position
            for position, event in enumerate(bundle.events)
            if event.event_id == event_id
        ),
        None,
    )
    if index is None:
        return []
    start = max(0, index - before)
    end = min(len(bundle.events), index + after + 1)
    return bundle.events[start:end]
