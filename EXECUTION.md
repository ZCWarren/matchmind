# MatchMind — Build Checklist

> Completion-driven. No dates, timeboxes, or schedules.
> Product definition and completion gates live in [PLAN.md](./PLAN.md).

---

## Current state

| Area | State |
|---|---|
| DeepSeek provider | Working: raw OpenAI-compatible API + Agent Framework `OpenAIChatClient(base_url=...)` |
| Local API | Working on `:8010`; `/healthz`, `/docs`, `/api/matches`, `/api/matches/{id}`, `/api/matches/{id}/events` |
| MatchForge | Five narrative matches generated: 6,281 events, 30 labels, deterministic seeds; speed present in every fixture; all five caches verified |
| Tests | 31 passing; ruff clean; CI green; frontend production and static builds pass |
| UI | Not started |
| Analytics | Working: xG, xT, pressure, pass quality, control/chaos, momentum, rhythm, speed; evidence + API |
| Agents / verifier | Working: real Agent Framework graph, MCP analyst, deterministic gate + advisory checker, cached hero insight |
| UI | Studio, Overlay, Fan built and served from FastAPI; live WebSocket replay; five cached fixtures; Fan five-match selector and player event log; public GitHub Pages static demo; captioned demo video |

---

## Gate 0 — Foundation

- [x] Repo, Python package, `uv`, Makefile, Dockerfile.
- [x] DeepSeek key loaded from local `.env` (not committed).
- [x] Agent Framework + DeepSeek smoke test.
- [x] FastAPI hello + match endpoints.
- [x] MatchForge hero match + labels.
- [x] Data tests and config tests.

---

## Gate 1 — Five matches and narratives

- [x] Generalize `MatchForge` from one hard-coded fixture to a fixture/script configuration.
- [x] Add four more matches with distinct narratives:
  - [x] Vela Athletic vs Kepler Town — comeback from 0–2 to 3–2.
  - [x] Orion North vs Vela Athletic — red card and tactical shift, 1–1.
  - [x] Kepler Town vs Nova Harbor — press storm, 0–2 away win.
  - [x] Nova Harbor vs Vela Athletic — chaos game, 3–3.
- [x] Every match: 1,100–1,500 events, monotonic clock, half-time/full-time, realistic pass/shot/foul/card ranges.
- [x] Every label references existing event IDs.
- [x] Hero match keeps the 31' 33.8 km/h sprint and 72' 33.4 km/h sprint for the verifier demo.
- [x] Dataset card and data README reflect all five matches.
- [x] Tests generate and validate all five matches.

**Done when:** `make data` produces five match directories; all realism and label tests pass. **Done.**

---

## Gate 2 — Deterministic analytics

- [ ] Event gateway: validation, dedupe, match state, rolling windows.
- [ ] xG model (distance, angle, pressure, body part) with versioned formula.
- [ ] xT grid and pass value (xT end − xT start) with versioned formula.
- [ ] Pressure index (distance, closing speed, time on ball).
- [ ] Pass quality: distance, completion, difficulty 0–10, line-break flag.
- [ ] Control and chaos indices; momentum with change points; rhythm.
- [ ] Speed, distance, sprint thresholds; ball speed and shot speed.
- [ ] Evidence bundles: event IDs + metric references + formula version.
- [ ] `/api/matches/{id}/features` and `/api/matches/{id}/moments`.
- [ ] Unit tests with hand-computed fixtures for every metric.
- [ ] MCP analytics server exposing tools for agents.

**Done when:** the hero 72' moment produces a complete evidence bundle and the API returns it.

---

## Gate 3 — Agents and verifier

- [x] Contracts: `InsightCandidate`, `OverlayCue`, `FanCard`, `VerificationResult`, `RundownDecision`.
- [x] `GraphState` / `GraphEnvelope` shared state with typed messages.
- [x] Agent Framework graph with typed parallel fan-out/fan-in:
  - [x] TacticalAnalyst
  - [x] StoryProducer
  - [x] AudienceEditor (parallel profiles/languages)
  - [x] FactChecker (deterministic gate + advisory LLM review)
  - [x] Director
- [x] MCP tools wired to the analyst (`get_event_window`).
- [x] Structured outputs validated with Pydantic; one repair attempt.
- [x] FactChecker recomputes numbers, checks event references, and unsafe superlatives.
- [x] Verifier rejection path withholds the insight.
- [ ] Per-agent timeout + template fallback done; retry/circuit-breaker hardening next.
- [x] Audit log: agent, model, prompt version, latency, status, error.
- [x] Cached/demo mode for tests and judges (hero cache: 9 cards, pass/approve).
- [x] Tests: graph structure, graph execution with typed envelopes, verified insight, rejected claim, cached-only demo.
- [ ] Tests: timeout fallback and duplicate suppression next.

**Done when:** a real DeepSeek run produces a verified insight for 72', and a deliberately false “fastest sprint” claim is withheld. **Done.**

---

## Gate 4 — Studio, Overlay, Fan

- [x] Vite + React + TypeScript app.
- [x] Broadcast control-room design: deep navy, lime accent, tabular numerals, SVG pitch.
- [x] Studio:
  - [x] Match selector, score, clock, replay speed.
  - [x] Event ticker and current event.
  - [x] Agent rundown with verified/cached state.
  - [x] Evidence drawer with event IDs and metric calculations.
  - [x] Approve / Hold.
  - [x] Program monitor with safe-area guides.
  - [x] Agent latency rail.
  - [ ] Fan preview embedded in Studio (full Fan page exists).
- [x] Overlay:
  - [x] Transparent 1920x1080 route.
  - [x] Lower-third with headline, stat, subline, evidence-verified mark.
  - [x] Stat-card, momentum-ribbon, speed-alert, and pressure-map variants.
  - [ ] Queue/dedupe/OBS browser-source test.
- [x] Fan:
  - [x] Analyst / Casual / Player Focus profiles.
  - [x] English / Spanish / Chinese.
  - [x] "How we know" evidence expander.
  - [x] Deterministic match recap with goals, cards, key moments, and top speed.
  - [x] Player focus selector with deterministic event log.
  - [ ] Favorite club selector and Arabic/Hindi.
- [x] WebSocket replay stream (events + cached insight/cue delivery).
- [x] Loading, empty, and error states.
- [ ] Reconnect, rate limiting, and degraded-mode UI.
- [x] Cached-only public demo guard (`ALLOW_LIVE_GENERATION=false`); Render/Fly/Docker packaging.
- [x] All five fixtures precomputed; prompt-versioned cache keys; deterministic headline guard.

**Done when:** the closed loop in PLAN.md §2 runs from a clean checkout. **Local UI closed loop is live; overlay variants, streaming, and polish remain.**

## Gate 5 — Hardening

- [ ] Data tests for all matches.
- [ ] Analytics unit tests and evidence tests.
- [ ] Verifier tests: pass, revise, reject, timeout.
- [ ] API contract tests.
- [ ] UI smoke test / Playwright happy path.
- [ ] No-key demo mode with cached insights.
- [ ] Performance: fast path p95, slow path p95, cost per insight.
- [ ] Lint, type checks, dependency audit.
- [ ] README: one-command setup, 90-second judge path, architecture, screenshots.
- [ ] Data card, licenses, secrets check.

**Done when:** a fresh clone can run the demo without cloud credentials and without reading source code.

---

## Gate 6 — Delivery packaging

- [x] Public static demo on GitHub Pages; captioned video; submission checklist.
- [ ] Two-minute demo video showing the running product.
- [ ] Project description and testing instructions.
- [ ] Repository public; no secrets; licenses and data card included.
- [ ] Verify links in incognito from another machine.

**Done when:** an external reviewer can open the demo, follow the 90-second path, and understand the product.

---

## Working agreement

- Build by completion gates, not schedules.
- Every gate has an acceptance test; do not move on with a broken gate.
- Prefer deterministic fallbacks over fragile model-only paths.
- Never claim Azure/Foundry deployment unless it is actually deployed.
- After the closed loop works, iterate on quality: data realism, agent quality,
  UX polish, performance, and additional narratives.
- Keep the main branch runnable; commit each coherent slice.

---

## How to run locally

```bash
make install
cp .env.example .env      # add DEEPSEEK_API_KEY
make smoke
make data
make dev                  # http://localhost:8010/docs
make test
```

The API is on `:8010`; `:8000` is used by Caddy.
