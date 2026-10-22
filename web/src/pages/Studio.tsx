import {
  ArrowCounterClockwise,
  Broadcast,
  CaretDown,
  DeviceMobile,
  Monitor,
  Pause,
  Play,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AgentRundown from "../components/AgentRundown";
import Brand from "../components/Brand";
import EventTicker from "../components/EventTicker";
import EvidenceDrawer from "../components/EvidenceDrawer";
import OverlayCueView from "../components/OverlayCueView";
import Pitch from "../components/Pitch";
import { api } from "../api";
import { eventLabel, formatClock, metricNumber } from "../lib";
import type {
  Clock,
  Event,
  FeatureSnapshot,
  InsightResult,
  Language,
  MatchDetail,
  MatchSummary,
  Moment,
  Profile,
  Score,
} from "../types";

const HERO_MATCH = "ast-2026-1018-nhr-orn";
const PROFILES: Profile[] = ["analyst", "casual", "player"];
const LANGUAGES: Language[] = ["en", "es", "zh"];

function chooseMoment(moments: Moment[]): Moment | null {
  if (moments.length === 0) return null;
  const lateLineBreak = moments.find(
    (moment) => moment.type === "line_break" && moment.clock.minute >= 70,
  );
  return lateLineBreak ?? [...moments].sort((a, b) => b.importance - a.importance)[0];
}

function eventIndex(events: Event[], eventId: string | undefined): number {
  if (!eventId) return Math.max(0, events.length - 1);
  const index = events.findIndex((event) => event.event_id === eventId);
  return index === -1 ? Math.max(0, events.length - 1) : index;
}

function scoreFor(event: Event | undefined, fallback: Score): Score {
  return event?.score ?? fallback;
}

function clockFor(event: Event | undefined, fallback: Clock): Clock {
  return event?.clock ?? fallback;
}

function momentLabel(type: string): string {
  return type.replace(/_/g, " ");
}

export default function Studio() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selected, setSelected] = useState(HERO_MATCH);
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [features, setFeatures] = useState<FeatureSnapshot | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [safe, setSafe] = useState(true);
  const [approval, setApproval] = useState<"approved" | "held">("held");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState(0);

  const loadInsight = useCallback(
    async (matchId: string, moment: Moment, sourceEvents: Event[], useCache: boolean) => {
      setGenerating(true);
      setError(null);
      const started = performance.now();
      try {
        const result = await api.insight(matchId, {
          moment_id: moment.moment_id,
          profiles: PROFILES,
          languages: LANGUAGES,
          use_cache: useCache,
          use_mcp: true,
        });
        setInsight(result);
        setCached(useCache && performance.now() - started < 2500);
        setApproval(result.decision.action === "approve" ? "approved" : "held");
        setSelectedClaim(0);
        setCursor(eventIndex(sourceEvents, moment.event_id));
        try {
          setFeatures(await api.features(matchId, moment.event_id));
        } catch {
          setFeatures(null);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not generate insight");
      } finally {
        setGenerating(false);
      }
    },
    [],
  );

  useEffect(() => {
    api
      .matches()
      .then((value) => {
        setMatches(value);
        if (!value.some((match) => match.match_id === selected)) {
          setSelected(value[0]?.match_id ?? HERO_MATCH);
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load matches"));
  }, [selected]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInsight(null);
    setFeatures(null);
    setCached(false);
    setPlaying(false);
    setSelectedClaim(0);
    Promise.all([api.match(selected), api.events(selected), api.moments(selected)])
      .then(([nextDetail, eventPage, momentPage]) => {
        if (cancelled) return;
        const nextMoment = chooseMoment(momentPage.moments);
        setDetail(nextDetail);
        setEvents(eventPage.events);
        setMoments(momentPage.moments);
        setSelectedMoment(nextMoment);
        setCursor(eventIndex(eventPage.events, nextMoment?.event_id));
        setApproval("held");
        setLoading(false);
        if (selected === HERO_MATCH && nextMoment) {
          void loadInsight(selected, nextMoment, eventPage.events, true);
        }
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoading(false);
        setError(caught instanceof Error ? caught.message : "Could not load match");
      });
    return () => {
      cancelled = true;
    };
  }, [selected, loadInsight]);

  useEffect(() => {
    if (!playing || events.length === 0) return;
    const intervalMs = speed === 1 ? 900 : speed === 10 ? 140 : 40;
    const timer = window.setInterval(() => {
      setCursor((value) => Math.min(value + 1, events.length - 1));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [playing, speed, events.length]);

  useEffect(() => {
    if (playing && cursor >= events.length - 1) setPlaying(false);
  }, [playing, cursor, events.length]);

  const match = useMemo(
    () => matches.find((item) => item.match_id === selected) ?? null,
    [matches, selected],
  );
  const home = detail?.match.home ?? match?.home;
  const away = detail?.match.away ?? match?.away;
  const current = events[cursor];
  const score = scoreFor(current, detail?.match.final_score ?? match?.final_score ?? { home: 0, away: 0 });
  const clock = clockFor(current, insight?.clock ?? { period: 2, minute: 72, second: 0 });
  const momentIndex = eventIndex(events, selectedMoment?.event_id);
  const visibleMoments = useMemo(() => {
    if (!selectedMoment) return moments.slice(0, 8);
    const others = moments.filter((moment) => moment.moment_id !== selectedMoment.moment_id).slice(0, 7);
    return [selectedMoment, ...others];
  }, [moments, selectedMoment]);
  const cueVisible = approval === "approved" && insight?.cue && cursor >= momentIndex;
  const stat = (name: string, digits = 2): string => {
    const value = features?.metrics[name]?.value;
    return value === undefined ? "--" : metricNumber(value, digits);
  };

  const selectMoment = (moment: Moment) => {
    setSelectedMoment(moment);
    setCursor(eventIndex(events, moment.event_id));
    setPlaying(false);
    if (insight?.moment.moment_id !== moment.moment_id) {
      setInsight(null);
      setFeatures(null);
      setApproval("held");
      setCached(false);
    }
  };

  const selectEvent = (eventId: string) => {
    setCursor(eventIndex(events, eventId));
    setPlaying(false);
  };

  const generate = () => {
    if (selectedMoment) void loadInsight(selected, selectedMoment, events, false);
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Brand />
        <div className="match-select-wrap">
          <select className="match-select" value={selected} onChange={(event) => setSelected(event.target.value)}>
            {matches.map((item) => (
              <option key={item.match_id} value={item.match_id}>
                {item.home.name} vs {item.away.name}
              </option>
            ))}
            {matches.length === 0 && <option value={HERO_MATCH}>Nova Harbor vs Orion North</option>}
          </select>
          <CaretDown size={12} />
        </div>

        <div className="scoreline">
          <div className="score-team">
            <span className="team-dot" style={{ background: home?.color ?? "#c8ff3d" }} />
            {home?.short_name.toUpperCase() ?? "HOME"}
          </div>
          <span className="score-num">{score.home}</span>
          <span className="score-dash">-</span>
          <span className="score-num">{score.away}</span>
          <div className="score-team">
            <span className="team-dot" style={{ background: away?.color ?? "#ff625f" }} />
            {away?.short_name.toUpperCase() ?? "AWAY"}
          </div>
          <div className="clock-block">
            <span className="clock-main">{formatClock(clock)}</span>
            <span className="clock-label">{playing ? "REPLAYING" : "MATCH CLOCK"}</span>
          </div>
        </div>

        <div className="top-controls">
          <div className="control-cluster">
            <button
              className={`icon-btn ${playing ? "active" : ""}`}
              type="button"
              aria-label={playing ? "Pause replay" : "Play replay"}
              onClick={() => {
                if (cursor >= events.length - 1) setCursor(Math.max(0, momentIndex - 6));
                setPlaying((value) => !value);
              }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              className="icon-btn"
              type="button"
              aria-label="Reset replay"
              onClick={() => {
                setPlaying(false);
                setCursor(Math.max(0, momentIndex - 6));
              }}
            >
              <ArrowCounterClockwise size={14} />
            </button>
          </div>
          <div className="control-cluster">
            {[1, 10, 60].map((value) => (
              <button
                key={value}
                className={`speed-btn ${speed === value ? "active" : ""}`}
                type="button"
                onClick={() => setSpeed(value)}
              >
                {value}x
              </button>
            ))}
          </div>
          <button className="safe-toggle" data-on={safe} type="button" onClick={() => setSafe((value) => !value)}>
            <ShieldCheck size={12} />
            <span>SAFE</span>
          </button>
        </div>

        <div className="top-right">
          <div className="surface-links">
            <Link className="surface-link active" to="/studio">
              <Broadcast size={11} /> Studio
            </Link>
            <Link className="surface-link" to="/overlay?bg=1">
              <Monitor size={11} /> Overlay
            </Link>
            <Link className="surface-link" to="/fan">
              <DeviceMobile size={11} /> Fan
            </Link>
          </div>
          <button className="btn btn-primary" type="button" onClick={generate} disabled={generating || !selectedMoment}>
            {generating ? <span className="spinner" /> : <Sparkle size={12} />}
            {generating ? "Working" : "Generate"}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: "10px 10px 0" }}>
          <div className="error-banner">{error}</div>
        </div>
      )}

      <div className="workspace">
        <aside className="left-col">
          <section className="panel match-card">
            <div className="match-comp">{match?.competition ?? "ASTER LEAGUE"} / {match?.date ?? "DEMO"}</div>
            <h1 className="match-title">
              {home?.name ?? "Nova Harbor"} <span>vs</span> {away?.name ?? "Orion North"}
            </h1>
            <div className="match-meta">
              <span>{match?.venue ?? "Meridian Park"}</span>
              <span>{match?.event_count.toLocaleString() ?? "--"} EVENTS</span>
            </div>
            <div className="match-score">
              <span className="big">
                {score.home} - {score.away}
              </span>
              <span className="small">{clock.period === 2 ? "SECOND HALF" : "FIRST HALF"}</span>
            </div>
          </section>

          <section className="panel moment-panel">
            <header className="panel-head">
              <span className="panel-title">
                <Broadcast size={13} /> Key moments
              </span>
              <span className="mono dim" style={{ fontSize: 8 }}>
                {moments.length} FOUND
              </span>
            </header>
            <div className="panel-body moment-list">
              {visibleMoments.map((moment) => (
                <button
                  type="button"
                  key={moment.moment_id}
                  className={`moment-row ${selectedMoment?.moment_id === moment.moment_id ? "active" : ""}`}
                  onClick={() => selectMoment(moment)}
                >
                  <span className="moment-min">{formatClock(moment.clock)}</span>
                  <span>
                    <span className="moment-name">{momentLabel(moment.type)}</span>
                    <br />
                    <span className="moment-type">{moment.headline.slice(0, 34)}</span>
                  </span>
                  <span className="moment-imp" aria-label={`Importance ${Math.round(moment.importance * 100)} percent`}>
                    <i style={{ width: `${Math.round(moment.importance * 100)}%` }} />
                  </span>
                </button>
              ))}
              {moments.length === 0 && <div className="loading-block">{loading ? "LOADING MOMENTS" : "NO MOMENTS"}</div>}
            </div>
          </section>

          <EventTicker
            events={events}
            cursor={cursor}
            onSelect={(index) => {
              setCursor(index);
              setPlaying(false);
            }}
          />
        </aside>

        <main className="center-col">
          <section className="panel pitch-panel">
            <header className="pitch-head">
              <div className="pitch-head-left">
                <span className="eyebrow">MATCH VIEW</span>
                <span className="pitch-venue">{match?.venue ?? "Meridian Park"}</span>
              </div>
              <div className="pitch-head-left">
                <span className="pitch-mode">
                  <Broadcast size={10} /> {playing ? `${speed}x replay` : "event state"}
                </span>
                <span className="pitch-attack">ATTACK →</span>
              </div>
            </header>
            <div className="pitch-stage">
              {home && away && events.length > 0 ? (
                <Pitch events={events} cursor={cursor} home={home} away={away} />
              ) : (
                <div className="loading-block">{loading ? "LOADING PITCH" : "NO EVENTS"}</div>
              )}
              <div className="pitch-caption">
                <span>PASS NETWORK / PRESSURE RADIUS</span>
                <span>·</span>
                <span>{features ? `SNAPSHOT ${formatClock(features.clock)}` : "LIVE STATE"}</span>
              </div>
            </div>
            <div className="event-detail">
              <div className="event-detail-minute">{current ? formatClock(current.clock) : "--"}</div>
              <div className="event-detail-main">
                <div className="event-detail-title">
                  {current ? eventLabel(current.type, current.player_id) : "Waiting for event"}
                </div>
                <div className="event-detail-sub">
                  {current
                    ? `${current.team_id ?? "MATCH"} / ${current.outcome ?? "in play"} / possession ${current.possession_id}`
                    : "Select a moment or start replay"}
                </div>
              </div>
              <div className="event-detail-metrics">
                <div className="mini-metric">
                  <b>{current ? current.pressure.toFixed(2) : "--"}</b>
                  <span>Pressure</span>
                </div>
                <div className="mini-metric">
                  <b>{current?.ball_speed_kmh ?? current?.speed_kmh ?? "--"}</b>
                  <span>Speed km/h</span>
                </div>
                <div className="mini-metric">
                  <b>{current?.difficulty ?? "--"}</b>
                  <span>Difficulty</span>
                </div>
              </div>
            </div>
          </section>

          <div className="stat-row">
            <div className="stat-tile">
              <div className="stat-label">xG H / A</div>
              <div className="stat-value">
                {stat("xg_home")} <small>/</small> {stat("xg_away")}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">xT H / A</div>
              <div className="stat-value">
                {stat("xt_home", 1)} <small>/</small> {stat("xt_away", 1)}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Control H</div>
              <div className="stat-value">{stat("control_home")}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Chaos</div>
              <div className="stat-value">{stat("chaos")}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Momentum</div>
              <div className="stat-value">{stat("momentum")}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Top speed</div>
              <div className="stat-value">
                {stat("top_speed", 1)} <small>km/h</small>
              </div>
            </div>
          </div>
        </main>

        <aside className="right-col">
          <section className="panel monitor-panel">
            <header className="panel-head">
              <span className="panel-title">
                <Monitor size={13} /> Program monitor
              </span>
              <span className="mono dim" style={{ fontSize: 8 }}>
                16:9 / LOWER THIRD
              </span>
            </header>
            <div className="monitor-frame">
              <div className="monitor">
                <div className="monitor-label">PREVIEW / 1920 × 1080</div>
                <div className="cue-stage">
                  {cueVisible ? (
                    <OverlayCueView cue={insight?.cue ?? null} compact />
                  ) : (
                    <div className="monitor-standby">
                      <Broadcast size={18} />
                      <strong>{approval === "held" ? "STANDBY" : "WAITING"}</strong>
                      <span>{generating ? "GENERATING INSIGHT" : "APPROVE RUNDOWN TO SEND"}</span>
                    </div>
                  )}
                </div>
                {safe && <div className="monitor-safe" />}
              </div>
            </div>
          </section>

          <AgentRundown
            result={insight}
            status={approval}
            cached={cached}
            generating={generating}
            onApprove={() => setApproval("approved")}
            onHold={() => setApproval("held")}
            onGenerate={generate}
            onEvidence={() => setSelectedClaim(0)}
          />

          <EvidenceDrawer
            result={insight}
            events={events}
            selectedClaim={selectedClaim}
            onSelectClaim={setSelectedClaim}
            onSelectEvent={selectEvent}
          />
        </aside>
      </div>
    </div>
  );
}
