# Dataset card — MatchMind synthetic matches

## Summary

- **Dataset**: five fictional Aster League matches
- **Generator**: MatchForge v1 (`src/matchmind/matchforge`)
- **Size**: 5 matches, 6,281 events, 30 key-moment labels
- **Format**: JSONL events + JSON metadata + JSON labels
- **License**: CC BY 4.0
- **Source**: fully synthetic; no real match data or footage

## Motivation

The product needs synthetic, football-realistic data for analytics, multi-agent
narration, evidence verification, broadcast overlays, and personalization —
without using third-party match data or club/player IP.

## Matches

| Match | Narrative | Final | Events | Labels | Pass % | Shots | Fouls | Cards |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Nova Harbor vs Orion North | Press trap / line break | 2–1 | 1,275 | 6 | 82.3% | 24 | 24 | 2 |
| Vela Athletic vs Kepler Town | Comeback from 0–2 | 3–2 | 1,238 | 7 | 82.5% | 27 | 22 | 3 |
| Orion North vs Vela Athletic | Red card / late equalizer | 1–1 | 1,278 | 4 | 80.6% | 24 | 26 | 2 |
| Kepler Town vs Nova Harbor | Press storm / away win | 0–2 | 1,254 | 4 | 81.1% | 24 | 16 | 3 |
| Nova Harbor vs Vela Athletic | Chaos game | 3–3 | 1,236 | 9 | 82.1% | 28 | 18 | 2 |

Totals: 6,281 events, 30 labels.

## Realism checks

- 1,100–1,500 events per match
- 78–88% pass completion
- 8–18 shots per team
- 0–6 goals per match
- 15–30 fouls per match
- 1–7 cards per match
- Monotonic clock; explicit half-time and full-time events
- Every label references existing event IDs

The hero match deliberately includes a 31' sprint at 33.8 km/h and a 72' sprint
at 33.4 km/h, so the verifier can reject a “fastest sprint” claim.

## Generation

1. A possession-level state machine chooses pass, carry, pressure, tackle, foul,
   or shot based on ball location, pressure, and zone.
2. Scripted beats create each narrative: goals, cards, substitutions, sprints, and
   the 72' line-break sequence.
3. Labels are emitted separately and never fed to agents.
4. The generator is deterministic: seed + generator version reproduce the same
   events.

## Intended uses

- Demo and evaluation of MatchMind analytics, agents, overlay, and
  personalization.
- Regression tests for event schemas and deterministic generation.
- Example data for reviewers to run the app without cloud credentials.

## Limitations

- Event-level simulation, not a full 22-player physics engine.
- Tracking is represented by sprint events; full 5 Hz tracking is a later
  extension.
- Tactical patterns are plausible but not calibrated to real competitions.
- Fictional names; any resemblance to real people or clubs is coincidental.

## Ethical / IP notes

No real match footage, event data, club crests, player photos, or personal data
are used. Clubs, players, and the league are fictional. Names were chosen to be
generic; a trademark/name check is recommended before public promotion.
