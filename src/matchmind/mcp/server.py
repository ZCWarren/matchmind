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


@mcp.tool()
def get_tactical_chain(
    match_id: str,
    event_id: str,
    window_size: int = 6,
) -> dict[str, Any]:
    """Return possession sequence, progression, and pressure chain around an event."""
    bundle = load_match(match_id)
    index = next(
        (pos for pos, event in enumerate(bundle.events) if event.event_id == event_id),
        None,
    )
    if index is None:
        raise ValueError(f"unknown event_id: {event_id}")
    anchor = bundle.events[index]
    start = max(0, index - max(1, window_size))
    end = min(len(bundle.events), index + max(1, window_size // 2) + 1)
    chain = bundle.events[start:end]
    start_x = chain[0].location.x if chain else anchor.location.x
    end_x = (
        anchor.end_location.x
        if anchor.end_location is not None
        else anchor.location.x
    )
    line_breaks = [
        ev.event_id for ev in chain if "line_break" in ev.tags or (ev.difficulty or 0.0) >= 7.5
    ]
    return {
        "match_id": match_id,
        "anchor_event_id": event_id,
        "possession_id": anchor.possession_id,
        "team_id": anchor.team_id,
        "sequence_length": len(chain),
        "territorial_gain_x": round(end_x - start_x, 2),
        "peak_pressure": round(max((ev.pressure for ev in chain), default=0.0), 2),
        "line_break_event_ids": line_breaks,
        "chain_event_ids": [ev.event_id for ev in chain],
    }


@mcp.tool()
def get_pressure_comparison(match_id: str, event_id: str) -> dict[str, Any]:
    """Compare event pressure and sprint speed against the match distribution and peaks."""
    bundle = load_match(match_id)
    target = next((ev for ev in bundle.events if ev.event_id == event_id), None)
    if target is None:
        raise ValueError(f"unknown event_id: {event_id}")
    pressures = sorted(ev.pressure for ev in bundle.events)
    rank = sum(1 for p in pressures if p <= target.pressure)
    percentile = round((rank / max(1, len(pressures))) * 100, 1)
    sprint_events = [
        ev for ev in bundle.events if ev.speed_kmh is not None or ev.ball_speed_kmh is not None
    ]
    fastest_sprint = max(
        (ev for ev in bundle.events if ev.speed_kmh is not None),
        key=lambda ev: ev.speed_kmh or 0.0,
        default=None,
    )
    target_speed = target.speed_kmh or 0.0
    peak_speed = fastest_sprint.speed_kmh if fastest_sprint and fastest_sprint.speed_kmh else 0.0
    return {
        "match_id": match_id,
        "event_id": event_id,
        "event_pressure": round(target.pressure, 2),
        "pressure_percentile": percentile,
        "event_speed_kmh": round(target_speed, 2),
        "match_peak_speed_kmh": round(peak_speed, 2),
        "match_peak_speed_event_id": fastest_sprint.event_id if fastest_sprint else None,
        "is_match_fastest_sprint": bool(
            target_speed > 0 and abs(target_speed - peak_speed) <= 0.01
        ),
        "tracked_speed_events": len(sprint_events),
    }


if __name__ == "__main__":
    mcp.run(transport="stdio")
