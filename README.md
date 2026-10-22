# MatchMind

**Every moment, explained. Every fan, understood.**

MatchMind is a real-time explainability layer for football broadcast. It turns synthetic match events into grounded, timed match intelligence — rendered as a broadcast-ready overlay for the studio and as a personalized second-screen experience for analysts, casual fans, and player-focused viewers.

> Status: planning and early build (Inside the Game: Developer Hackathon, October 2026).
> The full execution plan, architecture, scope, demo script, and submission checklist live in [PLAN.md](./PLAN.md).

## The problem

A match produces 1,200–1,500 events. Broadcasters have seconds to decide what deserves airtime; fans get a scoreline. Existing tools report *what happened*, not *why it mattered* — and one feed cannot serve an analyst, a casual fan, and a player-focused viewer at the same time.

## What MatchMind does

One pipeline, five stages:

1. **Ingest** synthetic events and tracking data as they happen.
2. **Interpret** them with a deterministic football state engine: xG, xT, pressure, pass difficulty, control vs. chaos, momentum, rhythm, speed, and distance.
3. **Explain** why a moment matters with specialized agents and an evidence trail.
4. **Render** the insight as a timed broadcast overlay: lower-thirds, stat cards, momentum ribbons, pressure maps, speed alerts.
5. **Personalize** the same moment for analyst, casual, and player-focused audiences in multiple languages.

## The agent team

| Agent | Responsibility |
|---|---|
| **TacticalAnalyst** | Finds the pattern and explains why it matters. |
| **StoryProducer** | Writes broadcast language and the overlay specification. |
| **AudienceEditor** | Rewrites for analyst, casual, and player-focused profiles, in parallel. |
| **FactChecker** | Verifies every number and claim against event-level evidence; withholds what it cannot support. |
| **Director** | Prioritizes the rundown, manages airtime, and asks for human approval. |

The workflow is a typed graph built with Microsoft Agent Framework. All football numbers come from a deterministic engine exposed through an MCP server; the models explain, they do not invent.

## Microsoft stack

- **Microsoft Foundry** — model deployments, tracing, evaluation
- **Microsoft Agent Framework** — graph workflows, shared state, handoffs, checkpointing
- **MCP** — analytics tools exposed to agents
- **Azure Container Apps** — API, web app, and MCP server
- **Azure Cosmos DB** — audit and evidence store
- **Application Insights + OpenTelemetry** — agent traces, latency, cost
- **Azure Developer CLI + Bicep** — one-command deployment
- **GitHub Actions + GitHub Copilot** — CI/CD and development

## Synthetic data

MatchForge generates football-realistic synthetic matches with fictional clubs and players: events, tracking windows, lineups, and ground-truth labels for evaluation. No real match footage, data, club crests, or player likenesses are used.

## Repository layout

```text
src/matchmind/   # API, analytics, agents, MatchForge, MCP, store, schemas
web/             # Studio, overlay, and fan experiences
data/            # Synthetic matches, labels, dataset card
infra/           # Bicep and azd
tests/           # Unit, contract, and evaluation tests
docs/            # Architecture, data card, demo script
```

## Local development

Planned workflow:

```bash
make install
make data
make dev
```

The public demo will run in `DEMO_MODE=replay` without cloud credentials, so judges can test the full experience. Live AI mode uses a Foundry project.

## License

Code: MIT (to be added at submission).
Data: CC BY 4.0 (to be added with the dataset card).
