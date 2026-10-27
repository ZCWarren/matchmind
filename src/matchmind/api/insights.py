"""Endpoints for running the multi-agent insight pipeline."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from matchmind.agents.blackboard import (
    CopilotQA,
    MatchBlackboardState,
    build_arc_insight,
    build_blackboard,
)
from matchmind.agents.budget import live_budget
from matchmind.agents.cache import load_cached
from matchmind.agents.contracts import PipelineRequest, PipelineResult
from matchmind.agents.copilot import answer_copilot_question
from matchmind.agents.pipeline import run_pipeline
from matchmind.config import settings

router = APIRouter(prefix="/api/matches", tags=["insights"])


class CopilotQueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=1, max_length=300)


@router.get("/{match_id}/blackboard", response_model=MatchBlackboardState)
def get_match_blackboard(match_id: str) -> MatchBlackboardState:
    try:
        return build_blackboard(match_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{match_id}/arc/{moment_id}", response_model=PipelineResult)
def get_arc_moment_insight(match_id: str, moment_id: str) -> PipelineResult:
    try:
        return build_arc_insight(match_id, moment_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{match_id}/copilot", response_model=CopilotQA)
async def query_tactical_copilot(match_id: str, body: CopilotQueryRequest) -> CopilotQA:
    try:
        with live_budget(match_id):
            return await answer_copilot_question(match_id, body.question)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


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
        with live_budget(match_id):
            return await run_pipeline(match_id, request)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
