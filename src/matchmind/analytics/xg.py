"""Deterministic expected-goals model (version xg-v1)."""

from __future__ import annotations

import math

from matchmind.models.event import Location

XG_VERSION = "xg-v1"


def shot_xg(location: Location, pressure: float = 0.0) -> float:
    """Estimate xG from shot location and pressure.

    The model is deliberately small and explainable:
    - distance to the goal center (100, 50) in metres
    - angle subtended by the goal posts (y=44 and y=56)
    - pressure penalty

    It is calibrated for synthetic data realism, not for betting or official
    stats. The formula is versioned and covered by unit tests.
    """
    dx = max(0.1, (100.0 - location.x) * 1.05)
    dy = (location.y - 50.0) * 0.68
    distance = math.hypot(dx, dy)
    post_a = math.atan2((44.0 - location.y) * 0.68, dx)
    post_b = math.atan2((56.0 - location.y) * 0.68, dx)
    angle = abs(post_b - post_a)
    angle_factor = 0.5 + 0.5 * min(1.0, angle / (math.pi / 4.0))
    distance_factor = math.exp(-distance / 14.0)
    pressure_factor = 1.0 - 0.35 * max(0.0, min(1.0, pressure))
    value = 1.15 * distance_factor * angle_factor * pressure_factor
    return round(max(0.01, min(0.90, value)), 3)
