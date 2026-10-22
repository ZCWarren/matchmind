"""Minimal FastAPI entrypoint for the D0 hello-world deploy."""

from fastapi import FastAPI

from matchmind import __version__
from matchmind.config import settings

app = FastAPI(
    title="MatchMind",
    version=__version__,
    description="Real-time explainable match intelligence for football broadcast.",
)


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
