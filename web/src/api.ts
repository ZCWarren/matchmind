import type {
  AppConfig,
  CopilotQA,
  Event,
  MatchRecap,
  FeatureSnapshot,
  InsightResult,
  Language,
  MatchBlackboardState,
  MatchDetail,
  MatchSummary,
  MomentsResponse,
  Profile,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";
const STATIC_BASE = `${import.meta.env.BASE_URL}demo`;

async function staticFile<T>(file: string): Promise<T> {
  const response = await fetch(`${STATIC_BASE}/${file}`);
  if (!response.ok) throw new Error(`Static demo file missing: ${file}`);
  return (await response.json()) as T;
}

async function staticRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (path === "/api/config") return staticFile<T>("config.json");
  if (path === "/api/matches") return staticFile<T>("matches.json");
  const arcMatch = /^\/api\/matches\/([^/?]+)\/arc\/([^/?]+)/.exec(path.split("?")[0]);
  if (arcMatch) {
    const [, matchId, momentId] = arcMatch;
    try {
      return await staticFile<T>(`${matchId}/arc/${momentId}.json`);
    } catch {
      return staticFile<T>(`${matchId}/insight.json`);
    }
  }
  const match = /^\/api\/matches\/([^/?]+)(?:\/(features|events|moments|recap|insights|blackboard|copilot))?/.exec(
    path.split("?")[0],
  );
  if (!match) throw new Error(`Unknown static API route: ${path}`);
  const [, matchId, resource] = match;
  if (resource === "copilot") {
    const board = await staticFile<MatchBlackboardState>(`${matchId}/blackboard.json`);
    const body = init?.body ? (JSON.parse(String(init.body)) as { question?: string }) : {};
    const question = body.question ?? "";
    const q = question.trim().toLowerCase();
    const hit = board.copilot_presets.find(
      (item) => item.question.toLowerCase() === q || item.question_zh.toLowerCase() === q,
    );
    if (hit) return hit as unknown as T;
    return {
      id: "static-live-unavailable",
      question,
      question_zh: question,
      answer: "Live free-form Q&A requires the dynamic service. Choose a preset question in this static demo.",
      answer_zh: "自由提问需要动态服务。在静态演示中，请选择一个预设问题。",
      event_ids: [],
      metric_refs: [],
      verified: false,
      source: "preset",
      notice: "Static demo · no model call was made",
    } as T;
  }
  const file =
    resource === "events"
      ? `${matchId}/events.json`
      : resource === "moments"
        ? `${matchId}/moments.json`
        : resource === "features"
          ? `${matchId}/features.json`
          : resource === "recap"
            ? `${matchId}/recap.json`
            : resource === "blackboard"
              ? `${matchId}/blackboard.json`
              : resource === "insights"
                ? `${matchId}/insight.json`
                : `${matchId}/detail.json`;
  return staticFile<T>(file);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (STATIC_DEMO) return staticRequest<T>(path, init);
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  config: () => request<AppConfig>("/api/config"),
  matches: () => request<MatchSummary[]>("/api/matches"),
  match: (matchId: string) => request<MatchDetail>(`/api/matches/${matchId}`),
  events: (matchId: string) =>
    request<{ total: number; events: Event[] }>(
      `/api/matches/${matchId}/events?limit=2000`,
    ),
  recap: (matchId: string) => request<MatchRecap>(`/api/matches/${matchId}/recap`),
  blackboard: (matchId: string) =>
    request<MatchBlackboardState>(`/api/matches/${matchId}/blackboard`),
  arcInsight: (matchId: string, momentId: string) =>
    request<InsightResult>(`/api/matches/${matchId}/arc/${encodeURIComponent(momentId)}`),
  copilot: (matchId: string, question: string) =>
    request<CopilotQA>(`/api/matches/${matchId}/copilot`, {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  moments: (matchId: string) =>
    request<MomentsResponse>(`/api/matches/${matchId}/moments?limit=60`),
  features: (matchId: string, untilEventId?: string) =>
    request<FeatureSnapshot>(
      `/api/matches/${matchId}/features${
        untilEventId ? `?until_event_id=${encodeURIComponent(untilEventId)}` : ""
      }`,
    ),
  insight: (
    matchId: string,
    body: {
      moment_id?: string;
      profiles?: Profile[];
      languages?: Language[];
      use_cache?: boolean;
      cache_only?: boolean;
      use_mcp?: boolean;
      adversarial_claim?: string;
    },
  ) =>
    request<InsightResult>(`/api/matches/${matchId}/insights`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
