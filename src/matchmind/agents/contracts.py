"""Typed contracts between MatchMind agents and the API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from matchmind.analytics.models import Moment
from matchmind.models.event import Clock

Profile = Literal["analyst", "casual", "player"]
Language = Literal["en", "es", "zh", "ar", "hi"]
VerificationStatus = Literal["pass", "revise", "reject"]
DecisionAction = Literal["approve", "hold", "kill"]


class MetricRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    value: float
    formula_version: str
    event_ids: list[str] = Field(default_factory=list)


class Claim(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str
    event_ids: list[str]
    metric_refs: list[MetricRef] = Field(default_factory=list)
    confidence: float = Field(default=0.7, ge=0, le=1)


class InsightCandidate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    moment_id: str
    match_id: str
    headline: str
    why_it_matters: str
    watch_next: str = ""
    claims: list[Claim]
    importance: float = Field(default=0.5, ge=0, le=1)
    confidence: float = Field(default=0.7, ge=0, le=1)


class OverlayCue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cue_id: str
    insight_id: str
    template: Literal["lower_third_why", "stat_card", "momentum", "speed_alert"]
    priority: float = Field(ge=0, le=1)
    duration_seconds: float = Field(default=8.0, ge=2, le=20)
    safe_area: Literal["lower_third", "top_right", "center"] = "lower_third"
    payload: dict[str, Any]


class FanCard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    insight_id: str
    profile: Profile
    language: Language
    headline: str
    what_happened: str
    why_it_matters: str
    watch_next: str = ""
    how_we_know: str
    evidence_event_ids: list[str]


class VerificationIssue(BaseModel):
    model_config = ConfigDict(extra="ignore")

    code: str = "model_issue"
    message: str
    claim_index: int | None = None
    severity: Literal["warn", "error"] = "error"

    @field_validator("code", mode="before")
    @classmethod
    def _normalize_code(cls, value: object) -> str:
        return "model_issue" if value is None else str(value)

    @field_validator("message", mode="before")
    @classmethod
    def _normalize_message(cls, value: object) -> str:
        return str(value)

    @field_validator("severity", mode="before")
    @classmethod
    def _normalize_severity(cls, value: object) -> str:
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"error", "critical", "high", "blocker"}:
                return "error"
            return "warn"
        return "warn"


class VerificationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: VerificationStatus
    issues: list[VerificationIssue] = Field(default_factory=list)
    checked_claims: int = 0
    notes: str = ""

    @field_validator("status", mode="before")
    @classmethod
    def _normalize_status(cls, value: object) -> object:
        if isinstance(value, str):
            lowered = value.strip().lower()
            return {"passed": "pass", "rejected": "reject", "revised": "revise"}.get(
                lowered, lowered
            )
        return value

    @field_validator("issues", mode="before")
    @classmethod
    def _normalize_issues(cls, value: object) -> object:
        if isinstance(value, str):
            return [{"message": value, "severity": "warn"}]
        if isinstance(value, dict):
            return [value]
        if isinstance(value, list):
            return [
                {"message": item, "severity": "warn"} if isinstance(item, str) else item
                for item in value
            ]
        return value


class RundownDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: DecisionAction
    priority: float = Field(default=0.5, ge=0, le=1)
    duration_seconds: float = Field(default=8.0, ge=2, le=20)
    reason: str


class TraceStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent: str
    model: str
    prompt_version: str
    latency_ms: float
    status: Literal["ok", "error", "fallback"]
    error: str = ""


class PipelineRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    moment_id: str | None = None
    profiles: list[Profile] = Field(default_factory=lambda: ["analyst", "casual", "player"])
    languages: list[Language] = Field(default_factory=lambda: ["en", "es", "zh"])
    adversarial_claim: str | None = None
    use_mcp: bool = True
    use_cache: bool = True
    cache_only: bool = False


class PipelineResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    match_id: str
    moment: Moment
    clock: Clock
    insight: InsightCandidate | None = None
    cue: OverlayCue | None = None
    fan_cards: list[FanCard] = Field(default_factory=list)
    verification: VerificationResult
    decision: RundownDecision
    trace: list[TraceStep] = Field(default_factory=list)
    fallback: bool = False
