# Submission checklist

## Public links

- **Static demo**: <https://ruziniuuuuu.github.io/matchmind/>
- **Moment Focus**: <https://ruziniuuuuu.github.io/matchmind/#/moment?match=ast-2026-1018-nhr-orn>
- **90-second film**: <https://ruziniuuuuu.github.io/matchmind/promo.mp4>
- **15-second vertical teaser**: <https://ruziniuuuuu.github.io/matchmind/teaser.mp4>
- **Judge walkthrough**: [JUDGE-GUIDE.md](./JUDGE-GUIDE.md)
- **Evaluation snapshot**: [EVALUATION.md](./EVALUATION.md)
- **Main repository**: <https://github.com/ruziniuuuuu/matchmind> (public)

## Category

**Best Multi-Agent System.** MatchMind is a working five-agent Microsoft Agent Framework graph, not a chat wrapper. TacticalAnalyst, StoryProducer, AudienceEditor, FactChecker and Director share typed graph state and evidence. A real bounded revision edge returns language from FactChecker to Producer for one recheck. Director owns ranking and airtime under deterministic constraints. Human approval remains final.

## Creative statement

**See the game beneath the game.** MatchMind makes the invisible structure of football visible. The same 72nd-minute, 24.6 m line-breaking pass drives the interactive 3D Moment Focus, Studio decision, broadcast Overlay, personalized Fan view, main film and vertical teaser.

## What is complete

- Five synthetic matches with deterministic events, tracking windows and ground-truth labels.
- Deterministic xG, xT, pressure, pass quality, control, chaos, momentum, rhythm and speed.
- MCP analytics server used by TacticalAnalyst.
- Agent Framework graph with parallel fan-out, review, one revision, recheck and finalize.
- Deterministic candidate and cue verification, including unsupported cue number rejection.
- Director ranking, 60-second dedupe, 15-second airtime gap and stoppage selection.
- Daylight Home, interactive 3D Moment Focus, restructured Studio, transparent Overlay, Fan and vector poster.
- Live Tactical Copilot uses real model calls with MCP analytics; deterministic checks withhold unverifiable answers instead of reusing a preset.
- Real `prompt-v3` caches: 5/5 verified, 4/5 approved, 45 fan cards and 3 revision loops.
- 49 Python tests plus browser smoke across Home, Moment, Studio, Overlay and Fan, including live-budget and rate-limit coverage.
- Reproducible data-quality report covering integrity, realism ranges, xG calibration limits and failure scenarios.
- 90-second 1080p film and independent 15-second 1080x1920 teaser with concise English narration, original sound design and English sidecar subtitles.
- CI, Docker, Render/Fly packaging, GitHub Pages static deployment, live rate limits, model-call budgets and optional Azure Monitor export.
- Real OBS 31 Browser Source recordings at 1920×1080: [approved cue](./obs-approved.mp4) and [Director Hold removal](./obs-held.mp4).

## Live verification

- Real HTTP Copilot: `source=live`, `verified=true`, with player and pressure metrics from MCP.
- Uncached five-agent HTTP run: verification `pass`, Director `approve`, `fallback=false`; all seven trace steps including revision and recheck returned `ok`.
- Final Docker image `matchmind:daylight-test` builds successfully.
- Azure/Foundry deployment remains unverified because this environment has no Azure CLI, Foundry endpoint/model, or Application Insights connection string.

## Public demo scope

The GitHub Pages build intentionally uses cached intelligence:

- All five fixtures, Moment layers, 3D, evidence, rundown, Overlay templates, Fan and recap work without a backend.
- WebGL is lazy-loaded and has SVG/reduced-motion fallbacks.
- Generate and Go live are disabled; there is no API key in the browser.
- Static Copilot supports exact preset questions; other questions return an explicit dynamic-service requirement, never a relabeled preset.
- The local app keeps live generation, evidence-checked Copilot and WebSocket replay.
- Vela vs Kepler is verified but held by Director, proving the system does not auto-approve every insight.

## Verification

```bash
uv run ruff check .
uv run pytest -q
uv run python scripts/export_static_demo.py
cd web && npm run build && npm run build:static && npm run smoke:static
cd ../video && npx tsc --noEmit
```

CI runs Python checks, web production and static builds, plus the Playwright smoke path. Media was rendered with Remotion and checked with ffprobe: the main video stream is exactly 90 seconds and the teaser is 15 seconds within one AAC frame of container rounding.
