"""MatchForge: deterministic, football-realistic synthetic event data."""

from matchmind.matchforge.generator import (
    FIXTURES,
    HERO_MATCH_ID,
    MatchForge,
    generate_all,
    generate_match,
)

__all__ = [
    "FIXTURES",
    "HERO_MATCH_ID",
    "MatchForge",
    "generate_all",
    "generate_match",
]
