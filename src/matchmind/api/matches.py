"""Read-only match endpoints backed by MatchForge JSONL files."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from matchmind.config import settings

router = APIRouter(prefix="/api/matches", tags=["matches"])


def _match_dirs() -> list[Path]:
    root = Path(settings.match_data_dir)
    if not root.exists():
        return []
    return sorted(path.parent for path in root.glob("*/match.json"))


def _load_meta(directory: Path) -> dict[str, Any]:
    return json.loads((directory / "match.json").read_text(encoding="utf-8"))


def _find_match(match_id: str) -> tuple[Path, dict[str, Any]]:
    for directory in _match_dirs():
        meta = _load_meta(directory)
        if meta.get("match_id") == match_id:
            return directory, meta
    raise HTTPException(status_code=404, detail=f"match not found: {match_id}")


@router.get("")
def list_matches() -> list[dict[str, Any]]:
    """List synthetic matches available in the demo data directory."""
    matches = []
    for directory in _match_dirs():
        meta = _load_meta(directory)
        matches.append(
            {
                "match_id": meta["match_id"],
                "competition": meta.get("competition"),
                "date": meta.get("date"),
                "home": meta.get("home"),
                "away": meta.get("away"),
                "final_score": meta.get("final_score"),
                "venue": meta.get("venue"),
                "event_count": sum(
                    1
                    for line in (directory / "events.jsonl")
                    .read_text(encoding="utf-8")
                    .splitlines()
                    if line.strip()
                ),
            }
        )
    return matches


@router.get("/{match_id}")
def get_match(match_id: str) -> dict[str, Any]:
    directory, meta = _find_match(match_id)
    labels_path = directory / "labels.json"
    labels = json.loads(labels_path.read_text(encoding="utf-8")) if labels_path.exists() else []
    return {"match": meta, "labels": labels}


@router.get("/{match_id}/events")
def get_events(
    match_id: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
) -> dict[str, Any]:
    directory, _ = _find_match(match_id)
    lines = [
        line
        for line in (directory / "events.jsonl").read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    page = lines[offset : offset + limit]
    return {
        "match_id": match_id,
        "total": len(lines),
        "offset": offset,
        "limit": limit,
        "events": [json.loads(line) for line in page],
    }
