"""Deterministic synthetic match generator for five narrative fixtures.

The generator is event-level, not a full 22-player physics engine. It produces
realistic-shaped event streams with coordinates, pressure, pass quality, shots,
cards, substitutions, speed events, and scripted narrative beats. Ground-truth
labels are written separately and are never fed to the agents.
"""

from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

from matchmind.models.event import (
    Clock,
    Event,
    EventType,
    Location,
    MatchBundle,
    MatchMeta,
    MomentLabel,
    Player,
    Score,
    SynthMeta,
    Team,
)

GENERATOR = "matchforge-v1"
MATCH_END_SECONDS = 94 * 60
HALF_TIME_SECONDS = 45 * 60
HERO_MATCH_ID = "ast-2026-1018-nhr-orn"

TEAMS: dict[str, Team] = {
    "NHR": Team(
        team_id="NHR",
        name="Nova Harbor",
        short_name="Nova",
        color="#0FB5A6",
        venue="Meridian Park",
    ),
    "ORN": Team(
        team_id="ORN",
        name="Orion North",
        short_name="Orion",
        color="#E23B3B",
        venue="Orion Park",
    ),
    "VEL": Team(
        team_id="VEL",
        name="Vela Athletic",
        short_name="Vela",
        color="#2F6BFF",
        venue="Vela Ground",
    ),
    "KEP": Team(
        team_id="KEP",
        name="Kepler Town",
        short_name="Kepler",
        color="#E0A400",
        venue="Kepler Arena",
    ),
}

# (player_id, name, number, position, starter)
_LINEUP_ROWS: dict[str, list[tuple[str, str, int, str, bool]]] = {
    "NHR": [
        ("NHR-01", "Ivo Marchetti", 1, "GK", True),
        ("NHR-02", "Rui Calder", 2, "RB", True),
        ("NHR-03", "Emil Novak", 4, "CB", True),
        ("NHR-04", "Sami Orlov", 5, "CB", True),
        ("NHR-05", "Dario Voss", 3, "LB", True),
        ("NHR-06", "Kian Mercer", 6, "DM", True),
        ("NHR-07", "Leo Arden", 8, "CM", True),
        ("NHR-08", "Milo Feng", 10, "AM", True),
        ("NHR-09", "Teo Varela", 9, "ST", True),
        ("NHR-10", "Arun Kale", 7, "RW", True),
        ("NHR-11", "Niko Sarin", 11, "LW", True),
        ("NHR-12", "Pavel Orm", 12, "GK", False),
        ("NHR-13", "Jonas Vey", 13, "CB", False),
        ("NHR-14", "Isak Rune", 14, "LW", False),
        ("NHR-15", "Remy Sol", 15, "CM", False),
        ("NHR-16", "Tavi Norn", 16, "RW", False),
    ],
    "ORN": [
        ("ORN-01", "Jonas Ried", 1, "GK", True),
        ("ORN-02", "Pavel Cort", 2, "RB", True),
        ("ORN-03", "Miro Salas", 4, "CB", True),
        ("ORN-04", "Elio Brandt", 5, "CB", True),
        ("ORN-05", "Tomas Rusk", 3, "LB", True),
        ("ORN-06", "Adil Nasser", 6, "DM", True),
        ("ORN-07", "Felix Quill", 8, "CM", True),
        ("ORN-08", "Bruno Tava", 10, "AM", True),
        ("ORN-09", "Oskar Lind", 9, "ST", True),
        ("ORN-10", "Nils Hagen", 7, "RW", True),
        ("ORN-11", "Ishan Roy", 11, "LW", True),
        ("ORN-12", "Erik Vane", 12, "GK", False),
        ("ORN-13", "Lars Miro", 13, "CB", False),
        ("ORN-14", "Piero Kade", 14, "LB", False),
        ("ORN-15", "Sven Oris", 15, "CM", False),
        ("ORN-16", "Rafa Quin", 16, "RW", False),
    ],
    "VEL": [
        ("VEL-01", "Mateo Rios", 1, "GK", True),
        ("VEL-02", "Nico Salas", 2, "RB", True),
        ("VEL-03", "Pavel Dune", 4, "CB", True),
        ("VEL-04", "Owen Kest", 5, "CB", True),
        ("VEL-05", "Ilias Varn", 3, "LB", True),
        ("VEL-06", "Rafa Miro", 6, "DM", True),
        ("VEL-07", "Sergio Lune", 8, "CM", True),
        ("VEL-08", "Timo Vey", 10, "AM", True),
        ("VEL-09", "Andre Cala", 9, "ST", True),
        ("VEL-10", "Bastian Ruel", 7, "RW", True),
        ("VEL-11", "Nestor Vale", 11, "LW", True),
        ("VEL-12", "Luka Morn", 12, "GK", False),
        ("VEL-13", "Hugo Tern", 13, "CB", False),
        ("VEL-14", "Dani Fenn", 14, "LW", False),
        ("VEL-15", "Marco Ilves", 15, "CM", False),
        ("VEL-16", "Yuri Sable", 16, "RW", False),
    ],
    "KEP": [
        ("KEP-01", "Sven Halden", 1, "GK", True),
        ("KEP-02", "Piotr Vane", 2, "RB", True),
        ("KEP-03", "Mikael Orn", 4, "CB", True),
        ("KEP-04", "Tariq Bel", 5, "CB", True),
        ("KEP-05", "Jonas Kade", 3, "LB", True),
        ("KEP-06", "Emil Rask", 6, "DM", True),
        ("KEP-07", "Noah Vint", 8, "CM", True),
        ("KEP-08", "Lucas Grey", 10, "AM", True),
        ("KEP-09", "Iker Sol", 9, "ST", True),
        ("KEP-10", "Ronan Pike", 7, "RW", True),
        ("KEP-11", "Ali Mar", 11, "LW", True),
        ("KEP-12", "Theo Wren", 12, "GK", False),
        ("KEP-13", "Milan Voss", 13, "CB", False),
        ("KEP-14", "Kai Lune", 14, "LW", False),
        ("KEP-15", "Omar Seth", 15, "CM", False),
        ("KEP-16", "Felix Dare", 16, "RW", False),
    ],
}


def build_lineups(team_ids: tuple[str, str]) -> list[Player]:
    players: list[Player] = []
    for team_id in team_ids:
        for player_id, name, number, position, starter in _LINEUP_ROWS[team_id]:
            players.append(
                Player(
                    player_id=player_id,
                    name=name,
                    number=number,
                    position=position,
                    team_id=team_id,
                    starter=starter,
                )
            )
    return players


@dataclass(frozen=True)
class GoalBeat:
    minute: int
    team_id: str
    scorer_id: str
    assist_id: str | None
    home_score: int
    away_score: int
    label_id: str
    claims: tuple[str, ...]
    importance: float = 0.7
    label_type: str = "goal"
    notes: str = ""
    tags: tuple[str, ...] = ()


@dataclass(frozen=True)
class CardBeat:
    minute: int
    team_id: str
    player_id: str
    card: str
    label_id: str
    claims: tuple[str, ...]
    importance: float = 0.7
    notes: str = ""


@dataclass(frozen=True)
class SprintBeat:
    minute: int
    team_id: str
    player_id: str
    speed_kmh: float
    distance_m: float
    label_id: str
    claims: tuple[str, ...]
    importance: float = 0.5
    notes: str = ""


@dataclass(frozen=True)
class SubBeat:
    minute: int
    team_id: str
    on_id: str
    off_id: str


@dataclass(frozen=True)
class HeroBeat:
    minute: int
    label_id: str
    claims: tuple[str, ...]
    importance: float = 0.92


type Beat = GoalBeat | CardBeat | SprintBeat | SubBeat | HeroBeat


@dataclass(frozen=True)
class Fixture:
    match_id: str
    home_id: str
    away_id: str
    seed: int
    date: str
    beats: tuple[Beat, ...]

    @property
    def kickoff(self) -> datetime:
        return datetime.fromisoformat(f"{self.date}T15:00:00+00:00")


FIXTURES: tuple[Fixture, ...] = (
    Fixture(
        match_id=HERO_MATCH_ID,
        home_id="NHR",
        away_id="ORN",
        seed=20261018,
        date="2026-10-18",
        beats=(
            GoalBeat(
                23,
                "NHR",
                "NHR-09",
                "NHR-07",
                1,
                0,
                "m-023-01",
                ("Nova Harbor take a 1-0 lead", "Teo Varela finishes from inside the box"),
                0.7,
                notes="Scripted opening goal",
            ),
            SprintBeat(
                31,
                "NHR",
                "NHR-11",
                33.8,
                44.0,
                "m-031-01",
                ("Niko Sarin reaches 33.8 km/h",),
                0.5,
                notes="Verifier demo: the 72' sprint is second-fastest",
            ),
            GoalBeat(
                51,
                "ORN",
                "ORN-09",
                "ORN-08",
                1,
                1,
                "m-051-01",
                ("Orion North equalize at 1-1", "Oskar Lind finishes a central combination"),
                0.7,
                notes="Scripted equalizer",
            ),
            SubBeat(60, "NHR", "NHR-15", "NHR-07"),
            CardBeat(
                66,
                "ORN",
                "ORN-06",
                "yellow",
                "m-066-01",
                ("Adil Nasser is booked",),
                0.4,
            ),
            HeroBeat(
                72,
                "m-072-01",
                (
                    "3 Orion North players were bypassed",
                    "The pass added 0.18 expected threat",
                    "Space opened behind the right back",
                ),
            ),
            GoalBeat(
                74,
                "NHR",
                "NHR-09",
                "NHR-14",
                2,
                1,
                "m-074-01",
                ("Nova Harbor lead 2-1", "Teo Varela scores from Isak Rune's cross"),
                0.9,
                notes="Scripted winner",
            ),
            SubBeat(78, "ORN", "ORN-16", "ORN-10"),
        ),
    ),
    Fixture(
        match_id="ast-2026-1025-vel-kep",
        home_id="VEL",
        away_id="KEP",
        seed=20261025,
        date="2026-10-25",
        beats=(
            GoalBeat(
                12,
                "KEP",
                "KEP-09",
                "KEP-08",
                0,
                1,
                "m-012-01",
                ("Kepler Town lead 1-0", "Iker Sol finishes a quick transition"),
                0.7,
            ),
            GoalBeat(
                38,
                "KEP",
                "KEP-10",
                "KEP-08",
                0,
                2,
                "m-038-01",
                ("Kepler Town double the lead", "Ronan Pike scores from the right channel"),
                0.7,
            ),
            CardBeat(47, "KEP", "KEP-06", "yellow", "m-047-01", ("Emil Rask is booked",), 0.4),
            GoalBeat(
                55,
                "VEL",
                "VEL-09",
                "VEL-08",
                1,
                2,
                "m-055-01",
                ("Vela Athletic pull one back", "Andre Cala finishes a central move"),
                0.75,
            ),
            SubBeat(63, "VEL", "VEL-15", "VEL-08"),
            GoalBeat(
                68,
                "VEL",
                "VEL-10",
                "VEL-14",
                2,
                2,
                "m-068-01",
                ("Vela Athletic equalize", "Bastian Ruel arrives at the back post"),
                0.8,
            ),
            SprintBeat(
                79,
                "VEL",
                "VEL-14",
                33.2,
                42.0,
                "m-079-01",
                ("Dani Fenn reaches 33.2 km/h",),
                0.5,
                notes="Late sprint before the 82nd-minute line break",
            ),
            GoalBeat(
                84,
                "VEL",
                "VEL-09",
                "VEL-08",
                3,
                2,
                "m-084-01",
                ("Vela Athletic complete the comeback", "Andre Cala scores the late winner"),
                0.95,
                notes="Late comeback winner",
            ),
        ),
    ),
    Fixture(
        match_id="ast-2026-1101-orn-vel",
        home_id="ORN",
        away_id="VEL",
        seed=20261101,
        date="2026-11-01",
        beats=(
            GoalBeat(
                22,
                "ORN",
                "ORN-09",
                "ORN-08",
                1,
                0,
                "m-022-01",
                ("Orion North lead 1-0", "Oskar Lind finishes a central combination"),
                0.7,
            ),
            SprintBeat(
                34,
                "ORN",
                "ORN-10",
                32.9,
                38.0,
                "m-034-01",
                ("Nils Hagen reaches 32.9 km/h",),
                0.5,
                notes="Sprint peak in the Orion transition",
            ),
            CardBeat(
                58,
                "ORN",
                "ORN-06",
                "red",
                "m-058-01",
                ("Orion North are down to 10 men", "Adil Nasser is sent off"),
                0.85,
                notes="Red card changes the shape",
            ),
            SubBeat(63, "VEL", "VEL-15", "VEL-08"),
            GoalBeat(
                76,
                "VEL",
                "VEL-09",
                "VEL-10",
                1,
                1,
                "m-076-01",
                ("Vela Athletic equalize against 10", "Andre Cala scores late"),
                0.85,
            ),
        ),
    ),
    Fixture(
        match_id="ast-2026-1108-kep-nhr",
        home_id="KEP",
        away_id="NHR",
        seed=20261108,
        date="2026-11-08",
        beats=(
            SprintBeat(
                18,
                "NHR",
                "NHR-11",
                34.1,
                40.0,
                "m-018-01",
                ("Niko Sarin reaches 34.1 km/h",),
                0.5,
            ),
            GoalBeat(
                31,
                "NHR",
                "NHR-09",
                "NHR-08",
                0,
                1,
                "m-031-01",
                ("Nova Harbor lead 1-0", "Teo Varela scores after a high turnover"),
                0.7,
            ),
            CardBeat(46, "KEP", "KEP-06", "yellow", "m-046-01", ("Emil Rask is booked",), 0.4),
            GoalBeat(
                63,
                "NHR",
                "NHR-14",
                "NHR-10",
                0,
                2,
                "m-063-01",
                ("Nova Harbor double the lead", "Isak Rune scores from the right"),
                0.8,
            ),
            SubBeat(70, "KEP", "KEP-15", "KEP-08"),
        ),
    ),
    Fixture(
        match_id="ast-2026-1115-nhr-vel",
        home_id="NHR",
        away_id="VEL",
        seed=20261115,
        date="2026-11-15",
        beats=(
            GoalBeat(
                9,
                "NHR",
                "NHR-09",
                "NHR-08",
                1,
                0,
                "m-009-01",
                ("Nova Harbor lead 1-0", "Teo Varela opens the scoring"),
                0.7,
            ),
            GoalBeat(
                27,
                "VEL",
                "VEL-09",
                "VEL-08",
                1,
                1,
                "m-027-01",
                ("Vela Athletic equalize", "Andre Cala finishes a central move"),
                0.7,
            ),
            SprintBeat(
                36,
                "NHR",
                "NHR-14",
                33.6,
                41.0,
                "m-036-01",
                ("Isak Rune reaches 33.6 km/h",),
                0.5,
                notes="Sprint peak before the second-half exchange",
            ),
            GoalBeat(
                44,
                "NHR",
                "NHR-10",
                "NHR-08",
                2,
                1,
                "m-044-01",
                ("Nova Harbor lead 2-1", "Arun Kale scores before half-time"),
                0.75,
            ),
            CardBeat(52, "VEL", "VEL-06", "yellow", "m-052-01", ("Rafa Miro is booked",), 0.4),
            GoalBeat(
                61,
                "VEL",
                "VEL-10",
                "VEL-14",
                2,
                2,
                "m-061-01",
                ("Vela Athletic equalize again", "Bastian Ruel scores at the back post"),
                0.75,
            ),
            SubBeat(70, "NHR", "NHR-16", "NHR-10"),
            CardBeat(80, "VEL", "VEL-05", "yellow", "m-080-01", ("Ilias Varn is booked",), 0.4),
            GoalBeat(
                73,
                "NHR",
                "NHR-09",
                "NHR-08",
                3,
                2,
                "m-073-01",
                ("Nova Harbor lead 3-2", "Teo Varela scores his second"),
                0.85,
            ),
            GoalBeat(
                88,
                "VEL",
                "VEL-09",
                "VEL-10",
                3,
                3,
                "m-088-01",
                ("Vela Athletic equalize late", "Andre Cala completes his brace"),
                0.9,
                notes="Chaos game equalizer",
            ),
        ),
    ),
)

FIXTURES_BY_ID = {fixture.match_id: fixture for fixture in FIXTURES}


class MatchForge:
    """Generate one deterministic synthetic match from a fixture."""

    def __init__(self, fixture: Fixture) -> None:
        self.fixture = fixture
        self.seed = fixture.seed
        self.match_id = fixture.match_id
        self.home_id = fixture.home_id
        self.away_id = fixture.away_id
        self.home_team = TEAMS[self.home_id]
        self.away_team = TEAMS[self.away_id]
        self.rng = random.Random(self.seed)
        self.players = build_lineups((self.home_id, self.away_id))
        self.starters: dict[str, list[Player]] = {
            team_id: [p for p in self.players if p.team_id == team_id and p.starter]
            for team_id in (self.home_id, self.away_id)
        }
        self.bench: dict[str, list[Player]] = {
            team_id: [p for p in self.players if p.team_id == team_id and not p.starter]
            for team_id in (self.home_id, self.away_id)
        }
        self.events: list[Event] = []
        self.labels: list[MomentLabel] = []
        self.clock_seconds = 0
        self.score = Score(home=0, away=0)
        self.possession_counter = 0
        self.possession_id = "p-0000"
        self.ball_x = 50.0
        self.ball_y = 50.0
        self.done: set[str] = set()
        self.random_shots = 0
        self.beats = sorted(fixture.beats, key=lambda beat: beat.minute)
        self.beat_index = 0

    # ------------------------------------------------------------------ helpers
    def _clock(self) -> Clock:
        seconds = self.clock_seconds
        period = 1 if seconds < HALF_TIME_SECONDS else 2
        return Clock(period=period, minute=seconds // 60, second=seconds % 60)

    def _ts(self, clock: Clock) -> datetime:
        return self.fixture.kickoff + timedelta(seconds=clock.minute * 60 + clock.second)

    def _advance(self, seconds: int) -> None:
        target = min(MATCH_END_SECONDS, self.clock_seconds + seconds)
        if "halftime" not in self.done and target > HALF_TIME_SECONDS:
            target = HALF_TIME_SECONDS
        self.clock_seconds = target

    def _new_possession(self) -> str:
        self.possession_counter += 1
        self.possession_id = f"p-{self.possession_counter:04d}"
        return self.possession_id

    def _start_possession(
        self, team_id: str, x: float | None = None, y: float | None = None
    ) -> None:
        self._new_possession()
        self.ball_x = 50.0 if x is None else x
        self.ball_y = 50.0 if y is None else y
        self.current_team = team_id

    def _add(
        self,
        event_type: EventType,
        *,
        team_id: str | None = None,
        player_id: str | None = None,
        location: Location | None = None,
        end_location: Location | None = None,
        recipient_id: str | None = None,
        assist_id: str | None = None,
        pressure: float = 0.0,
        outcome: str | None = None,
        ball_speed_kmh: float | None = None,
        shot_speed_kmh: float | None = None,
        speed_kmh: float | None = None,
        distance_m: float | None = None,
        difficulty: float | None = None,
        tags: list[str] | None = None,
        possession_id: str | None = None,
        clock_override: Clock | None = None,
    ) -> Event:
        clock = clock_override or self._clock()
        event = Event(
            match_id=self.match_id,
            event_id=f"e-{len(self.events) + 1:06d}",
            ts=self._ts(clock),
            clock=clock,
            type=event_type,
            team_id=team_id,
            player_id=player_id,
            location=location or Location(x=self.ball_x, y=self.ball_y),
            end_location=end_location,
            recipient_id=recipient_id,
            assist_id=assist_id,
            pressure=max(0.0, min(1.0, pressure)),
            outcome=outcome,
            ball_speed_kmh=ball_speed_kmh,
            shot_speed_kmh=shot_speed_kmh,
            speed_kmh=speed_kmh,
            distance_m=distance_m,
            difficulty=difficulty,
            possession_id=possession_id or self.possession_id,
            score=self.score.model_copy(),
            tags=tags or [],
            synth=SynthMeta(seed=self.seed, generator=GENERATOR),
        )
        self.events.append(event)
        return event

    def _label(
        self,
        moment_id: str,
        clock: Clock,
        moment_type: str,
        importance: float,
        event_ids: list[str],
        claims: list[str],
        notes: str = "",
    ) -> None:
        self.labels.append(
            MomentLabel(
                moment_id=moment_id,
                match_id=self.match_id,
                clock=clock,
                type=moment_type,
                importance=importance,
                event_ids=event_ids,
                expected_claims=claims,
                notes=notes,
            )
        )

    def _opponent(self, team_id: str) -> str:
        return self.away_id if team_id == self.home_id else self.home_id

    def _player(self, team_id: str, *, exclude_gk: bool = True) -> Player:
        pool = self.starters[team_id]
        if exclude_gk:
            pool = [p for p in pool if p.position != "GK"]
        return self.rng.choice(pool)

    # -------------------------------------------------------------- random play
    def _random_pass(self, team_id: str) -> bool:
        passer = self._player(team_id)
        target = self.rng.choice(
            [p for p in self.starters[team_id] if p.player_id != passer.player_id]
        )
        x, y = self.ball_x, self.ball_y
        end_x = min(96.0, max(4.0, x + self.rng.uniform(4.0, 26.0)))
        end_y = min(95.0, max(5.0, y + self.rng.uniform(-22.0, 22.0)))
        dx, dy = end_x - x, end_y - y
        distance = math.hypot(dx * 1.05, dy * 0.68)
        pressure = self.rng.uniform(0.05, 0.95)
        difficulty = min(
            10.0,
            max(1.0, distance / 6.0 + pressure * 3.0 + self.rng.uniform(-1.0, 1.0)),
        )
        speed = self.rng.uniform(10.0, 26.0)
        complete = self.rng.random() < (0.96 - pressure * 0.12 - distance * 0.004)
        line_break = (
            complete
            and dx > 22
            and pressure > 0.5
            and self.rng.random() < 0.35
        )
        self._add(
            "pass",
            team_id=team_id,
            player_id=passer.player_id,
            location=Location(x=x, y=y),
            end_location=Location(x=end_x, y=end_y),
            recipient_id=target.player_id if complete else None,
            pressure=pressure,
            outcome="complete" if complete else "incomplete",
            ball_speed_kmh=round(speed, 1),
            distance_m=round(distance, 1),
            difficulty=round(difficulty, 1),
            tags=["line_break"] if line_break else [],
        )
        self.ball_x, self.ball_y = end_x, end_y
        return complete

    def _random_carry(self, team_id: str) -> None:
        player = self._player(team_id)
        x, y = self.ball_x, self.ball_y
        end_x = min(96.0, x + self.rng.uniform(4.0, 15.0))
        end_y = min(95.0, max(5.0, y + self.rng.uniform(-10.0, 10.0)))
        self._add(
            "carry",
            team_id=team_id,
            player_id=player.player_id,
            location=Location(x=x, y=y),
            end_location=Location(x=end_x, y=end_y),
            pressure=self.rng.uniform(0.05, 0.9),
            outcome="complete",
            distance_m=round(math.hypot((end_x - x) * 1.05, (end_y - y) * 0.68), 1),
        )
        self.ball_x, self.ball_y = end_x, end_y

    def _random_pressure(self, team_id: str) -> None:
        opponent = self._opponent(team_id)
        presser = self._player(opponent)
        self._add(
            "pressure",
            team_id=opponent,
            player_id=presser.player_id,
            location=Location(x=self.ball_x, y=self.ball_y),
            pressure=self.rng.uniform(0.6, 0.95),
            outcome="applied",
        )

    def _random_tackle(self, team_id: str) -> bool:
        opponent = self._opponent(team_id)
        tackler = self._player(opponent)
        won = self.rng.random() < 0.45
        self._add(
            "tackle",
            team_id=opponent,
            player_id=tackler.player_id,
            location=Location(x=self.ball_x, y=self.ball_y),
            pressure=self.rng.uniform(0.5, 0.95),
            outcome="won" if won else "lost",
        )
        return not won

    def _random_foul(self, team_id: str) -> None:
        opponent = self._opponent(team_id)
        fouler = self._player(opponent)
        self._add(
            "foul",
            team_id=opponent,
            player_id=fouler.player_id,
            location=Location(x=self.ball_x, y=self.ball_y),
            pressure=self.rng.uniform(0.4, 0.9),
            outcome="foul",
        )
        if self.rng.random() < 0.06:
            self._add(
                "card",
                team_id=opponent,
                player_id=fouler.player_id,
                location=Location(x=self.ball_x, y=self.ball_y),
                pressure=0.0,
                outcome="yellow",
                tags=["yellow_card"],
            )

    def _random_shot(self, team_id: str) -> None:
        self.random_shots += 1
        shooter = self._player(team_id)
        outcome = self.rng.choices(
            ["saved", "off_target", "blocked"], weights=[0.45, 0.35, 0.2], k=1
        )[0]
        self._add(
            "shot",
            team_id=team_id,
            player_id=shooter.player_id,
            location=Location(x=self.ball_x, y=self.ball_y),
            end_location=Location(x=100.0, y=50.0),
            pressure=self.rng.uniform(0.2, 0.9),
            outcome=outcome,
            shot_speed_kmh=round(self.rng.uniform(70.0, 115.0), 1),
        )

    def _random_possession(self) -> None:
        team_id = self.rng.choice([self.home_id, self.away_id])
        self._start_possession(
            team_id,
            x=self.rng.uniform(25.0, 60.0),
            y=self.rng.uniform(20.0, 80.0),
        )
        if self.rng.random() < 0.06:
            self._random_foul(team_id)
        for _ in range(self.rng.randint(3, 6)):
            if self.clock_seconds >= MATCH_END_SECONDS:
                return
            if self.ball_x > 78 and self.random_shots < 22 and self.rng.random() < 0.14:
                self._random_shot(team_id)
                self._advance(self.rng.randint(3, 6))
                return
            action = self.rng.choices(
                ["pass", "carry", "pressure", "tackle"],
                weights=[0.64, 0.16, 0.1, 0.1],
                k=1,
            )[0]
            if action == "pass" and not self._random_pass(team_id):
                return
            if action == "carry":
                self._random_carry(team_id)
            elif action == "pressure":
                self._random_pressure(team_id)
            elif action == "tackle" and not self._random_tackle(team_id):
                return
            self._advance(self.rng.randint(3, 8))

    # ------------------------------------------------------------ scripted beats
    def _inject_goal(self, beat: GoalBeat) -> None:
        self._start_possession(beat.team_id, 62.0, 45.0)
        build_event: Event | None = None
        if beat.assist_id:
            build_event = self._add(
                "pass",
                team_id=beat.team_id,
                player_id=beat.assist_id,
                location=Location(x=62.0, y=45.0),
                end_location=Location(x=80.0, y=48.0),
                recipient_id=beat.scorer_id,
                pressure=0.4,
                outcome="complete",
                ball_speed_kmh=20.0,
                distance_m=18.0,
                difficulty=5.5,
                tags=["scripted"],
            )
            self._advance(3)
        shot = self._add(
            "shot",
            team_id=beat.team_id,
            player_id=beat.scorer_id,
            location=Location(x=82.0, y=48.0),
            end_location=Location(x=100.0, y=50.0),
            pressure=0.35,
            outcome="goal",
            shot_speed_kmh=round(self.rng.uniform(90.0, 108.0), 1),
            tags=["scripted", *beat.tags],
        )
        self.score = Score(home=beat.home_score, away=beat.away_score)
        goal = self._add(
            "goal",
            team_id=beat.team_id,
            player_id=beat.scorer_id,
            location=Location(x=100.0, y=50.0),
            assist_id=beat.assist_id,
            pressure=0.0,
            outcome="scored",
            tags=["scripted", *beat.tags],
        )
        self._add(
            "kickoff",
            team_id=self._opponent(beat.team_id),
            player_id=self._player(self._opponent(beat.team_id)).player_id,
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
        )
        event_ids = ([build_event.event_id] if build_event else []) + [
            shot.event_id,
            goal.event_id,
        ]
        self._label(
            beat.label_id,
            shot.clock,
            beat.label_type,
            beat.importance,
            event_ids,
            list(beat.claims),
            beat.notes,
        )
        self._advance(5)

    def _inject_card(self, beat: CardBeat) -> None:
        foul = self._add(
            "foul",
            team_id=beat.team_id,
            player_id=beat.player_id,
            location=Location(x=55.0, y=50.0),
            pressure=0.6,
            outcome="foul",
        )
        card = self._add(
            "card",
            team_id=beat.team_id,
            player_id=beat.player_id,
            location=Location(x=55.0, y=50.0),
            pressure=0.0,
            outcome=beat.card,
            tags=[f"{beat.card}_card"],
        )
        self._label(
            beat.label_id,
            card.clock,
            f"{beat.card}_card",
            beat.importance,
            [foul.event_id, card.event_id],
            list(beat.claims),
            beat.notes,
        )
        self._advance(4)

    def _inject_sprint(self, beat: SprintBeat) -> None:
        sprint = self._add(
            "sprint",
            team_id=beat.team_id,
            player_id=beat.player_id,
            location=Location(x=44.0, y=30.0),
            end_location=Location(x=70.0, y=36.0),
            pressure=0.2,
            outcome="sprint",
            speed_kmh=beat.speed_kmh,
            distance_m=beat.distance_m,
            tags=["speed_alert"],
        )
        self._label(
            beat.label_id,
            sprint.clock,
            "sprint_peak",
            beat.importance,
            [sprint.event_id],
            list(beat.claims),
            beat.notes,
        )

    def _inject_sub(self, beat: SubBeat) -> None:
        self._add(
            "substitution",
            team_id=beat.team_id,
            player_id=beat.on_id,
            recipient_id=beat.off_id,
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="on",
            tags=["substitution"],
        )

    def _inject_hero(self, beat: HeroBeat) -> None:
        if self.home_id != "NHR" or self.away_id != "ORN":
            raise ValueError("HeroBeat is only valid for the Nova Harbor vs Orion North fixture")
        self._start_possession("NHR", 38.0, 52.0)
        self.possession_id = "p-hero"
        press = self._add(
            "pressure",
            team_id="ORN",
            player_id="ORN-06",
            location=Location(x=42.0, y=52.0),
            pressure=0.9,
            outcome="applied",
            tags=["press_trap", "hero"],
        )
        self._advance(2)
        line_break = self._add(
            "pass",
            team_id="NHR",
            player_id="NHR-08",
            location=Location(x=38.0, y=52.0),
            end_location=Location(x=62.0, y=44.0),
            recipient_id="NHR-14",
            pressure=0.82,
            outcome="complete",
            ball_speed_kmh=18.4,
            distance_m=24.6,
            difficulty=8.7,
            tags=["line_break", "under_press", "hero"],
        )
        self._advance(2)
        sprint = self._add(
            "sprint",
            team_id="NHR",
            player_id="NHR-14",
            location=Location(x=62.0, y=44.0),
            end_location=Location(x=74.0, y=48.0),
            pressure=0.3,
            outcome="sprint",
            speed_kmh=33.4,
            distance_m=26.0,
            tags=["speed_alert", "hero"],
        )
        self._advance(2)
        carry = self._add(
            "carry",
            team_id="NHR",
            player_id="NHR-14",
            location=Location(x=62.0, y=44.0),
            end_location=Location(x=74.0, y=48.0),
            pressure=0.45,
            outcome="complete",
            distance_m=14.0,
            tags=["hero"],
        )
        self._advance(3)
        shot = self._add(
            "shot",
            team_id="NHR",
            player_id="NHR-14",
            location=Location(x=78.0, y=50.0),
            end_location=Location(x=100.0, y=50.0),
            pressure=0.55,
            outcome="saved",
            shot_speed_kmh=104.2,
            tags=["big_chance", "hero"],
        )
        self._label(
            beat.label_id,
            line_break.clock,
            "line_break_under_press",
            beat.importance,
            [
                press.event_id,
                line_break.event_id,
                sprint.event_id,
                carry.event_id,
                shot.event_id,
            ],
            list(beat.claims),
            "Hero moment; the shot is saved and the goal follows at 74'",
        )

    def _inject_halftime(self) -> None:
        self.clock_seconds = HALF_TIME_SECONDS
        self._add(
            "half_time",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="half_time",
            clock_override=Clock(period=1, minute=45, second=0),
            possession_id="p-0000",
        )
        self._add(
            "kickoff",
            team_id=self.away_id,
            player_id=self._player(self.away_id).player_id,
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
            clock_override=Clock(period=2, minute=45, second=0),
            possession_id="p-0000",
        )

    def _inject(self, beat: Beat) -> None:
        if isinstance(beat, GoalBeat):
            self._inject_goal(beat)
        elif isinstance(beat, CardBeat):
            self._inject_card(beat)
        elif isinstance(beat, SprintBeat):
            self._inject_sprint(beat)
        elif isinstance(beat, SubBeat):
            self._inject_sub(beat)
        elif isinstance(beat, HeroBeat):
            self._inject_hero(beat)
        else:
            raise TypeError(f"unknown beat: {beat!r}")

    def _maybe_scripted(self) -> None:
        while True:
            if "halftime" not in self.done and self.clock_seconds >= HALF_TIME_SECONDS:
                if self.beat_index < len(self.beats) and self.beats[self.beat_index].minute < 45:
                    self._inject(self.beats[self.beat_index])
                    self.beat_index += 1
                    continue
                self.done.add("halftime")
                self._inject_halftime()
                return
            if self.beat_index >= len(self.beats):
                return
            beat = self.beats[self.beat_index]
            if self.clock_seconds < beat.minute * 60:
                return
            self.beat_index += 1
            self._inject(beat)

    # ------------------------------------------------------------------ public
    def generate(self) -> MatchBundle:
        self._add(
            "kickoff",
            team_id=self.home_id,
            player_id=self._player(self.home_id).player_id,
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
            clock_override=Clock(period=1, minute=0, second=0),
            possession_id="p-0000",
        )
        self._advance(3)

        while self.clock_seconds < MATCH_END_SECONDS and len(self.events) < 1550:
            self._maybe_scripted()
            if self.clock_seconds >= MATCH_END_SECONDS:
                break
            self._random_possession()

        self._add(
            "full_time",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="full_time",
            clock_override=Clock(period=2, minute=94, second=0),
            possession_id="p-0000",
        )

        match = MatchMeta(
            match_id=self.match_id,
            competition="Aster League",
            season="2026",
            date=self.fixture.date,
            kickoff_utc=self.fixture.kickoff,
            venue=self.home_team.venue,
            home=self.home_team,
            away=self.away_team,
            lineups=self.players,
            final_score=self.score,
            seed=self.seed,
            generator=GENERATOR,
        )
        return MatchBundle(match=match, events=self.events, labels=self.labels)

    def write(self, output_dir: str | Path) -> MatchBundle:
        bundle = self.generate()
        out = Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        (out / "events.jsonl").write_text(
            "\n".join(
                json.dumps(e.model_dump(mode="json"), ensure_ascii=False) for e in bundle.events
            )
            + "\n",
            encoding="utf-8",
        )
        (out / "match.json").write_text(
            json.dumps(bundle.match.model_dump(mode="json"), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        (out / "labels.json").write_text(
            json.dumps(
                [label.model_dump(mode="json") for label in bundle.labels],
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        return bundle


def generate_match(
    match_id: str = HERO_MATCH_ID, output_dir: str | Path | None = None
) -> MatchBundle:
    fixture = FIXTURES_BY_ID.get(match_id)
    if fixture is None:
        raise KeyError(f"unknown match_id: {match_id}")
    forge = MatchForge(fixture)
    if output_dir is not None:
        return forge.write(output_dir)
    return forge.generate()


def generate_all(output_root: str | Path = "data/demo") -> list[MatchBundle]:
    root = Path(output_root)
    return [MatchForge(fixture).write(root / fixture.match_id) for fixture in FIXTURES]
