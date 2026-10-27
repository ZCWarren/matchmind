# Deploying MatchMind

The image is a single container: FastAPI API, WebSocket replay, MCP route, and the
built Studio / Overlay / Fan frontend. Synthetic data and the hero insight cache
are committed, so the public demo works without a model key.

## Required production settings

```env
DEMO_MODE=replay
ALLOW_LIVE_GENERATION=false
PUBLIC_BASE_URL=https://your-host.example
```

`ALLOW_LIVE_GENERATION=false` makes `POST /insights` serve only cached results.
This prevents visitors from spending the owner's model budget. Live generation
remains available locally with `ALLOW_LIVE_GENERATION=true`.

Do not set `DEEPSEEK_API_KEY` for a cached-only public demo.

## Local container check

```bash
docker build -t matchmind .
docker run --rm -p 8010:8000 \
  -e DEMO_MODE=replay -e ALLOW_LIVE_GENERATION=false \
  matchmind
```

The image builds the Vite frontend and the Python app into one container. If the
Docker build cannot reach npmjs.org, pass a reachable registry mirror:

```bash
docker build --build-arg NPM_REGISTRY=https://registry.npmmirror.com -t matchmind .
```

## Option A: Render

1. Push this repository to GitHub.
2. Create a new Render Blueprint from the repository. `render.yaml` is included.
3. Keep the starter plan or switch it to free. Free instances sleep on idle, so the
   first request can be slow.
4. Deploy. Render builds the Dockerfile, including the Vite frontend.
5. Set `PUBLIC_BASE_URL` to the Render URL after the first deploy.

Health check: `/healthz`.

## Option B: Fly.io

```bash
fly launch --no-deploy
fly secrets set PUBLIC_BASE_URL=https://<app>.fly.dev
fly deploy
```

`fly.toml` uses port 8000 and keeps one machine warm. Do not set a model key for
the cached-only demo.

## Option C: Azure Container Apps

The same Docker image works on Azure Container Apps. Point ingress at port 8000
and keep `/healthz` as the health check. For the live competition service, use:

```env
APP_ENV=prod
DEMO_MODE=live
ALLOW_LIVE_GENERATION=true
LLM_PROVIDER=foundry
FOUNDRY_PROJECT_ENDPOINT=https://your-foundry-service.services.ai.azure.com/api/projects/your-project
FOUNDRY_MODEL=your-deployed-model
APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
LIVE_RATE_LIMIT_PER_MINUTE=10
MAX_LLM_CALLS_PER_MATCH=60
PUBLIC_BASE_URL=https://your-host.example
```

Azure Container Apps must have a managed identity permitted to call the Foundry
project. Store provider settings and monitoring secrets in the platform secret
store, never in the browser. Keep GitHub Pages as a cached fallback.

The rate limiter and model-call budget are in-process safeguards for a single
competition instance; use a shared gateway limit before scaling to multiple
replicas. Azure Monitor export activates only when its connection string exists.

**Verification status:** this repository contains the deployment path, but no
Azure/Foundry deployment has been completed or claimed in this environment.

## GitHub Pages static demo

The public snapshot is built from this repository with `VITE_STATIC_DEMO=true`
and `VITE_BASE=./`. It uses pre-exported JSON under `web/public/demo/`; no API
or secrets are needed. `.github/workflows/pages.yml` builds and deploys it to
GitHub Pages on each push to `main`.

```bash
uv run python scripts/export_static_demo.py
cd web && npm run build:static
```

## What judges should see

- `/studio` with the cached hero insight and evidence.
- `/overlay?bg=1` for a preview; `/overlay` is the transparent OBS source.
- Real OBS evidence: [approved cue](./obs-approved.mp4) and [Director Hold removal](./obs-held.mp4).
- `/fan` for the analyst / casual / player profiles and three languages.
- `/docs` for the API contract.
