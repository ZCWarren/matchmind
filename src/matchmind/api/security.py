"""Small fixed-window rate limiter for public model-generating endpoints."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from matchmind.config import settings


class LiveRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    def retry_after(self, key: str, now: float | None = None) -> int:
        current = time.monotonic() if now is None else now
        window = self._requests[key]
        while window and current - window[0] >= 60:
            window.popleft()
        if len(window) < settings.live_rate_limit_per_minute:
            window.append(current)
            return 0
        return max(1, round(60 - (current - window[0])))

    def reset(self) -> None:
        self._requests.clear()


live_rate_limiter = LiveRateLimiter()


class LiveRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        is_live_path = request.method == "POST" and request.url.path.endswith(
            ("/copilot", "/insights")
        )
        if not is_live_path:
            return await call_next(request)
        client = request.client.host if request.client else "unknown"
        retry_after = live_rate_limiter.retry_after(client)
        if retry_after:
            return JSONResponse(
                {"detail": "Too many live requests; retry shortly"},
                status_code=429,
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)
