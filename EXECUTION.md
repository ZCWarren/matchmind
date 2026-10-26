# MatchMind — Build Checklist

> Completion-driven. No dates, timeboxes, or schedules.
> Product definition and completion gates live in [PLAN.md](./PLAN.md).

---

## Current state

| Area | State |
|---|---|
| DeepSeek provider | Working: raw OpenAI-compatible API + Agent Framework `OpenAIChatClient(base_url=...)` |
| Local API | Working on `:8010`; matches, events, features, moments, insights, recap, config and WebSocket replay |
| MatchForge | Five narrative matches generated: 6,281 events, 30 labels, deterministic seeds; all five `prompt-v3` caches verified |
| Tests | 41 passing; ruff clean; production/static frontend builds and desktop/mobile/reduced-motion Playwright smoke pass |
| Analytics | Working: xG, xT, pressure, pass quality, control/chaos, momentum, rhythm, speed; 6 MCP tools (`get_event_window`, `get_tactical_chain`, `get_pressure_comparison`, `get_player_summary`, `get_snapshot`, `get_moments`) |
| Agents / verifier | Real Agent Framework review, one-revision/recheck path, candidate + cue gate, Director ranking, MatchBlackboard 3-act narrative memory, Adversarial Hallucination Gate Lab, and Grounded Tactical Copilot |
| UI | Cinematic Home, 3D Parabolic Pitch with TV/xT/Press cameras, Live Agent Topology Replay, Hallucination Lab, Studio, five Overlay templates, Fan, 90s Interactive Judge Tour, and 1-Click Vector Poster |
| Media & GTM | 90-second 1080p film + 15-second vertical teaser, bilingual subtitles, [docs/LAUNCH-KIT.md](./docs/LAUNCH-KIT.md), and [docs/PITCH-DECK.md](./docs/PITCH-DECK.md) |

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
- [x] Deterministic candidate and cue verification rejects unsupported numbers.
- [x] One-revision/recheck graph path with unresolved-error hold and warning-only advisory release.
- [x] Director ranking, 60-second dedupe, 15-second airtime gap and stoppage scheduling.
- [x] Per-agent timeout, retries and deterministic fallbacks; circuit-breaker hardening remains future work.
- [x] Audit log: agent, model, prompt version, latency, status, error.
- [x] Five `prompt-v3` caches: 45 cards, 5/5 verified, 4/5 approved, 3 revision loops.
- [x] Tests: graph structure, revision pass/fail, cue numbers, Director rules, rejected claims, cached-only demo.

**Done when:** a real DeepSeek run produces a verified insight for 72', and a deliberately false “fastest sprint” claim is withheld. **Done.**

---

## Gate 4 — Studio, Overlay, Fan

- [x] Vite + React + TypeScript app with route-level code splitting.
- [x] High-energy sports editorial design, dark base, lime accent, tabular numerals.
- [x] One-screen cinematic Home with real 3D match data and two product entrances.
- [x] Moment Focus: Events / Structure / Evidence / Audiences, playback, scrubbing, claim-to-event linking.
- [x] Lazy Three.js scene with SVG fallback, mobile complexity limits, reduced-motion behavior, and offscreen/hidden-tab rendering pause.
- [x] Studio:
  - [x] Match selector, score, clock, replay speed and WebSocket controls.
  - [x] Director rundown with ranking, reasons, dedupe and scheduled airtime.
  - [x] Program monitor with safe-area guides and five Overlay variants.
  - [x] Decision inspector, agent trace, evidence link and Approve / Hold / Kill.
- [x] Overlay:
  - [x] Transparent 1920x1080 route.
  - [x] Lower-third, stat-card, momentum-ribbon, speed-alert and pressure-map variants.
  - [x] Deterministic queue/dedupe rules; physical OBS browser-source test remains unchecked.
- [x] Fan:
  - [x] Analyst / Casual / Player Focus profiles.
  - [x] English / Spanish / Chinese.
  - [x] "How we know" evidence expander and deterministic recap.
  - [x] Player selector, event log, passes, completion, shots and speed.
  - [ ] Favorite club selector and Arabic/Hindi remain future scope.
- [x] Loading, empty and error states.
- [ ] Reconnect, rate limiting and degraded-mode UI remain future hardening.
- [x] Cached-only public demo guard and all five `prompt-v3` fixtures precomputed.
- [x] Browser smoke covers Home, Moment, five fixtures, approval, Overlay, Fan, mobile, reduced motion, invalid-link recovery, cross-match player validity and stale-request protection.

**Done when:** the closed loop in PLAN.md §2 runs from a clean checkout. **Local and static Moment-centered closed loops are live; physical OBS testing remains.**

## Gate 5 — Hardening

- [x] Data tests for all matches.
- [x] Analytics unit tests and evidence tests.
- [x] Verifier tests: pass, reject, advisory merge, and retry timeout.
- [x] API contract tests, including static route containment.
- [x] UI smoke test / Playwright happy path (`web/scripts/smoke-static.mjs`).
- [x] No-key demo mode with cached insights and a public static build.
- [x] Performance: cached fast path p95, slow path samples, model calls per insight ([docs/PERFORMANCE.md](./docs/PERFORMANCE.md)).
- [x] Lint and type checks in CI.
- [x] Dependency audit: npm 0 vulnerabilities; pip-audit no known issues ([docs/DEPENDENCIES.md](./docs/DEPENDENCIES.md)).
- [x] README: one-command setup, judge path, architecture, screenshots, video, Docker check.
- [x] Data card, code/data licenses, secrets check.

**Done when:** a fresh clone can run the demo without cloud credentials and without reading source code.

---

## Gate 6 — Delivery packaging

- [x] Static demo, submission checklist and bilingual sidecar subtitles.
- [x] 90-second 1080p film and independent 15-second vertical teaser rendered and inspected.
- [x] Project description and testing instructions.
- [x] No secrets; code/data licenses and data card included.
- [x] Docker image builds and serves cached Studio/API locally (`matchmind:local-test`).
- [x] Main repository public; static demo deploys from this repository via GitHub Pages on push.
- [x] New production static build verified locally in Chrome across desktop and mobile.

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
