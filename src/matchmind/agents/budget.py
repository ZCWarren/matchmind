"""In-process model-call budgets for public live requests."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar

from matchmind.config import settings

_active_match: ContextVar[str | None] = ContextVar("live_budget_match", default=None)
_calls: dict[str, int] = defaultdict(int)


def consume_llm_call() -> None:
    match_id = _active_match.get()
    if match_id is None:
        return
    if _calls[match_id] >= settings.max_llm_calls_per_match:
        raise RuntimeError(f"Live model-call budget exhausted for match {match_id}")
    _calls[match_id] += 1


@contextmanager
def live_budget(match_id: str) -> Iterator[None]:
    token = _active_match.set(match_id)
    try:
        yield
    finally:
        _active_match.reset(token)


def budget_snapshot(match_id: str) -> int:
    return _calls[match_id]


def reset_budgets() -> None:
    _calls.clear()
