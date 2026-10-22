"""Live replay WebSocket: streams synthetic events and the cached insight cue."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from matchmind.agents.cache import load_cached
from matchmind.agents.contracts import PipelineRequest
from matchmind.analytics import detect_moments, load_match

router = APIRouter(tags=["replay"])


def _clock_seconds(clock) -> int:
    return clock.minute * 60 + clock.second


@router.websocket("/ws/matches/{match_id}")
async def replay_match(
    websocket: WebSocket,
    match_id: str,
    speed: float = 10.0,
    start_event_id: str | None = None,
) -> None:
    await websocket.accept()
    try:
        bundle = load_match(match_id)
    except FileNotFoundError:
        await websocket.send_json({"type": "error", "message": f"match not found: {match_id}"})
        await websocket.close(code=1008)
        return

    events = bundle.events
    moments = detect_moments(bundle)
    moment = next(
        (item for item in moments if item.type == "line_break" and item.clock.minute >= 70),
        max(moments, key=lambda item: item.importance) if moments else None,
    )
    cached = None
    if moment is not None:
        cached = load_cached(
            match_id,
            PipelineRequest(
                moment_id=moment.moment_id,
                profiles=["analyst", "casual", "player"],
                languages=["en", "es", "zh"],
                use_cache=True,
            ),
        )

    start = 0
    if start_event_id:
        start = next(
            (index for index, event in enumerate(events) if event.event_id == start_event_id),
            0,
        )
    speed = max(1.0, min(120.0, float(speed)))
    moment_index = next(
        (
            index
            for index, event in enumerate(events)
            if moment and event.event_id == moment.event_id
        ),
        None,
    )

    await websocket.send_json(
        {
            "type": "hello",
            "match": bundle.match.model_dump(mode="json"),
            "total": len(events),
            "start_index": start,
            "speed": speed,
            "insight_available": cached is not None,
        }
    )

    if cached is not None and moment_index is not None and start > moment_index:
        await websocket.send_json(
            {
                "type": "insight",
                "result": cached.model_dump(mode="json"),
            }
        )

    previous_seconds = _clock_seconds(events[start].clock)
    try:
        for index in range(start, len(events)):
            event = events[index]
            await websocket.send_json(
                {
                    "type": "event",
                    "index": index,
                    "event": event.model_dump(mode="json"),
                }
            )
            if cached is not None and index == moment_index:
                await websocket.send_json(
                    {
                        "type": "insight",
                        "result": cached.model_dump(mode="json"),
                    }
                )
            seconds = _clock_seconds(event.clock)
            delta = max(0, seconds - previous_seconds)
            previous_seconds = seconds
            delay = min(0.5, max(0.002, delta / speed))
            await asyncio.sleep(delay)
        await websocket.send_json({"type": "end"})
    except WebSocketDisconnect:
        return
    except (asyncio.CancelledError, RuntimeError):
        return
