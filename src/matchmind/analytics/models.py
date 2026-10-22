"""Analytics contracts shared by the API, agents, and MCP tools."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from matchmind.models.event import Clock, Score

ANALYTICS_VERSION = "analytics-v1"


class Metric(BaseModel):
    """A deterministic metric with enough context to audit it."""

    model_config = ConfigDict(extra="forbid")

    name: str
    value: float
    unit: str = ""
    formula_version: str
    event_ids: list[str] = Field(default_factory=list)
    inputs: dict[str, float] = Field(default_factory=dict)
    label: str | None = None


class FeatureSnapshot(BaseModel):
    """A match state at a point in time plus its evidence."""

    model_config = ConfigDict(extra="forbid")

    match_id: str
    event_id: str | None = None
    clock: Clock
    score: Score
    event_count: int
    window_start_event: str | None = None
    window_end_event: str | None = None
    metrics: dict[str, Metric]
    analytics_version: str = ANALYTICS_VERSION


class Moment(BaseModel):
    """A deterministic key-moment candidate for the agents to explain."""

    model_config = ConfigDict(extra="forbid")

    moment_id: str
    match_id: str
    event_id: str
    clock: Clock
    type: str
    importance: float = Field(ge=0, le=1)
    headline: str
    event_ids: list[str] = Field(default_factory=list)
    metrics: dict[str, Metric] = Field(default_factory=dict)
    analytics_version: str = ANALYTICS_VERSION
