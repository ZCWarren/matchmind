# Evaluation snapshot

Generated from the committed cache with `scripts/evaluate_fixtures.py`.

| Metric | Value |
|---|---:|
| Fixtures | 5 |
| Deterministic verifier pass | 5/5 |
| Approved cues | 4/5 |
| Fan cards | 45 |
| Claims | 25 |
| Bounded revision loops | 3 |
| Generic or non-English headlines | 0 |
| Fallback agent runs | 0 |
| Mean summed agent trace | 134.9s |

## Per fixture

| Match | Moment | Verification | Decision | Claims | Cards | Headline |
|---|---|---|---|---:|---:|---|
| `ast-2026-1018-nhr-orn` | `mo-e-000974` | pass | approve | 5 | 9 | NHR-08 escapes ORN's press trap at minute 72 to release NHR-14 for a saved big chance |
| `ast-2026-1025-vel-kep` | `mo-e-001092` | pass | hold | 5 | 9 | VEL-11 threads 27.4 m line-breaking pass to VEL-09 against KEP at 82:47 |
| `ast-2026-1101-orn-vel` | `mo-e-000286` | pass | approve | 5 | 9 | ORN-09 scores past VEL in the 22nd minute to make it 1-0 after ORN-08's pass |
| `ast-2026-1108-kep-nhr` | `mo-e-001027` | pass | approve | 5 | 9 | KEP-09 breaks NHR's line with a 25.2 m pass in the 76th minute |
| `ast-2026-1115-nhr-vel` | `mo-e-000950` | pass | approve | 5 | 9 | VEL-07 breaks NHR's line under 0.86 pressure in the 72nd minute |

A trace total counts parallel roles separately; it is not wall-clock latency.
Cached fixture reads take about 2 ms, which is what the Studio and public demo use.

The deterministic verifier is the release gate. The LLM FactChecker is
advisory; a fallback run means the model audit was unavailable, not that the
deterministic evidence check failed.
