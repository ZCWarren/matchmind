"""File cache for precomputed pipeline results (demo mode and judges)."""

from __future__ import annotations

import re
from pathlib import Path

from matchmind.agents.contracts import PipelineRequest, PipelineResult
from matchmind.config import settings

_SAFE = re.compile(r"[^a-zA-Z0-9_.-]+")


def _safe(value: str) -> str:
    return _SAFE.sub("-", value)


def cache_path(match_id: str, request: PipelineRequest) -> Path:
    moment = request.moment_id or "top"
    profiles = "-".join(request.profiles)
    languages = "-".join(request.languages)
    name = f"{_safe(moment)}__{_safe(profiles)}__{_safe(languages)}.json"
    return Path(settings.cache_dir) / _safe(match_id) / name


def load_cached(match_id: str, request: PipelineRequest) -> PipelineResult | None:
    path = cache_path(match_id, request)
    if not path.exists():
        return None
    try:
        return PipelineResult.model_validate_json(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_cached(match_id: str, request: PipelineRequest, result: PipelineResult) -> Path:
    path = cache_path(match_id, request)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(result.model_dump_json(indent=2) + "\n", encoding="utf-8")
    return path
