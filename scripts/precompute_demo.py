#!/usr/bin/env python3
"""Precompute the hero insight for the no-key demo and the judges' 90-second path."""

from __future__ import annotations

import argparse
import asyncio
import json
import time

from matchmind.agents.contracts import PipelineRequest
from matchmind.agents.pipeline import run_pipeline
from matchmind.analytics import detect_moments, load_match


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--match", default="ast-2026-1018-nhr-orn")
    parser.add_argument("--profiles", default="analyst,casual,player")
    parser.add_argument("--languages", default="en,es,zh")
    parser.add_argument("--no-mcp", action="store_true")
    args = parser.parse_args()

    bundle = load_match(args.match)
    hero_pass = next(
        (event for event in bundle.events if event.type == "pass" and "hero" in event.tags),
        None,
    )
    moments = detect_moments(bundle)
    moment = (
        next((item for item in moments if item.event_id == hero_pass.event_id), None)
        if hero_pass
        else None
    ) or max(moments, key=lambda item: item.importance)

    request = PipelineRequest(
        moment_id=moment.moment_id,
        profiles=args.profiles.split(","),
        languages=args.languages.split(","),
        use_mcp=not args.no_mcp,
        use_cache=True,
    )
    start = time.perf_counter()
    result = await run_pipeline(args.match, request)
    elapsed = round(time.perf_counter() - start, 1)
    print(
        json.dumps(
            {
                "elapsed_seconds": elapsed,
                "match_id": args.match,
                "moment_id": moment.moment_id,
                "status": result.verification.status,
                "decision": result.decision.action,
                "fallback": result.fallback,
                "cards": len(result.fan_cards),
                "cue": bool(result.cue),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
