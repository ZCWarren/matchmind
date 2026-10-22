"""Deterministic expected-threat grid (version xt-grid-v1)."""

from __future__ import annotations

from matchmind.models.event import Location

XT_VERSION = "xt-grid-v1"

_X = (0.0, 20.0, 40.0, 60.0, 80.0, 100.0)
_Y = (0.0, 20.0, 40.0, 60.0, 80.0, 100.0)

# Rows are y bins; columns are x bins. Values rise toward the opponent goal
# (x=100, y=50) and fall near the touchlines.
_VALUES = (
    (0.01, 0.01, 0.01, 0.01, 0.01, 0.01),
    (0.02, 0.03, 0.05, 0.10, 0.15, 0.20),
    (0.03, 0.05, 0.10, 0.25, 0.45, 0.60),
    (0.03, 0.05, 0.11, 0.27, 0.47, 0.62),
    (0.02, 0.03, 0.06, 0.12, 0.20, 0.28),
    (0.01, 0.01, 0.01, 0.01, 0.01, 0.01),
)


def _bracket(value: float, points: tuple[float, ...]) -> tuple[int, int, float]:
    if value <= points[0]:
        return 0, 0, 0.0
    if value >= points[-1]:
        return len(points) - 1, len(points) - 1, 0.0
    for index in range(len(points) - 1):
        if points[index] <= value <= points[index + 1]:
            span = points[index + 1] - points[index]
            return index, index + 1, (value - points[index]) / span
    return len(points) - 1, len(points) - 1, 0.0


def xt(location: Location) -> float:
    """Bilinear expected threat for a normalized pitch location."""
    x0, x1, tx = _bracket(location.x, _X)
    y0, y1, ty = _bracket(location.y, _Y)
    top = _VALUES[y0][x0] * (1 - tx) + _VALUES[y0][x1] * tx
    bottom = _VALUES[y1][x0] * (1 - tx) + _VALUES[y1][x1] * tx
    value = top * (1 - ty) + bottom * ty
    return round(value, 4)


def pass_xt_delta(start: Location, end: Location) -> float:
    """Threat added by a completed pass. Negative values are clamped to 0."""
    return round(max(0.0, xt(end) - xt(start)), 4)
