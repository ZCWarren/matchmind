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

The same Docker image works on Azure Container Apps. Add the env vars above and
point the ingress at port 8000. A Foundry adapter is available through
`LLM_PROVIDER=foundry` and `FOUNDRY_PROJECT_ENDPOINT` for a production path.

## What judges should see

- `/studio` with the cached hero insight and evidence.
- `/overlay?bg=1` for a preview; `/overlay` is the transparent OBS source.
- `/fan` for the analyst / casual / player profiles and three languages.
- `/docs` for the API contract.
