"""Read-only analytics endpoints with evidence."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from matchmind.analytics.engine import build_snapshot, load_match
from matchmind.analytics.moments import detect_moments

router = APIRouter(prefix="/api/matches", tags=["analytics"])


@router.get("/{match_id}/features")
def get_features(match_id: str, until_event_id: str | None = None) -> dict:
    try:
        bundle = load_match(match_id)
        return build_snapshot(bundle, until_event_id=until_event_id).model_dump(mode="json")
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{match_id}/moments")
def get_moments(
    match_id: str,
    limit: int = Query(default=20, ge=1, le=200),
    min_importance: float = Query(default=0.0, ge=0.0, le=1.0),
) -> dict:
    try:
        bundle = load_match(match_id)
        moments = detect_moments(bundle, min_importance=min_importance)
        moments.sort(key=lambda moment: moment.importance, reverse=True)
        return {
            "match_id": match_id,
            "total": len(moments),
            "moments": [moment.model_dump(mode="json") for moment in moments[:limit]],
        }
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
