"""Automated match recap endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from matchmind.analytics.engine import load_match
from matchmind.analytics.recap import MatchRecap, build_recap

router = APIRouter(prefix="/api/matches", tags=["recap"])


@router.get("/{match_id}/recap", response_model=MatchRecap)
def get_recap(match_id: str) -> MatchRecap:
    try:
        return build_recap(load_match(match_id))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
