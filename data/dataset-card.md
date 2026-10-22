# Dataset card — MatchMind synthetic demo match

## Summary

- **Dataset**: `ast-2026-1018-nhr-orn` (Aster League, fictional)
- **Generator**: MatchForge v0.1 (`src/matchmind/matchforge`)
- **Seed**: `20261018`
- **Size**: 1 match, 1,304 events, 5 key-moment labels
- **Format**: JSONL events + JSON metadata + JSON labels
- **License**: CC BY 4.0
- **Source**: fully synthetic; no real match data or footage

## Motivation

The hackathon requires synthetic, football-realistic data. MatchForge provides a
reproducible event stream with enough structure for analytics, multi-agent
narration, evidence verification, broadcast overlays, and personalization —
without using third-party match data or club/player IP.

## Composition

| Type | Count (this seed) |
|---|---:|
| Pass | ~780 |
| Carry | ~170 |
| Pressure | ~140 |
| Tackle | ~120 |
| Foul | 27 |
| Shot | 26 |
| Goal | 3 |
| Card | 5 |
| Substitution | 2 |
| Sprint | 2 |

Realism checks on this seed:

- Pass completion: ~80%
- Shots: 26 (13 per team)
- Goals: 3 (final score 2-1)
- Fouls: 27
- Cards: 5
- Event count: 1,304
- Clock is monotonic; half-time and full-time are explicit events

## Generation

1. A possession-level state machine chooses pass, carry, pressure, tackle, or
   shot based on ball location, pressure, and zone.
2. Scripted beats create a demo narrative: a 23' opener, a 51' equalizer, a 72'
   line-break-under-press hero moment, and a 74' winner.
3. A separate scripted 31' sprint (33.8 km/h) makes the 72' sprint (33.4 km/h)
   second-fastest, which the verifier demo uses to catch an unsupported claim.
4. Labels are emitted separately and never fed to agents.

## Intended uses

- Demo and evaluation of MatchMind's analytics, agents, overlay, and
  personalization.
- Regression tests for event schemas and deterministic generation.
- Example data for judges to run the app without cloud credentials.

## Limitations

- Event-level simulation, not a full 22-player physics engine.
- Tracking is limited to sprint events in this version; full 5 Hz tracking is a
  later extension.
- Tactical patterns are plausible but not calibrated to real competitions.
- Fictional names; any resemblance to real people or clubs is coincidental.

## Ethical / IP notes

No real match footage, event data, club crests, player photos, or personal data
are used. Clubs, players, and the league are fictional. Names were chosen to be
generic; a trademark/name check is recommended before public promotion.
