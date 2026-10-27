import {
  ArrowCounterClockwise,
  ArrowUpRight,
  Broadcast,
  Check,
  Monitor,
  Pause,
  Play,
  ShareNetwork,
  ShieldCheck,
  Sparkle,
  Stop,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AgentGraphVisualizer from "../components/AgentGraphVisualizer";
import AppNav from "../components/AppNav";
import HallucinationLab from "../components/HallucinationLab";
import SceneLoader from "../components/moment/SceneLoader";
import OverlayCueView from "../components/OverlayCueView";
import ShareCardModal from "../components/ShareCardModal";
import { eventIndex, useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock } from "../lib";
import type { InsightResult, OverlayVariant } from "../types";

const OVERLAYS: { id: OverlayVariant; label: string; name: string }[] = [
  { id: "lower_third", label: "L3", name: "Lower third" },
  { id: "stat_card", label: "STAT", name: "Stat card" },
  { id: "momentum", label: "MOM", name: "Momentum" },
  { id: "speed_alert", label: "SPD", name: "Speed alert" },
  { id: "pressure_map", label: "MAP", name: "Pressure map" },
];

export default function Studio() {
  const experience = useMatchExperience();
  const {
    matchId,
    setMatchId,
    matches,
    match,
    home,
    away,
    events,
    moments,
    selectedMoment,
    setSelectedMoment,
    selectMoment,
    features,
    setFeatures,
    insight,
    setInsight,
    blackboard,
    currentEvent,
    cursor,
    setCursor,
    playing,
    setPlaying,
    speed,
    setSpeed,
    generating,
    allowLive,
    staticDemo,
    error,
    seekEvent,
    generate,
  } = experience;

  const [variant, setVariant] = useState<OverlayVariant>("lower_third");
  const [safe, setSafe] = useState(true);
  const [approval, setApproval] = useState<"approved" | "held" | "killed">("held");
  const [live, setLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setApproval(insight?.decision.action === "approve" ? "approved" : "held");
  }, [insight]);

  const stopLive = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => stopLive, [stopLive]);
  useEffect(() => {
    stopLive();
  }, [matchId, stopLive]);

  const startLive = () => {
    if (!events.length) return;
    stopLive();
    setPlaying(false);
    setLiveError(null);
    setLive(true);
    const startEvent = events[Math.max(0, cursor - 6)]?.event_id;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const query = startEvent ? `&start_event_id=${encodeURIComponent(startEvent)}` : "";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/matches/${matchId}?speed=10${query}`);
    socketRef.current = socket;
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data) as { type: string; index?: number; result?: InsightResult };
      if (data.type === "event" && typeof data.index === "number") setCursor(data.index);
      if (data.type === "insight" && data.result) {
        setInsight(data.result);
        setSelectedMoment(data.result.moment);
        void api.features(matchId, data.result.moment.event_id).then(setFeatures).catch(() => undefined);
      }
      if (data.type === "end") setLive(false);
    };
    socket.onerror = () => {
      setLiveError("Live feed disconnected");
      setLive(false);
    };
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
        setLive(false);
      }
    };
  };

  const score = currentEvent?.score ?? match?.final_score ?? { home: 0, away: 0 };
  const momentIndex = eventIndex(events, selectedMoment?.event_id);
  const cueVisible = approval === "approved" && insight?.cue && cursor >= momentIndex ? insight.cue : null;
  const rundown = insight?.rundown?.length
    ? insight.rundown
    : moments.slice(0, 8).map((moment, index) => ({
        moment_id: moment.moment_id,
        rank: index + 1,
        action: "hold" as const,
        reason: "Waiting for Director review",
        air_at: null,
      }));
  const momentById = new Map(moments.map((moment) => [moment.moment_id, moment]));
  const maxCursor = Math.max(1, events.length - 1);
  const fillPct = `${(cursor / maxCursor) * 100}%`;

  const scorebug = {
    home: home?.short_name ?? "NHR",
    away: away?.short_name ?? "ORN",
    score,
    clock: currentEvent ? formatClock(currentEvent.clock) : selectedMoment ? formatClock(selectedMoment.clock) : "72'12",
  };

  return (
    <main className="studio-page app-page">
      <AppNav matchId={matchId} />
      <section className="commandbar studio-commandbar">
        <select
          className="fixture-select"
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
          aria-label="Select match"
        >
          {matches.map((item) => (
            <option key={item.match_id} value={item.match_id}>
              {item.home.name} vs {item.away.name}
            </option>
          ))}
        </select>

        <div className="scoreline">
          <span className="team home">
            <i />
            {home?.short_name ?? "NHR"}
          </span>
          <strong className="mono">
            {score.home}
            <em>–</em>
            {score.away}
          </strong>
          <span className="team away">
            {away?.short_name ?? "ORN"}
            <i />
          </span>
          <small className="clock-pill mono">{currentEvent ? formatClock(currentEvent.clock) : "--'--"}</small>
        </div>

        <div className="commandbar-actions">
          <div className="replay-controls">
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? "Pause replay" : "Play replay"}
              className="ctrl-icon"
            >
              {playing ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setCursor(Math.max(0, momentIndex - 6));
              }}
              aria-label="Reset replay"
              className="ctrl-icon"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
            </button>
            <div className="speed-pills">
              {[1, 10, 60].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={speed === value ? "active" : ""}
                  onClick={() => setSpeed(value)}
                >
                  {value}x
                </button>
              ))}
            </div>
          </div>

          <button
            className={`btn btn-glass btn-sm live-button ${live ? "active" : ""}`}
            type="button"
            onClick={live ? stopLive : startLive}
            disabled={staticDemo}
          >
            {live ? <Stop size={14} weight="fill" /> : <Broadcast size={14} weight="bold" />}
            <span>{live ? "Stop feed" : staticDemo ? "Static demo" : "Go live"}</span>
          </button>

          <button
            className="btn btn-glass btn-sm generate-button"
            type="button"
            onClick={() => void generate()}
            disabled={!allowLive || generating || !selectedMoment}
          >
            <Sparkle size={14} weight="fill" />
            <span>{generating ? "Agents working" : allowLive ? "Generate" : "Cached"}</span>
          </button>

          <button type="button" className="btn btn-glass btn-sm share-poster-btn" onClick={() => setShareOpen(true)}>
            <ShareNetwork size={14} weight="bold" /> Poster
          </button>
        </div>
      </section>

      {(error || liveError) && <div className="error-banner">{error ?? liveError}</div>}

      <div className="studio-workspace">
        <section className="rundown-panel panel">
          <header className="panel-head">
            <div>
              <span className="section-label">Director's rundown</span>
              <h1>What deserves airtime?</h1>
            </div>
            <span className="chip mono">{rundown.length} moments</span>
          </header>
          <div className="rundown-list">
            {rundown.map((entry) => {
              const moment = momentById.get(entry.moment_id);
              if (!moment) return null;
              return (
                <button
                  key={entry.moment_id}
                  type="button"
                  className={`rundown-item ${selectedMoment?.moment_id === entry.moment_id ? "active" : ""}`}
                  onClick={() => selectMoment(moment)}
                >
                  <span className="rundown-rank mono">{String(entry.rank).padStart(2, "0")}</span>
                  <span className="rundown-copy">
                    <strong>{moment.headline}</strong>
                    <small className="mono">
                      {formatClock(moment.clock)} · {moment.type.replaceAll("_", " ")}
                    </small>
                    <em>{entry.reason}</em>
                  </span>
                  <span className={`rundown-state ${entry.action}`}>{entry.action}</span>
                </button>
              );
            })}
          </div>
          <div className="rundown-rule">
            <ShieldCheck size={15} weight="bold" /> 60s dedupe · 15s airtime gap · stoppage preferred
          </div>
        </section>

        <section className="program-panel panel">
          <header className="panel-head">
            <div className="program-head-title">
              <span className={`program-lamp ${cueVisible ? "onair" : ""}`} />
              <span className="section-label">{cueVisible ? "Program · On air" : "Program monitor"}</span>
            </div>
            <Link
              className="text-link"
              to={`/overlay?bg=1&match=${matchId}&template=${variant}&approval=${approval}`}
            >
              Full screen <ArrowUpRight size={13} weight="bold" />
            </Link>
          </header>

          <div className="program-screen">
            <div className="program-bg" aria-hidden="true">
              <SceneLoader events={events} cursor={cursor} home={home} away={away} variant="broadcast" />
            </div>
            <OverlayCueView
              cue={cueVisible}
              guides={safe}
              variant={variant}
              features={features}
              moment={selectedMoment}
              events={events}
              scorebug={scorebug}
              compact
            />
            {!cueVisible && (
              <div className="program-hold">
                <span className="hold-badge">
                  <Monitor size={18} weight="bold" />
                  {approval === "held"
                    ? "Cue held off air"
                    : approval === "killed"
                      ? "Cue killed by operator"
                      : "Waiting for verified cue"}
                </span>
                <p>The program output changes only after human or Director approval.</p>
              </div>
            )}
          </div>

          <div className="program-controls">
            <div className="overlay-switch">
              {OVERLAYS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={variant === item.id ? "active" : ""}
                  onClick={() => setVariant(item.id)}
                  title={item.name}
                >
                  <b className="mono">{item.label}</b>
                  <span>{item.name}</span>
                </button>
              ))}
              <button
                type="button"
                className={safe ? "active safe" : "safe"}
                onClick={() => setSafe(!safe)}
                title="Toggle broadcast safe area guides"
              >
                <ShieldCheck size={14} weight="bold" />
                <b className="mono">SAFE</b>
              </button>
            </div>

            <div className="studio-timeline" style={{ ["--fill" as string]: fillPct } as CSSProperties}>
              <input
                aria-label="Studio replay timeline"
                type="range"
                min={0}
                max={Math.max(0, events.length - 1)}
                value={cursor}
                onChange={(event) => {
                  setPlaying(false);
                  setCursor(Number(event.target.value));
                }}
              />
              <div className="studio-timeline-meta mono">
                <span>{events[cursor]?.event_id ?? "No event"}</span>
                <span>
                  {cursor + 1} / {events.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        <aside className="decision-panel panel">
          <header className="panel-head">
            <span className="section-label">Decision inspector</span>
            <span className={`decision-status ${insight?.verification.status ?? "loading"}`}>
              <Check size={12} weight="bold" /> {insight?.verification.status ?? "loading"}
            </span>
          </header>

          <div className="decision-story">
            <span className="decision-kicker mono">
              {selectedMoment ? formatClock(selectedMoment.clock) : "--'--"} · selected moment
            </span>
            <h2 className="insight-headline display">
              {insight?.insight?.headline ?? selectedMoment?.headline ?? "Select a moment"}
            </h2>
            <p>{insight?.decision.reason ?? "The Director will explain why this moment should air or wait."}</p>
            {insight?.decision.air_at && (
              <div className="air-slot">
                <Broadcast size={15} weight="bold" />
                <span>Suggested airtime</span>
                <strong className="mono">{formatClock(insight.decision.air_at)}</strong>
              </div>
            )}
          </div>

          <div className="approval-controls">
            <button
              type="button"
              className={`approve-btn ${approval === "approved" ? "active" : ""}`}
              disabled={!insight?.cue || insight.verification.status !== "pass"}
              onClick={() => setApproval("approved")}
            >
              <Check size={15} weight="bold" /> Approve
            </button>
            <button
              type="button"
              className={`hold-btn ${approval === "held" ? "active" : ""}`}
              onClick={() => setApproval("held")}
            >
              <Pause size={15} weight="fill" /> Hold
            </button>
            <button
              type="button"
              className={`kill-btn ${approval === "killed" ? "active" : ""}`}
              onClick={() => setApproval("killed")}
              aria-label="Kill cue"
            >
              <X size={15} weight="bold" />
            </button>
          </div>

          <div className="agent-trace">
            <span className="section-label">Agent trace</span>
            <div className="agent-trace-list">
              {insight?.trace.map((step, index) => (
                <div key={`${step.agent}-${index}`} className="agent-trace-row">
                  <span className={`trace-dot ${step.status}`} />
                  <strong>{step.agent}</strong>
                  <small className="mono">{step.latency_ms ? `${Math.round(step.latency_ms)}ms` : "cached"}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="verification-evidence">
            <span className="section-label">Release gate</span>
            <strong>{insight?.verification.checked_claims ?? 0} claims checked</strong>
            <p>{insight?.verification.notes ?? "No unsupported claim reaches the program monitor."}</p>
            <Link className="text-link" to={`/moment?match=${matchId}`}>
              Inspect event evidence <ArrowUpRight size={13} weight="bold" />
            </Link>
          </div>
        </aside>
      </div>

      <div className="deep-deck container-wide" id="hallucination-lab">
        {insight && (
          <AgentGraphVisualizer
            trace={insight.trace}
            verification={insight.verification}
            mcpInvocations={blackboard?.mcp_invocations}
          />
        )}
        {blackboard && (
          <HallucinationLab challenges={blackboard.hallucination_challenges} onSeekEvent={seekEvent} />
        )}
      </div>

      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        home={home}
        away={away}
        moment={selectedMoment}
        insight={insight}
        currentEvent={currentEvent}
      />
    </main>
  );
}
