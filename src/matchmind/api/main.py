"""Minimal FastAPI entrypoint for the D0 hello-world deploy."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from matchmind import __version__
from matchmind.api.analytics import router as analytics_router
from matchmind.api.insights import router as insights_router
from matchmind.api.matches import router as matches_router
from matchmind.config import settings

app = FastAPI(
    title="MatchMind",
    version=__version__,
    description="Real-time explainable match intelligence for football broadcast.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8010"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analytics_router)
app.include_router(insights_router)
app.include_router(matches_router)


@app.get("/")
def root() -> dict[str, str]:
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
        "provider": settings.llm_provider,
        "demo_mode": settings.demo_mode,
    }
