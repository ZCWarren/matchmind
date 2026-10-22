.PHONY: install smoke dev test lint

install:
	uv sync --extra dev

smoke:
	uv run python scripts/smoke_deepseek.py

data:
	uv run python -m matchmind.matchforge

dev:
	uv run uvicorn matchmind.api.main:app --reload --port 8010

test:
	uv run pytest -q

lint:
	uv run ruff check .
