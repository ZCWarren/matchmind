export type Clock = { period: number; minute: number; second: number };
export type Score = { home: number; away: number };

export type Team = {
  team_id: string;
  name: string;
  short_name: string;
  color: string;
  venue: string;
};

export type Player = {
  player_id: string;
  name: string;
  number: number;
  position: string;
  team_id: string;
  starter: boolean;
};

export type MatchSummary = {
  match_id: string;
  competition: string;
  date: string;
  home: Team;
  away: Team;
  final_score: Score;
  venue: string;
  event_count: number;
};

export type MatchDetail = {
  match: {
    match_id: string;
    competition: string;
    season: string;
    date: string;
    kickoff_utc: string;
    venue: string;
    home: Team;
    away: Team;
    lineups: Player[];
    final_score: Score;
    seed: number;
    generator: string;
  };
  labels: MomentLabel[];
};

export type MomentLabel = {
  moment_id: string;
  match_id: string;
  clock: Clock;
  type: string;
  importance: number;
  event_ids: string[];
  expected_claims: string[];
  notes: string;
};

export type Event = {
  match_id: string;
  event_id: string;
  ts: string;
  clock: Clock;
  type: string;
  team_id: string | null;
  player_id: string | null;
  location: { x: number; y: number };
  end_location: { x: number; y: number } | null;
  recipient_id: string | null;
  assist_id: string | null;
  pressure: number;
  outcome: string | null;
  ball_speed_kmh: number | null;
  shot_speed_kmh: number | null;
  speed_kmh: number | null;
  distance_m: number | null;
  difficulty: number | null;
  possession_id: string;
  score: Score;
  tags: string[];
};

export type Metric = {
  name: string;
  value: number;
  unit: string;
  formula_version: string;
  event_ids: string[];
  inputs: Record<string, number>;
  label: string | null;
};

export type Moment = {
  moment_id: string;
  match_id: string;
  event_id: string;
  clock: Clock;
  type: string;
  importance: number;
  headline: string;
  event_ids: string[];
  metrics: Record<string, Metric>;
  analytics_version: string;
};

export type MetricRef = {
  name: string;
  value: number;
  formula_version: string;
  event_ids: string[];
};

export type Claim = {
  text: string;
  event_ids: string[];
  metric_refs: MetricRef[];
  confidence: number;
};

export type Insight = {
  moment_id: string;
  match_id: string;
  headline: string;
  why_it_matters: string;
  watch_next: string;
  claims: Claim[];
  importance: number;
  confidence: number;
};

export type OverlayCue = {
  cue_id: string;
  insight_id: string;
  template: string;
  priority: number;
  duration_seconds: number;
  safe_area: string;
  payload: Record<string, string>;
};

export type Profile = "analyst" | "casual" | "player";
export type Language = "en" | "es" | "zh" | "ar" | "hi";

export type FanCard = {
  insight_id: string;
  profile: Profile;
  language: Language;
  headline: string;
  what_happened: string;
  why_it_matters: string;
  watch_next: string;
  how_we_know: string;
  evidence_event_ids: string[];
};

export type VerificationIssue = {
  code: string;
  message: string;
  claim_index: number | null;
  severity: "warn" | "error";
};

export type Verification = {
  status: "pass" | "revise" | "reject";
  issues: VerificationIssue[];
  checked_claims: number;
  notes: string;
};

export type Decision = {
  action: "approve" | "hold" | "kill";
  priority: number;
  duration_seconds: number;
  reason: string;
};

export type TraceStep = {
  agent: string;
  model: string;
  prompt_version: string;
  latency_ms: number;
  status: "ok" | "error" | "fallback";
  error: string;
};

export type InsightResult = {
  match_id: string;
  moment: Moment;
  clock: Clock;
  insight: Insight | null;
  cue: OverlayCue | null;
  fan_cards: FanCard[];
  verification: Verification;
  decision: Decision;
  trace: TraceStep[];
  fallback: boolean;
};

export type FeatureSnapshot = {
  match_id: string;
  event_id: string | null;
  clock: Clock;
  score: Score;
  event_count: number;
  metrics: Record<string, Metric>;
};

export type MomentsResponse = {
  match_id: string;
  total: number;
  moments: Moment[];
};

export type AppConfig = {
  provider: string;
  demo_mode: string;
  allow_live_generation: boolean;
};

export type RecapMoment = {
  clock: Clock;
  type: string;
  description: string;
  event_ids: string[];
};

export type MatchRecap = {
  match_id: string;
  title: string;
  summary: string;
  final_score: Score;
  key_moments: RecapMoment[];
  top_speed_kmh: number;
  generated_by: string;
};
