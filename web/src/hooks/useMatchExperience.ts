import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import type {
  Event,
  FeatureSnapshot,
  InsightResult,
  Language,
  MatchBlackboardState,
  MatchDetail,
  MatchSummary,
  Moment,
  Profile,
} from "../types";

export const HERO_MATCH = "ast-2026-1018-nhr-orn";
export const DEFAULT_PROFILES: Profile[] = ["analyst", "casual", "player"];
export const DEFAULT_LANGUAGES: Language[] = ["en", "es", "zh"];

export function chooseMoment(moments: Moment[]): Moment | null {
  return moments.find((moment) => moment.type === "line_break" && moment.clock.minute >= 70)
    ?? [...moments].sort((a, b) => b.importance - a.importance)[0]
    ?? null;
}

export function eventIndex(events: Event[], eventId?: string): number {
  if (!eventId) return Math.max(0, events.length - 1);
  const index = events.findIndex((event) => event.event_id === eventId);
  return index < 0 ? Math.max(0, events.length - 1) : index;
}

export function useMatchExperience() {
  const [params, setParams] = useSearchParams();
  const [matchId, setMatchIdState] = useState(params.get("match") ?? HERO_MATCH);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [features, setFeatures] = useState<FeatureSnapshot | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [blackboard, setBlackboard] = useState<MatchBlackboardState | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [allowLive, setAllowLive] = useState(false);
  const [staticDemo, setStaticDemo] = useState(import.meta.env.VITE_STATIC_DEMO === "true");
  const [error, setError] = useState<string | null>(null);
  const insightRequest = useRef(0);

  const setMatchId = useCallback((nextId: string) => {
    setMatchIdState(nextId);
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("match", nextId);
      return next;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    api.config().then((config) => {
      setAllowLive(config.allow_live_generation);
      setStaticDemo(config.demo_mode === "static");
    }).catch(() => undefined);
    api.matches().then(setMatches).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load matches");
    });
  }, []);

  useEffect(() => {
    if (matches.length === 0) return;
    const fromUrl = params.get("match");
    const validId = matches.some((item) => item.match_id === matchId)
      ? matchId
      : matches.some((item) => item.match_id === fromUrl)
        ? fromUrl!
        : matches[0].match_id;
    if (validId !== matchId) setMatchId(validId);
  }, [matches, matchId, params, setMatchId]);

  const loadInsight = useCallback(async (
    nextMatchId: string,
    moment: Moment,
    live = false,
    useArcEndpoint = false,
  ) => {
    const requestId = ++insightRequest.current;
    setGenerating(true);
    try {
      const result = useArcEndpoint && !live
        ? await api.arcInsight(nextMatchId, moment.moment_id)
        : await api.insight(nextMatchId, {
            moment_id: moment.moment_id,
            profiles: DEFAULT_PROFILES,
            languages: DEFAULT_LANGUAGES,
            use_cache: !live,
            cache_only: !live,
            use_mcp: true,
          }).catch(() => api.arcInsight(nextMatchId, moment.moment_id));
      if (requestId !== insightRequest.current) return;
      setInsight(result);
      const snapshot = await api.features(nextMatchId, moment.event_id).catch(() => null);
      if (requestId === insightRequest.current) setFeatures(snapshot);
    } catch (caught) {
      if (live) throw caught;
      if (requestId === insightRequest.current) setInsight(null);
    } finally {
      if (requestId === insightRequest.current) setGenerating(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    insightRequest.current += 1;
    setLoading(true);
    setError(null);
    setPlaying(false);
    setInsight(null);
    setFeatures(null);
    setBlackboard(null);
    void api.blackboard(matchId).then((board) => {
      if (!cancelled) setBlackboard(board);
    }).catch(() => undefined);
    Promise.all([api.match(matchId), api.events(matchId), api.moments(matchId)])
      .then(async ([nextDetail, eventPage, momentPage]) => {
        if (cancelled) return;
        const moment = chooseMoment(momentPage.moments);
        setDetail(nextDetail);
        setEvents(eventPage.events);
        setMoments(momentPage.moments);
        setSelectedMoment(moment);
        setCursor(eventIndex(eventPage.events, moment?.event_id));
        setLoading(false);
        if (moment) await loadInsight(matchId, moment);
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoading(false);
        setError(caught instanceof Error ? caught.message : "Could not load match");
      });
    return () => {
      cancelled = true;
      insightRequest.current += 1;
    };
  }, [matchId, loadInsight]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const delay = speed === 1 ? 850 : speed === 10 ? 120 : 36;
    const timer = window.setInterval(() => {
      setCursor((current) => Math.min(current + 1, events.length - 1));
    }, delay);
    return () => window.clearInterval(timer);
  }, [playing, speed, events.length]);

  useEffect(() => {
    if (playing && cursor >= events.length - 1) setPlaying(false);
  }, [playing, cursor, events.length]);

  const selectMoment = useCallback((moment: Moment) => {
    setSelectedMoment(moment);
    setError(null);
    setInsight(null);
    setFeatures(null);
    setPlaying(false);
    setCursor(eventIndex(events, moment.event_id));
    const defaultMoment = chooseMoment(moments);
    const isOtherMoment = defaultMoment?.moment_id !== moment.moment_id;
    void loadInsight(matchId, moment, false, isOtherMoment);
  }, [events, loadInsight, matchId, moments]);

  const seekEvent = useCallback((eventId: string) => {
    setPlaying(false);
    setCursor(eventIndex(events, eventId));
  }, [events]);

  const generate = useCallback(async () => {
    if (!allowLive || !selectedMoment) return;
    setError(null);
    try {
      await loadInsight(matchId, selectedMoment, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate insight");
    }
  }, [allowLive, loadInsight, matchId, selectedMoment]);

  const match = useMemo(
    () => matches.find((item) => item.match_id === matchId) ?? null,
    [matches, matchId],
  );
  const currentEvent = events[cursor];
  const home = detail?.match.home ?? match?.home;
  const away = detail?.match.away ?? match?.away;

  return {
    matchId, setMatchId, matches, match, detail, home, away, events, moments,
    selectedMoment, setSelectedMoment, selectMoment, features, setFeatures, insight, setInsight,
    blackboard, currentEvent,
    cursor, setCursor, playing, setPlaying, speed, setSpeed, loading, generating,
    allowLive, staticDemo, error, seekEvent, generate,
  };
}
