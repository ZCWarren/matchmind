.PHONY: install smoke data dev test lint web-install web-build web-dev

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

web-install:
	cd web && npm install --include=dev

web-build:
	cd web && npm run build

web-dev:
	cd web && npm run dev
