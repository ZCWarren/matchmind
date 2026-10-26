import hero from "../generated/hero.json";

export { hero };

export const PITCH = { length: 105, width: 68 };

/** Provider coordinates (0–100 × 0–100) → world metres. X along the length, Z across. */
export const toWorld = (x: number, y: number): [number, number] => [
  (x - 50) * (PITCH.length / 100),
  (y - 50) * (PITCH.width / 100),
];

export const heroEvent = hero.events.find((e) => e.event_id === "e-000974")!;
export const trapEvent = hero.events.find((e) => e.event_id === "e-000973")!;
export const sprintEvent = hero.events.find((e) => e.event_id === "e-000975")!;

export const FACTS = {
  events: hero.eventCount, // 1275
  eventsLabel: hero.eventCount.toLocaleString("en-US"),
  final: hero.finalScore as { home: number; away: number },
  clock: "72'12",
  clockColon: "72:12",
  passer: heroEvent.player_id, // NHR-08
  presser: trapEvent.player_id, // ORN-06
  receiver: sprintEvent.player_id, // NHR-14
  distance: heroEvent.distance_m, // 24.6
  pressure: heroEvent.pressure, // 0.82
  trapPressure: trapEvent.pressure, // 0.9
  difficulty: 8.7,
  xt: hero.insight.moment.metrics.xt_delta.value, // 0.1736
  sprintKmh: 33.4,
  sprintM: 26.0,
  shotKmh: 104.2,
  checkedClaims: hero.insight.verification.checked_claims, // 5
  verifyStatus: hero.insight.verification.status, // pass
  airAt: "73:32",
  airDuration: hero.insight.decision.duration_seconds, // 8
  dedupedClaims: hero.blackboard.deduped_claims_count, // 34
  home: "Nova Harbor",
  away: "Orion North",
  homeCode: "NHR",
  awayCode: "ORN",
  scoreAtMoment: heroEvent.score as { home: number; away: number },
};

export const AGENTS = [
  { id: "TacticalAnalyst", short: "Analyst", role: "Finds the pattern", verb: "grounds claims with MCP analytics" },
  { id: "StoryProducer", short: "Producer", role: "Writes the cue", verb: "one bounded revision" },
  { id: "AudienceEditor", short: "Audience", role: "Rewrites for every fan", verb: "analyst · casual · player" },
  { id: "FactChecker", short: "Checker", role: "Challenges every claim", verb: "can send it back once" },
  { id: "Director", short: "Director", role: "Decides airtime", verb: "ranks · dedupes · schedules" },
] as const;

export const trace = hero.insight.trace;
export const cue = hero.insight.cue.payload;
export const fanCards = hero.insight.fan_cards;
export const rundown = hero.insight.rundown;
export const challenge = hero.blackboard.hallucination_challenges[0];
