"""Small async retry helper for transient model and transport failures."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable


async def retry_async[T](
    operation: Callable[[], Awaitable[T]],
    *,
    attempts: int = 2,
    delay_seconds: float = 0.35,
) -> T:
    if attempts < 1:
        raise ValueError("attempts must be >= 1")
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            return await operation()
        except Exception as exc:  # noqa: BLE001 - caller owns the final fallback
            last_error = exc
            if attempt + 1 < attempts:
                await asyncio.sleep(delay_seconds * (attempt + 1))
    assert last_error is not None
    raise last_error
