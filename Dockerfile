FROM node:22-slim AS web
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --include=dev
COPY web/ ./
RUN npm run build

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock README.md ./
COPY src ./src
COPY data ./data
COPY --from=web /app/web/dist ./web/dist

RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["sh", "-c", "uvicorn matchmind.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
