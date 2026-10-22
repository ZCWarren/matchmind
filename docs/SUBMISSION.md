# Submission checklist

## Public links

- **Static demo**: <https://ruziniuuuuu.github.io/matchmind-demo/>
- **Demo video**: <https://ruziniuuuuu.github.io/matchmind-demo/demo.mp4>
- **Judge walkthrough**: [JUDGE-GUIDE.md](./JUDGE-GUIDE.md)
- **Evaluation snapshot**: [EVALUATION.md](./EVALUATION.md)
- **Main repository**: <https://github.com/ruziniuuuuu/matchmind> (currently private;
  make public or share with the judges before submission)

## Category

**Best Multi-Agent System.** MatchMind is a working five-agent Microsoft Agent
Framework graph, not a chat wrapper: TacticalAnalyst, StoryProducer,
AudienceEditor, FactChecker, and Director share typed graph state and evidence.
The deterministic verifier is the release gate; the LLM FactChecker is advisory.

## What is complete

- Five synthetic matches with deterministic event data, tracking windows, and
  ground-truth labels.
- Deterministic analytics for xG, xT, pressure, pass quality, control, chaos,
  momentum, rhythm, and speed.
- MCP analytics server used by the analyst.
- Agent Framework graph with parallel producer/audience/checker fan-out and a
  finalize fan-in.
- Deterministic verifier plus FactChecker fallbacks and retry on transient
  model failures.
- Studio, transparent overlay with five templates, and personalized Fan with
  five fixtures, three profiles, three languages, player event log, and recap.
- WebSocket replay and live generation locally; cached-only public static demo.
- 31 tests, CI for Python and web builds, Docker/Render/Fly packaging, judge
  guide, evaluation snapshot, and captioned video.

## Public demo scope

The GitHub Pages build is intentionally static:

- All five fixtures, all overlay templates, Fan, recap, replay, and evidence work.
- Generate and Go live are disabled; there is no API key in the browser.
- The local app keeps the full five-agent pipeline and WebSocket feed.

## Verification

```bash
uv run ruff check .
uv run pytest -q
cd web && npm run build
```

CI runs the same Python checks and web production build on every push.
