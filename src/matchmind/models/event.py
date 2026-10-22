"""Event and match schemas for MatchForge synthetic data."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EventType = Literal[
    "kickoff",
    "pass",
    "carry",
    "pressure",
    "tackle",
    "shot",
    "goal",
    "foul",
    "card",
    "substitution",
    "sprint",
    "half_time",
    "full_time",
]


class Clock(BaseModel):
    """Match clock. Period 1 is 0-45, period 2 is 45-90+."""

    model_config = ConfigDict(extra="forbid")

    period: int = Field(ge=1, le=2)
    minute: int = Field(ge=0, le=120)
    second: int = Field(ge=0, le=59)


class Location(BaseModel):
    """Normalized pitch coordinates: x 0-100 (own goal to opponent goal), y 0-100."""

    model_config = ConfigDict(extra="forbid")

    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)

    @field_validator("x", "y")
    @classmethod
    def _round_coordinate(cls, value: float) -> float:
        return round(value, 1)


class Score(BaseModel):
    model_config = ConfigDict(extra="forbid")

    home: int = Field(ge=0)
    away: int = Field(ge=0)


class SynthMeta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    seed: int
    generator: str


class Event(BaseModel):
    """A single synthetic match event.

    Coordinates are normalized to 0-100. `pressure` is 0-1. Numeric football
    metrics (xG, xT, control, chaos) are intentionally *not* stored here; they
    are computed by the deterministic analytics engine so the event stream
    remains a factual record.
    """

    model_config = ConfigDict(extra="forbid")

    match_id: str
    event_id: str
    ts: datetime
    clock: Clock
    type: EventType
    team_id: str | None = None
    player_id: str | None = None
    location: Location
    end_location: Location | None = None
    recipient_id: str | None = None
    assist_id: str | None = None
    pressure: float = Field(ge=0, le=1)
    outcome: str | None = None
    ball_speed_kmh: float | None = Field(default=None, ge=0, le=200)
    shot_speed_kmh: float | None = Field(default=None, ge=0, le=200)
    speed_kmh: float | None = Field(default=None, ge=0, le=45)
    distance_m: float | None = Field(default=None, ge=0, le=120)
    difficulty: float | None = Field(default=None, ge=0, le=10)
    possession_id: str
    score: Score
    tags: list[str] = Field(default_factory=list)
    synth: SynthMeta

    @field_validator("pressure")
    @classmethod
    def _round_pressure(cls, value: float) -> float:
        return round(value, 2)

    @field_validator(
        "ball_speed_kmh",
        "shot_speed_kmh",
        "speed_kmh",
        "distance_m",
        "difficulty",
    )
    @classmethod
    def _round_metric(cls, value: float | None) -> float | None:
        return None if value is None else round(value, 1)


class Player(BaseModel):
    model_config = ConfigDict(extra="forbid")

    player_id: str
    name: str
    number: int = Field(ge=1, le=99)
    position: str
    team_id: str
    starter: bool = True


class Team(BaseModel):
    model_config = ConfigDict(extra="forbid")

    team_id: str
    name: str
    short_name: str
    color: str
    venue: str


class MatchMeta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    match_id: str
    competition: str
    season: str
    date: str
    kickoff_utc: datetime
    venue: str
    home: Team
    away: Team
    lineups: list[Player]
    final_score: Score
    seed: int
    generator: str


class MomentLabel(BaseModel):
    """Ground truth for evaluation. Never fed to the agents."""

    model_config = ConfigDict(extra="forbid")

    moment_id: str
    match_id: str
    clock: Clock
    type: str
    importance: float = Field(ge=0, le=1)
    event_ids: list[str]
    expected_claims: list[str]
    notes: str = ""


class MatchBundle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    match: MatchMeta
    events: list[Event]
    labels: list[MomentLabel]
