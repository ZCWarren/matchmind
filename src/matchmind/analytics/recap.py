"""Deterministic match recap from the event stream and labels."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from matchmind.models.event import Clock, MatchBundle

RECAP_VERSION = "recap-v1"


class RecapMoment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clock: Clock
    type: str
    description: str
    event_ids: list[str] = Field(default_factory=list)


class MatchRecap(BaseModel):
    model_config = ConfigDict(extra="forbid")

    match_id: str
    title: str
    summary: str
    final_score: dict[str, int]
    key_moments: list[RecapMoment]
    top_speed_kmh: float
    generated_by: str = RECAP_VERSION


def _ordinal(minute: int) -> str:
    if 10 <= minute % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(minute % 10, "th")
    return f"{minute}{suffix}"


def _team_name(bundle: MatchBundle, team_id: str | None) -> str:
    if team_id == bundle.match.home.team_id:
        return bundle.match.home.name
    if team_id == bundle.match.away.team_id:
        return bundle.match.away.name
    return "The match"


def _player_name(bundle: MatchBundle, player_id: str | None) -> str:
    if not player_id:
        return "a substitute"
    player = next(
        (item for item in bundle.match.lineups if item.player_id == player_id), None
    )
    return player.name if player else player_id


def _result_verb(home: int, away: int, home_name: str, away_name: str) -> str:
    if home > away:
        return f"{home_name} beat {away_name}"
    if home < away:
        return f"{away_name} beat {home_name}"
    return f"{home_name} and {away_name} drew"


def build_recap(bundle: MatchBundle) -> MatchRecap:
    events = bundle.events
    home = bundle.match.home
    away = bundle.match.away
    final = bundle.match.final_score

    goal_events = [event for event in events if event.type == "goal"]
    goal_sentences = []
    for event in goal_events:
        goal_sentences.append(
            f"{_team_name(bundle, event.team_id)} scored in the "
            f"{_ordinal(event.clock.minute)} minute through "
            f"{_player_name(bundle, event.player_id)}."
        )

    summary_parts = [
        f"{_result_verb(final.home, final.away, home.name, away.name)} "
        f"{final.home}-{final.away} in the Aster League.",
        *goal_sentences,
    ]
    card_events = [event for event in events if event.type == "card"]
    for event in card_events:
        color = str(event.outcome).title() if event.outcome else "Card"
        summary_parts.append(
            f"{_player_name(bundle, event.player_id)} received a {color.lower()} card "
            f"in the {_ordinal(event.clock.minute)} minute."
        )

    key_moments: list[RecapMoment] = []
    for label in sorted(bundle.labels, key=lambda item: item.clock.minute):
        event = next(
            (item for item in events if item.event_id == label.event_ids[0]),
            None,
        )
        description = label.notes or (
            label.expected_claims[0] if label.expected_claims else label.type
        )
        if event and event.type in {"goal", "card"}:
            description = f"{label.type.replace('_', ' ').title()}: {description}"
        key_moments.append(
            RecapMoment(
                clock=label.clock,
                type=label.type,
                description=description,
                event_ids=label.event_ids,
            )
        )

    speeds = [
        event.speed_kmh for event in events if event.type == "sprint" and event.speed_kmh
    ]
    return MatchRecap(
        match_id=bundle.match.match_id,
        title=f"{home.name} {final.home}-{final.away} {away.name}",
        summary=" ".join(summary_parts),
        final_score={"home": final.home, "away": final.away},
        key_moments=key_moments,
        top_speed_kmh=round(max(speeds), 1) if speeds else 0.0,
        generated_by=RECAP_VERSION,
    )
