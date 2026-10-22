"""Deterministic synthetic match generator.

The generator is intentionally event-level, not a full 22-player physics
engine. It produces a realistic-shaped event stream with coordinates,
pressure, pass quality, shots, cards, substitutions, and a scripted hero
moment for the demo. Ground-truth labels are written separately and are
never fed to the agents.
"""

from __future__ import annotations

import json
import math
import random
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
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

GENERATOR = "matchforge-v0.1"
MATCH_ID = "ast-2026-1018-nhr-orn"
DEFAULT_SEED = 20261018
KICKOFF = datetime(2026, 10, 18, 15, 0, tzinfo=UTC)
MATCH_END_SECONDS = 94 * 60
HALF_TIME_SECONDS = 45 * 60

HOME_TEAM = Team(
    team_id="NHR",
    name="Nova Harbor",
    short_name="Nova",
    color="#0FB5A6",
    venue="Meridian Park",
)
AWAY_TEAM = Team(
    team_id="ORN",
    name="Orion North",
    short_name="Orion",
    color="#E23B3B",
    venue="Orion Park",
)

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
}


def build_lineups() -> list[Player]:
    players: list[Player] = []
    for team_id, rows in _LINEUP_ROWS.items():
        for player_id, name, number, position, starter in rows:
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


class MatchForge:
    """Generate one deterministic synthetic match."""

    def __init__(self, seed: int = DEFAULT_SEED, match_id: str = MATCH_ID) -> None:
        self.seed = seed
        self.match_id = match_id
        self.rng = random.Random(seed)
        self.players = build_lineups()
        self.starters: dict[str, list[Player]] = {
            "NHR": [p for p in self.players if p.team_id == "NHR" and p.starter],
            "ORN": [p for p in self.players if p.team_id == "ORN" and p.starter],
        }
        self.bench: dict[str, list[Player]] = {
            "NHR": [p for p in self.players if p.team_id == "NHR" and not p.starter],
            "ORN": [p for p in self.players if p.team_id == "ORN" and not p.starter],
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

    # ------------------------------------------------------------------ helpers
    def _clock(self) -> Clock:
        seconds = self.clock_seconds
        period = 1 if seconds < HALF_TIME_SECONDS else 2
        return Clock(period=period, minute=seconds // 60, second=seconds % 60)

    @staticmethod
    def _ts(clock: Clock) -> datetime:
        return KICKOFF + timedelta(seconds=clock.minute * 60 + clock.second)

    def _advance(self, seconds: int) -> None:
        target = min(MATCH_END_SECONDS, self.clock_seconds + seconds)
        # Do not skip past half-time before the half-time event is emitted.
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

    @staticmethod
    def _opponent(team_id: str) -> str:
        return "ORN" if team_id == "NHR" else "NHR"

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
        complete = self.rng.random() < (0.93 - pressure * 0.12 - distance * 0.004)
        event = self._add(
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
            tags=["line_break"] if complete and dx > 18 else [],
        )
        self.ball_x, self.ball_y = end_x, end_y
        if not complete:
            return False
        if event.distance_m and event.distance_m > 30:
            event.tags.append("long_pass")
        return True

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
        if self.rng.random() < 0.10:
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
        team_id = self.rng.choice(["NHR", "ORN"])
        self._start_possession(
            team_id,
            x=self.rng.uniform(25.0, 60.0),
            y=self.rng.uniform(20.0, 80.0),
        )
        if self.rng.random() < 0.08:
            self._random_foul(team_id)
        for _ in range(self.rng.randint(3, 6)):
            if self.clock_seconds >= MATCH_END_SECONDS:
                return
            if (
                self.ball_x > 78
                and self.random_shots < 22
                and self.rng.random() < 0.14
            ):
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
    def _scripted_goal_23(self) -> None:
        self._start_possession("NHR", 62.0, 42.0)
        assist = self._add(
            "pass",
            team_id="NHR",
            player_id="NHR-07",
            location=Location(x=62.0, y=42.0),
            end_location=Location(x=78.0, y=45.0),
            recipient_id="NHR-09",
            pressure=0.4,
            outcome="complete",
            ball_speed_kmh=21.0,
            distance_m=16.5,
            difficulty=5.2,
        )
        self._advance(3)
        shot = self._add(
            "shot",
            team_id="NHR",
            player_id="NHR-09",
            location=Location(x=80.0, y=45.0),
            end_location=Location(x=100.0, y=50.0),
            pressure=0.35,
            outcome="goal",
            shot_speed_kmh=98.2,
            tags=["scripted", "opening_goal"],
        )
        self.score = Score(home=1, away=0)
        goal = self._add(
            "goal",
            team_id="NHR",
            player_id="NHR-09",
            location=Location(x=100.0, y=50.0),
            assist_id="NHR-07",
            pressure=0.0,
            outcome="scored",
            tags=["scripted"],
        )
        self._add(
            "kickoff",
            team_id="ORN",
            player_id="ORN-09",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
        )
        self._label(
            "m-023-01",
            shot.clock,
            "goal",
            0.7,
            [assist.event_id, shot.event_id, goal.event_id],
            ["Nova Harbor take a 1-0 lead", "Teo Varela finishes from inside the box"],
            "Scripted opening goal",
        )
        self._advance(6)

    def _scripted_sprint_31(self) -> None:
        sprint = self._add(
            "sprint",
            team_id="NHR",
            player_id="NHR-11",
            location=Location(x=44.0, y=28.0),
            end_location=Location(x=72.0, y=34.0),
            pressure=0.2,
            outcome="sprint",
            speed_kmh=33.8,
            distance_m=44.0,
            tags=["speed_alert"],
        )
        self._label(
            "m-031-01",
            sprint.clock,
            "sprint_peak",
            0.5,
            [sprint.event_id],
            ["Niko Sarin reaches 33.8 km/h"],
            "Used by the verifier demo: the 72' sprint is second-fastest, not fastest",
        )

    def _scripted_halftime(self) -> None:
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
            team_id="NHR",
            player_id="NHR-09",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
            clock_override=Clock(period=2, minute=45, second=0),
            possession_id="p-0000",
        )

    def _scripted_goal_51(self) -> None:
        self._start_possession("ORN", 66.0, 55.0)
        assist = self._add(
            "pass",
            team_id="ORN",
            player_id="ORN-08",
            location=Location(x=66.0, y=55.0),
            end_location=Location(x=82.0, y=50.0),
            recipient_id="ORN-09",
            pressure=0.45,
            outcome="complete",
            ball_speed_kmh=19.5,
            distance_m=17.0,
            difficulty=5.8,
        )
        self._advance(4)
        shot = self._add(
            "shot",
            team_id="ORN",
            player_id="ORN-09",
            location=Location(x=82.0, y=50.0),
            end_location=Location(x=100.0, y=50.0),
            pressure=0.4,
            outcome="goal",
            shot_speed_kmh=101.4,
            tags=["scripted", "equalizer"],
        )
        self.score = Score(home=1, away=1)
        goal = self._add(
            "goal",
            team_id="ORN",
            player_id="ORN-09",
            location=Location(x=100.0, y=50.0),
            assist_id="ORN-08",
            pressure=0.0,
            outcome="scored",
            tags=["scripted"],
        )
        self._add(
            "kickoff",
            team_id="NHR",
            player_id="NHR-09",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
        )
        self._label(
            "m-051-01",
            shot.clock,
            "goal",
            0.7,
            [assist.event_id, shot.event_id, goal.event_id],
            ["Orion North equalize at 1-1", "Oskar Lind finishes a central combination"],
            "Scripted equalizer",
        )
        self._advance(6)

    def _scripted_subs_60(self) -> None:
        self._add(
            "substitution",
            team_id="NHR",
            player_id="NHR-15",
            recipient_id="NHR-07",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="on",
            tags=["substitution"],
        )

    def _scripted_card_66(self) -> None:
        self._add(
            "foul",
            team_id="ORN",
            player_id="ORN-06",
            location=Location(x=55.0, y=50.0),
            pressure=0.6,
            outcome="foul",
        )
        self._add(
            "card",
            team_id="ORN",
            player_id="ORN-06",
            location=Location(x=55.0, y=50.0),
            pressure=0.0,
            outcome="yellow",
            tags=["yellow_card"],
        )

    def _scripted_hero_72(self) -> None:
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
            "m-072-01",
            line_break.clock,
            "line_break_under_press",
            0.92,
            [
                press.event_id,
                line_break.event_id,
                sprint.event_id,
                carry.event_id,
                shot.event_id,
            ],
            [
                "3 Orion North players were bypassed",
                "The pass added 0.18 expected threat",
                "Space opened behind the right back",
            ],
            "Hero moment for the demo; the shot is saved and the goal follows at 74'",
        )

    def _scripted_goal_74(self) -> None:
        self._start_possession("NHR", 70.0, 40.0)
        cross = self._add(
            "pass",
            team_id="NHR",
            player_id="NHR-14",
            location=Location(x=70.0, y=40.0),
            end_location=Location(x=88.0, y=55.0),
            recipient_id="NHR-09",
            pressure=0.4,
            outcome="complete",
            ball_speed_kmh=22.0,
            distance_m=20.0,
            difficulty=6.1,
            tags=["cross", "hero"],
        )
        self._advance(3)
        shot = self._add(
            "shot",
            team_id="NHR",
            player_id="NHR-09",
            location=Location(x=88.0, y=55.0),
            end_location=Location(x=100.0, y=50.0),
            pressure=0.3,
            outcome="goal",
            shot_speed_kmh=92.0,
            tags=["scripted", "winner"],
        )
        self.score = Score(home=2, away=1)
        goal = self._add(
            "goal",
            team_id="NHR",
            player_id="NHR-09",
            location=Location(x=100.0, y=50.0),
            assist_id="NHR-14",
            pressure=0.0,
            outcome="scored",
            tags=["scripted"],
        )
        self._add(
            "kickoff",
            team_id="ORN",
            player_id="ORN-09",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="kickoff",
        )
        self._label(
            "m-074-01",
            shot.clock,
            "goal",
            0.9,
            [cross.event_id, shot.event_id, goal.event_id],
            ["Nova Harbor lead 2-1", "Teo Varela scores from Isak Rune's cross"],
            "Scripted winner",
        )
        self._advance(6)

    def _scripted_subs_78(self) -> None:
        self._add(
            "substitution",
            team_id="ORN",
            player_id="ORN-16",
            recipient_id="ORN-10",
            location=Location(x=50.0, y=50.0),
            pressure=0.0,
            outcome="on",
            tags=["substitution"],
        )

    def _maybe_scripted(self) -> None:
        beats: list[tuple[str, int, Callable[[], None]]] = [
            ("goal23", 23 * 60, self._scripted_goal_23),
            ("sprint31", 31 * 60, self._scripted_sprint_31),
            ("halftime", HALF_TIME_SECONDS, self._scripted_halftime),
            ("goal51", 51 * 60, self._scripted_goal_51),
            ("subs60", 60 * 60, self._scripted_subs_60),
            ("card66", 66 * 60, self._scripted_card_66),
            ("hero72", 72 * 60, self._scripted_hero_72),
            ("goal74", 74 * 60, self._scripted_goal_74),
            ("subs78", 78 * 60, self._scripted_subs_78),
        ]
        for key, threshold, action in beats:
            if key not in self.done and self.clock_seconds >= threshold:
                self.done.add(key)
                action()

    # ------------------------------------------------------------------ public
    def generate(self) -> MatchBundle:
        self._add(
            "kickoff",
            team_id="NHR",
            player_id="NHR-09",
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

        # Ensure the final whistle is the last event even if a scripted beat
        # pushed the clock to the end.
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
            date="2026-10-18",
            kickoff_utc=KICKOFF,
            venue=HOME_TEAM.venue,
            home=HOME_TEAM,
            away=AWAY_TEAM,
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


def generate_match(seed: int = DEFAULT_SEED, output_dir: str | Path | None = None) -> MatchBundle:
    forge = MatchForge(seed=seed)
    if output_dir is not None:
        return forge.write(output_dir)
    return forge.generate()
