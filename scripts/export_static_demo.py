"""Export the five cached fixtures as a static GitHub Pages demo."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi.testclient import TestClient

from matchmind.analytics import detect_moments, load_match
from matchmind.api.main import app

OUT = Path("web/public/demo")
MATCHES = [
    "ast-2026-1018-nhr-orn",
    "ast-2026-1025-vel-kep",
    "ast-2026-1101-orn-vel",
    "ast-2026-1108-kep-nhr",
    "ast-2026-1115-nhr-vel",
]


def choose_moment(match_id: str):
    bundle = load_match(match_id)
    moments = detect_moments(bundle)
    return next(
        (
            moment
            for moment in moments
            if moment.type == "line_break" and moment.clock.minute >= 70
        ),
        max(moments, key=lambda item: item.importance),
    )


def write(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    client = TestClient(app)

    write(
        OUT / "config.json",
        {"provider": "static", "demo_mode": "static", "allow_live_generation": False},
    )
    write(OUT / "matches.json", client.get("/api/matches").json())

    for match_id in MATCHES:
        moment = choose_moment(match_id)
        folder = OUT / match_id
        write(folder / "detail.json", client.get(f"/api/matches/{match_id}").json())
        write(
            folder / "events.json",
            client.get(f"/api/matches/{match_id}/events?limit=2000").json(),
        )
        write(
            folder / "moments.json",
            client.get(f"/api/matches/{match_id}/moments?limit=60").json(),
        )
        write(folder / "recap.json", client.get(f"/api/matches/{match_id}/recap").json())
        write(
            folder / "features.json",
            client.get(
                f"/api/matches/{match_id}/features?until_event_id={moment.event_id}"
            ).json(),
        )
        insight = client.post(
            f"/api/matches/{match_id}/insights",
            json={
                "moment_id": moment.moment_id,
                "profiles": ["analyst", "casual", "player"],
                "languages": ["en", "es", "zh"],
                "use_cache": True,
                "cache_only": True,
            },
        )
        insight.raise_for_status()
        write(folder / "insight.json", insight.json())
        print(match_id, moment.moment_id, "ok", flush=True)


if __name__ == "__main__":
    main()
