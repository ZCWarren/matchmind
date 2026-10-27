"""FastAPI entrypoint: API, WebSocket replay, and the built Studio SPA."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from matchmind import __version__
from matchmind.api.analytics import router as analytics_router
from matchmind.api.insights import router as insights_router
from matchmind.api.matches import router as matches_router
from matchmind.api.observability import configure_observability
from matchmind.api.recap import router as recap_router
from matchmind.api.replay import router as replay_router
from matchmind.api.security import LiveRateLimitMiddleware
from matchmind.config import settings

configure_observability()

app = FastAPI(
    title="MatchMind",
    version=__version__,
    description="Real-time explainable match intelligence for football broadcast.",
)
app.add_middleware(LiveRateLimitMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8010"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analytics_router)
app.include_router(insights_router)
app.include_router(recap_router)
app.include_router(replay_router)
app.include_router(matches_router)


WEB_DIST = Path(__file__).resolve().parents[3] / "web" / "dist"


@app.get("/")
def root():
    index = WEB_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return {
        "name": "MatchMind",
        "version": __version__,
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {
        "status": "ok",
        "version": __version__,
        "provider": settings.llm_provider,
        "demo_mode": settings.demo_mode,
    }


@app.get("/api/config")
def app_config() -> dict[str, str | bool]:
    return {
        "provider": settings.llm_provider,
        "demo_mode": settings.demo_mode,
        "allow_live_generation": settings.allow_live_generation,
        "public_base_url": settings.public_base_url,
    }

if WEB_DIST.exists():
    assets = WEB_DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        blocked = ("api/", "docs", "openapi")
        if full_path.startswith(blocked) or ".." in Path(full_path).parts:
            raise HTTPException(status_code=404, detail="Not found")
        root = WEB_DIST.resolve()
        candidate = (WEB_DIST / full_path).resolve()
        if not candidate.is_relative_to(root):
            raise HTTPException(status_code=404, detail="Not found")
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(WEB_DIST / "index.html")
