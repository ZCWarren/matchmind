.PHONY: install smoke dev test lint

install:
	uv sync --extra dev

smoke:
	uv run python scripts/smoke_deepseek.py

dev:
	uv run uvicorn matchmind.api.main:app --reload --port 8000

test:
	uv run pytest -q

lint:
	uv run ruff check .
