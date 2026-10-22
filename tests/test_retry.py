"""Retry helper contract for transient agent failures."""

from __future__ import annotations

import pytest

from matchmind.agents.retry import retry_async


async def test_retry_recovers_from_one_failure() -> None:
    calls = 0

    async def operation() -> str:
        nonlocal calls
        calls += 1
        if calls == 1:
            raise TimeoutError("transient")
        return "ok"

    result = await retry_async(operation, attempts=2, delay_seconds=0)
    assert result == "ok"
    assert calls == 2


async def test_retry_reraises_after_attempts() -> None:
    calls = 0

    async def operation() -> str:
        nonlocal calls
        calls += 1
        raise RuntimeError("still down")

    with pytest.raises(RuntimeError, match="still down"):
        await retry_async(operation, attempts=2, delay_seconds=0)
    assert calls == 2
