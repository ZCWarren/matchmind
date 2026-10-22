"""Precompute the hero insight for every fixture so the Studio demo is instant."""

from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path

from matchmind.agents.contracts import PipelineRequest
from matchmind.agents.pipeline import run_pipeline
from matchmind.analytics import detect_moments, load_match

MATCHES = [
    "ast-2026-1018-nhr-orn",
    "ast-2026-1025-vel-kep",
    "ast-2026-1101-orn-vel",
    "ast-2026-1108-kep-nhr",
    "ast-2026-1115-nhr-vel",
]
PROFILES = ["analyst", "casual", "player"]
LANGUAGES = ["en", "es", "zh"]


async def main() -> None:
    results = []
    for match_id in MATCHES:
        bundle = load_match(match_id)
        moments = detect_moments(bundle)
        late = next(
            (
                moment
                for moment in moments
                if moment.type == "line_break" and moment.clock.minute >= 70
            ),
            None,
        )
        moment = late or max(moments, key=lambda item: item.importance)
        started = time.perf_counter()
        result = await run_pipeline(
            match_id,
            PipelineRequest(
                moment_id=moment.moment_id,
                profiles=PROFILES,
                languages=LANGUAGES,
                use_cache=True,
            ),
        )
        elapsed = round(time.perf_counter() - started, 1)
        row = {
            "match_id": match_id,
            "moment_id": moment.moment_id,
            "elapsed_seconds": elapsed,
            "verification": result.verification.status,
            "decision": result.decision.action,
            "fallback": result.fallback,
            "cards": len(result.fan_cards),
            "cue": result.cue is not None,
            "trace": [(step.agent, step.status) for step in result.trace],
        }
        results.append(row)
        print(json.dumps(row), flush=True)
    Path("data/cache/precompute-summary.json").write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    asyncio.run(main())
