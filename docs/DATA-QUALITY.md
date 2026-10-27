# MatchForge data quality

Generated from committed match data with `uv run python scripts/data_quality.py`.
These are synthetic-data integrity and plausibility checks, not validation against
a real competition. Tactical patterns remain illustrative rather than calibrated.

| Fixture | Events | Pass % | Shots | Goals | Fouls | Cards | xG H–A | Mean pressure | Top speed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Nova Harbor vs Orion North | 1275 | 82.3% | 24 | 3 | 24 | 2 | 3.04–2.75 | 0.541 | 33.8 km/h |
| Vela Athletic vs Kepler Town | 1238 | 82.5% | 27 | 5 | 22 | 3 | 2.47–2.70 | 0.540 | 33.2 km/h |
| Orion North vs Vela Athletic | 1278 | 80.6% | 24 | 2 | 26 | 2 | 2.57–2.72 | 0.539 | 32.9 km/h |
| Kepler Town vs Nova Harbor | 1254 | 81.1% | 24 | 2 | 16 | 3 | 1.83–3.73 | 0.552 | 34.1 km/h |
| Nova Harbor vs Vela Athletic | 1236 | 82.1% | 28 | 6 | 18 | 2 | 3.09–3.11 | 0.542 | 33.6 km/h |

**5/5 fixtures pass integrity checks** covering event counts,
pass completion, shot/foul/card ranges, unique event IDs, monotonic clocks, and
valid label references. The machine-readable report is `docs/data-quality.json`.

The original 0.8–2.5 xG reference band per team is checked separately. Fixtures with
higher totals are marked as calibration warnings, not hidden inside the integrity pass.

## Abuse and failure coverage

The test suite separately covers duplicate profile rejection, unknown event and metric
references, unsupported cue numbers, false superlatives, model timeout/retry, exhausted
model-call budgets, live-endpoint rate limiting, cache-only behavior, and stale UI requests.
Live Copilot answers are withheld when deterministic evidence validation fails.
