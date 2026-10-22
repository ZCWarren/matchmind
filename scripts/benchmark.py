"""Measure the cached fast path without calling a model."""

from __future__ import annotations

import json
import statistics
import time
from pathlib import Path

from fastapi.testclient import TestClient

from matchmind.analytics import detect_moments, load_match
from matchmind.api.main import app

HERO = "ast-2026-1018-nhr-orn"
ITERATIONS = 60


def p95(samples: list[float]) -> float:
    ordered = sorted(samples)
    index = min(len(ordered) - 1, int(len(ordered) * 0.95))
    return ordered[index]


def summary(name: str, samples: list[float]) -> dict[str, float | str]:
    return {
        "route": name,
        "p50_ms": round(statistics.median(samples) * 1000, 2),
        "p95_ms": round(p95(samples) * 1000, 2),
        "min_ms": round(min(samples) * 1000, 2),
        "max_ms": round(max(samples) * 1000, 2),
    }


def main() -> None:
    bundle = load_match(HERO)
    moment = next(
        item
        for item in detect_moments(bundle)
        if item.type == "line_break" and item.clock.minute >= 70
    )
    client = TestClient(app)
    body = {
        "moment_id": moment.moment_id,
        "profiles": ["analyst", "casual", "player"],
        "languages": ["en", "es", "zh"],
        "use_cache": True,
        "cache_only": True,
    }

    routes: dict[str, callable] = {
        "/api/matches": lambda: client.get("/api/matches"),
        "/api/matches/{id}/moments": lambda: client.get(f"/api/matches/{HERO}/moments?limit=60"),
        "/api/matches/{id}/features": lambda: client.get(
            f"/api/matches/{HERO}/features?until_event_id={moment.event_id}"
        ),
        "/api/matches/{id}/insights (cached)": lambda: client.post(
            f"/api/matches/{HERO}/insights", json=body
        ),
    }

    rows = []
    for name, call in routes.items():
        call()
        samples = []
        for _ in range(ITERATIONS):
            started = time.perf_counter()
            response = call()
            samples.append(time.perf_counter() - started)
            if response.status_code != 200:
                raise RuntimeError(f"{name} returned {response.status_code}")
        rows.append(summary(name, samples))

    slow = json.loads(Path("data/cache/precompute-summary.json").read_text())
    slow_times = [row["elapsed_seconds"] for row in slow if row["elapsed_seconds"] > 0]
    slow_row = {
        "path": "live graph",
        "samples": len(slow_times),
        "p50_s": round(statistics.median(slow_times), 1),
        "max_s": round(max(slow_times), 1),
        "model_calls_per_insight": 13,
    }

    Path("docs/performance.json").write_text(
        json.dumps({"fast": rows, "slow": slow_row}, indent=2) + "\n"
    )
    lines = [
        "# Performance",
        "",
        f"Fast-path measurements: {ITERATIONS} requests per route via FastAPI TestClient.",
        "No model calls; cached insight and deterministic analytics only.",
        "",
        "| Route | p50 | p95 |",
        "|---|---:|---:|",
    ]
    for row in rows:
        lines.append(f"| `{row['route']}` | {row['p50_ms']} ms | {row['p95_ms']} ms |")
    lines += [
        "",
        "## Slow path",
        "",
        f"- Live graph samples: {slow_row['samples']}",
        f"- p50: {slow_row['p50_s']}s",
        f"- max: {slow_row['max_s']}s",
        f"- Model calls per insight: {slow_row['model_calls_per_insight']}",
        "",
        "The Studio and public demo read cached fixtures. Live generation is",
        "available locally and is intentionally not part of the public static demo.",
        "",
    ]
    Path("docs/PERFORMANCE.md").write_text("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    main()
