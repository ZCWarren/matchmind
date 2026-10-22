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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
