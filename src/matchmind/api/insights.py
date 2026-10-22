"""Endpoints for running the multi-agent insight pipeline."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from matchmind.agents.cache import load_cached
from matchmind.agents.contracts import PipelineRequest, PipelineResult
from matchmind.agents.pipeline import run_pipeline
from matchmind.config import settings

router = APIRouter(prefix="/api/matches", tags=["insights"])


@router.post("/{match_id}/insights", response_model=PipelineResult)
async def create_insight(match_id: str, request: PipelineRequest) -> PipelineResult:
    if not settings.allow_live_generation:
        cached = load_cached(match_id, request)
        if cached is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Live generation is disabled in this demo; "
                    "no cached insight for this moment"
                ),
            )
        return cached
    try:
        return await run_pipeline(match_id, request)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
