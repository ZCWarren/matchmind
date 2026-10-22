"""MCP analytics server exposing deterministic match tools to agents."""

from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from matchmind.analytics.engine import build_snapshot, load_match
from matchmind.analytics.moments import detect_moments

mcp = FastMCP(
    "matchmind-analytics",
    instructions=(
        "Deterministic football analytics for MatchMind. All values are computed "
        "from synthetic event data; never invent numbers. Use get_event_window "
        "to inspect the exact events behind a claim."
    ),
)


@mcp.tool()
def get_match_info(match_id: str) -> dict[str, Any]:
    """Return match metadata, teams, final score, and available event count."""
    bundle = load_match(match_id)
    return {
        "match": bundle.match.model_dump(mode="json"),
        "event_count": len(bundle.events),
        "label_count": len(bundle.labels),
    }


@mcp.tool()
def get_snapshot(match_id: str, until_event_id: str | None = None) -> dict[str, Any]:
    """Return the deterministic feature snapshot, optionally up to an event."""
    bundle = load_match(match_id)
    return build_snapshot(bundle, until_event_id=until_event_id).model_dump(mode="json")


@mcp.tool()
def get_event_window(
    match_id: str,
    event_id: str,
    before: int = 5,
    after: int = 5,
) -> dict[str, Any]:
    """Return the events immediately before and after a specific event."""
    bundle = load_match(match_id)
    index = next(
        (position for position, event in enumerate(bundle.events) if event.event_id == event_id),
        None,
    )
    if index is None:
        raise ValueError(f"unknown event_id: {event_id}")
    start = max(0, index - max(0, before))
    end = min(len(bundle.events), index + max(0, after) + 1)
    return {
        "match_id": match_id,
        "event_id": event_id,
        "index": index,
        "events": [
            event.model_dump(mode="json") for event in bundle.events[start:end]
        ],
    }


@mcp.tool()
def get_moments(match_id: str, limit: int = 20) -> dict[str, Any]:
    """Return detected key moments, sorted by importance."""
    bundle = load_match(match_id)
    moments = detect_moments(bundle)
    moments.sort(key=lambda moment: moment.importance, reverse=True)
    return {
        "match_id": match_id,
        "total": len(moments),
        "moments": [moment.model_dump(mode="json") for moment in moments[: max(1, limit)]],
    }


@mcp.tool()
def get_player_summary(match_id: str, player_id: str) -> dict[str, Any]:
    """Return a player's touches, passes, shots, sprints, distance, and top speed."""
    bundle = load_match(match_id)
    events = [event for event in bundle.events if event.player_id == player_id]
    passes = [event for event in events if event.type == "pass"]
    shots = [event for event in events if event.type == "shot"]
    sprints = [event for event in events if event.type == "sprint"]
    distances = [event.distance_m for event in sprints if event.distance_m is not None]
    speeds = [event.speed_kmh for event in sprints if event.speed_kmh is not None]
    return {
        "match_id": match_id,
        "player_id": player_id,
        "touches": len(events),
        "passes": len(passes),
        "pass_completion": (
            sum(event.outcome == "complete" for event in passes) / max(1, len(passes))
        ),
        "shots": len(shots),
        "sprints": len(sprints),
        "sprint_distance_m": sum(distances),
        "top_speed_kmh": max(speeds) if speeds else 0.0,
        "event_ids": [event.event_id for event in events],
    }


if __name__ == "__main__":
    mcp.run(transport="stdio")
