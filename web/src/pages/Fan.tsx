import { ArrowLeft, Broadcast, ShieldCheck } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Brand from "../components/Brand";
import FanCardView from "../components/FanCardView";
import { api } from "../api";
import { formatClock, metricNumber } from "../lib";
import type {
  FanCard,
  FeatureSnapshot,
  InsightResult,
  Language,
  MatchRecap,
  MatchSummary,
  Moment,
  Profile,
} from "../types";

const HERO_MATCH = "ast-2026-1018-nhr-orn";
const PROFILES: { id: Profile; label: string }[] = [
  { id: "analyst", label: "Analyst" },
  { id: "casual", label: "Casual" },
  { id: "player", label: "Player" },
];
const LANGUAGES: { id: Language; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "es", label: "ES" },
  { id: "zh", label: "中文" },
];

function chooseMoment(moments: Moment[]): Moment | null {
  const lineBreak = moments.find((moment) => moment.type === "line_break" && moment.clock.minute >= 70);
  return lineBreak ?? [...moments].sort((a, b) => b.importance - a.importance)[0] ?? null;
}

export default function Fan() {
  const [params, setParams] = useSearchParams();
  const matchId = params.get("match") ?? HERO_MATCH;
  const [profile, setProfile] = useState<Profile>((params.get("profile") as Profile) || "casual");
  const [language, setLanguage] = useState<Language>((params.get("lang") as Language) || "en");
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [result, setResult] = useState<InsightResult | null>(null);
  const [features, setFeatures] = useState<FeatureSnapshot | null>(null);
  const [recap, setRecap] = useState<MatchRecap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectMatch = (nextMatchId: string) => {
    const next = new URLSearchParams(params);
    next.set("match", nextMatchId);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    document.title = "MatchMind Fan";
    api.matches().then(setMatches).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .moments(matchId)
      .then(async (response) => {
        const moment = chooseMoment(response.moments);
        if (!moment) throw new Error("No moments available");
        const insight = await api.insight(matchId, {
          moment_id: moment.moment_id,
          profiles: ["analyst", "casual", "player"],
          languages: ["en", "es", "zh"],
          use_cache: true,
          use_mcp: true,
        });
        const snapshot = await api.features(matchId, moment.event_id).catch(() => null);
        const matchRecap = await api.recap(matchId).catch(() => null);
        if (!cancelled) {
          setResult(insight);
          setFeatures(snapshot);
          setRecap(matchRecap);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load fan view");
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const match = matches.find((item) => item.match_id === matchId) ?? null;
  const score = features?.score ?? match?.final_score ?? { home: 2, away: 1 };
  const clock = features?.clock ?? result?.clock ?? { period: 2, minute: 72, second: 12 };
  const displayMatch = match ? { ...match, final_score: score } : null;
  const cards = result?.fan_cards ?? [];
  const card: FanCard | undefined =
    cards.find((item) => item.profile === profile && item.language === language) ??
    cards.find((item) => item.profile === profile) ??
    cards[0];
  const moment = result?.moment;
  const topSpeed = features?.metrics.top_speed?.value || recap?.top_speed_kmh || null;
  const metric = (name: string, digits = 2) => {
    const value = moment?.metrics[name]?.value;
    return value === undefined ? "--" : metricNumber(value, digits);
  };

  return (
    <div className="fan-page">
      <div className="fan-shell">
        <header className="fan-header">
          <div className="fan-header-top">
            <Brand />
            <Link className="fan-back" to="/studio">
              <ArrowLeft size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
              Control room
            </Link>
          </div>
          <div className="fan-scoreboard">
            <div className="fan-team">
              <span className="fan-team-name">{match?.home.name ?? "Nova Harbor"}</span>
              <span className="fan-team-sub">HOME / {match?.home.short_name.toUpperCase() ?? "NHR"}</span>
            </div>
            <div>
              <div className="fan-score">
                {score.home}
                <span className="dim"> - </span>
                {score.away}
              </div>
              <div className="fan-clock">{formatClock(clock)}</div>
            </div>
            <div className="fan-team right">
              <span className="fan-team-name">{match?.away.name ?? "Orion North"}</span>
              <span className="fan-team-sub">{match?.away.short_name.toUpperCase() ?? "ORN"} / AWAY</span>
            </div>
          </div>

          <div className="fan-match-row">
            <select
              className="fan-match-select"
              value={matchId}
              onChange={(event) => selectMatch(event.target.value)}
              aria-label="Select match"
            >
              {matches.map((item) => (
                <option key={item.match_id} value={item.match_id}>
                  {item.home.short_name.toUpperCase()} vs {item.away.short_name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="fan-tabs-row">
            <div className="tabs" style={{ borderBottom: 0, marginBottom: 0 }}>
              {PROFILES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`tab ${profile === item.id ? "active" : ""}`}
                  onClick={() => setProfile(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="lang-row">
              {LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`lang-btn ${language === item.id ? "active" : ""}`}
                  onClick={() => setLanguage(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="fan-content">
          <div className="fan-profile-title">
            <h2>
              <Broadcast size={12} style={{ marginRight: 5, verticalAlign: -2 }} />
              Match intelligence
            </h2>
            <span>{moment ? `${moment.clock.minute}' / VERIFIED` : "LOADING"}</span>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {!card && !error && (
            <div className="fan-card">
              <div className="skeleton" style={{ height: 18, width: "72%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 12, width: "100%", marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 12, width: "86%" }} />
            </div>
          )}

          {card && (
            <>
              <div className="fan-stats">
                <div className="fan-stat">
                  <b>{metric("xt_delta", 3)}</b>
                  <span>xT added</span>
                </div>
                <div className="fan-stat">
                  <b>{metric("event_pressure")}</b>
                  <span>Pressure</span>
                </div>
                <div className="fan-stat">
                  <b>{topSpeed ? metricNumber(topSpeed, 1) : "--"}</b>
                  <span>Match top speed</span>
                </div>
              </div>
              <FanCardView card={card} match={displayMatch} />
            </>
          )}

          {recap && (
            <section className="fan-recap">
              <div className="fan-section-label">Match recap</div>
              <h2>{recap.title}</h2>
              <p>{recap.summary}</p>
              <div className="fan-recap-moments">
                {recap.key_moments.slice(0, 5).map((moment) => (
                  <div className="fan-recap-row" key={`${moment.clock.minute}-${moment.type}`}>
                    <span className="mono">{formatClock(moment.clock)}</span>
                    <span>
                      <b>{moment.type.replace(/_/g, " ")}</b>
                      <small>{moment.description}</small>
                    </span>
                  </div>
                ))}
              </div>
              <div className="fan-recap-foot">
                Deterministic recap / top speed {recap.top_speed_kmh} km/h
              </div>
            </section>
          )}

          <div className="fan-note">
            <ShieldCheck size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
            Every number in this card is checked against event-level evidence before it appears.
            Same moment, different depth, language, and player focus.
          </div>
        </main>
      </div>
    </div>
  );
}
