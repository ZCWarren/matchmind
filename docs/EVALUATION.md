# Evaluation snapshot

Generated from the committed cache with `scripts/evaluate_fixtures.py`.

| Metric | Value |
|---|---:|
| Fixtures | 5 |
| Deterministic verifier pass | 5/5 |
| Approved cues | 5/5 |
| Fan cards | 45 |
| Claims | 25 |
| Generic or non-English headlines | 0 |
| Fallback agent runs | 1 |
| Mean summed agent trace | 83.5s |

## Per fixture

| Match | Moment | Verification | Decision | Claims | Cards | Headline |
|---|---|---|---|---:|---:|---|
| `ast-2026-1018-nhr-orn` | `mo-e-000974` | pass | approve | 5 | 9 | NHR-08 breaks ORN's press trap with a 24.6 m line-break pass in the 72nd minute |
| `ast-2026-1025-vel-kep` | `mo-e-001092` | pass | approve | 5 | 9 | VEL-11 breaks KEP's press at 82:47 with a 27.4 m line-breaking pass to VEL-09 |
| `ast-2026-1101-orn-vel` | `mo-e-000286` | pass | approve | 5 | 9 | ORN-09 opens the scoring for ORN against VEL in the 22nd minute with a shot from the right channel |
| `ast-2026-1108-kep-nhr` | `mo-e-001027` | pass | approve | 5 | 9 | At 76:04 KEP-09 breaks NHR's line with a 25.2 m pass into the wide channel for KEP-06 |
| `ast-2026-1115-nhr-vel` | `mo-e-000950` | pass | approve | 5 | 9 | VEL-07 breaks NHR's line with a 23.9 m pressured pass in the 72nd minute |

A trace total counts parallel roles separately; it is not wall-clock latency.
Cached fixture reads take about 2 ms, which is what the Studio and public demo use.

The deterministic verifier is the release gate. The LLM FactChecker is
advisory; a fallback run means the model audit was unavailable, not that the
deterministic evidence check failed.
