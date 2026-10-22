import type {
  AppConfig,
  Event,
  MatchRecap,
  FeatureSnapshot,
  InsightResult,
  Language,
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

async function staticRequest<T>(path: string): Promise<T> {
  if (path === "/api/config") return staticFile<T>("config.json");
  if (path === "/api/matches") return staticFile<T>("matches.json");
  const match = /^\/api\/matches\/([^/?]+)(?:\/(features|events|moments|recap|insights))?/.exec(
    path.split("?")[0],
  );
  if (!match) throw new Error(`Unknown static API route: ${path}`);
  const [, matchId, resource] = match;
  const file =
    resource === "events"
      ? `${matchId}/events.json`
      : resource === "moments"
        ? `${matchId}/moments.json`
        : resource === "features"
          ? `${matchId}/features.json`
          : resource === "recap"
            ? `${matchId}/recap.json`
            : resource === "insights"
              ? `${matchId}/insight.json`
              : `${matchId}/detail.json`;
  return staticFile<T>(file);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (STATIC_DEMO) return staticRequest<T>(path);
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
