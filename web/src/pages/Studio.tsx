import { ArrowCounterClockwise, ArrowUpRight, Broadcast, Check, Monitor, Pause, Play, ShieldCheck, Sparkle, Stop, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AppNav from "../components/AppNav";
import OverlayCueView from "../components/OverlayCueView";
import { eventIndex, useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock } from "../lib";
import type { InsightResult, OverlayVariant } from "../types";

const OVERLAYS: { id: OverlayVariant; label: string }[] = [
  { id: "lower_third", label: "L3" },
  { id: "stat_card", label: "STAT" },
  { id: "momentum", label: "MOM" },
  { id: "speed_alert", label: "SPD" },
  { id: "pressure_map", label: "MAP" },
];

export default function Studio() {
  const experience = useMatchExperience();
  const {
    matchId, setMatchId, matches, match, home, away, events, moments, selectedMoment,
    setSelectedMoment, selectMoment, features, setFeatures, insight, setInsight, currentEvent,
    cursor, setCursor,
    playing, setPlaying, speed, setSpeed, generating, allowLive, staticDemo, error, generate,
  } = experience;
  const [variant, setVariant] = useState<OverlayVariant>("lower_third");
  const [safe, setSafe] = useState(true);
  const [approval, setApproval] = useState<"approved" | "held" | "killed">("held");
  const [live, setLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
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
  useEffect(() => { stopLive(); }, [matchId, stopLive]);

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
    socket.onerror = () => { setLiveError("Live feed disconnected"); setLive(false); };
    socket.onclose = () => { if (socketRef.current === socket) { socketRef.current = null; setLive(false); } };
  };

  const score = currentEvent?.score ?? match?.final_score ?? { home: 0, away: 0 };
  const momentIndex = eventIndex(events, selectedMoment?.event_id);
  const cueVisible = approval === "approved" && insight?.cue && cursor >= momentIndex ? insight.cue : null;
  const rundown = insight?.rundown?.length ? insight.rundown : moments.slice(0, 8).map((moment, index) => ({
    moment_id: moment.moment_id,
    rank: index + 1,
    action: "hold" as const,
    reason: "Waiting for Director review",
    air_at: null,
  }));
  const momentById = new Map(moments.map((moment) => [moment.moment_id, moment]));

  return (
    <main className="studio-page">
      <AppNav matchId={matchId} />
      <section className="studio-commandbar">
        <select className="fixture-select" value={matchId} onChange={(event) => setMatchId(event.target.value)} aria-label="Select match">
          {matches.map((item) => <option key={item.match_id} value={item.match_id}>{item.home.name} vs {item.away.name}</option>)}
        </select>
        <div className="studio-score"><span>{home?.short_name.toUpperCase()}</span><strong>{score.home} : {score.away}</strong><span>{away?.short_name.toUpperCase()}</span><small>{currentEvent ? formatClock(currentEvent.clock) : "--:--"}</small></div>
        <div className="replay-controls">
          <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause replay" : "Play replay"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
          <button type="button" onClick={() => { setPlaying(false); setCursor(Math.max(0, momentIndex - 6)); }} aria-label="Reset replay"><ArrowCounterClockwise size={15} /></button>
          {[1, 10, 60].map((value) => <button type="button" key={value} className={speed === value ? "active" : ""} onClick={() => setSpeed(value)}>{value}x</button>)}
        </div>
        <button className={`live-button ${live ? "active" : ""}`} type="button" onClick={live ? stopLive : startLive} disabled={staticDemo}>
          {live ? <Stop size={14} /> : <Broadcast size={14} />} {live ? "Stop feed" : staticDemo ? "Static demo" : "Go live"}
        </button>
        <button className="generate-button" type="button" onClick={() => void generate()} disabled={!allowLive || generating || !selectedMoment}>
          <Sparkle size={15} /> {generating ? "Agents working" : allowLive ? "Generate" : "Cached"}
        </button>
      </section>

      {(error || liveError) && <div className="error-banner">{error ?? liveError}</div>}
      <div className="studio-workspace">
        <section className="rundown-panel">
          <header><div><span className="section-label">Director's rundown</span><h1>What deserves airtime?</h1></div><span>{rundown.length} moments</span></header>
          <div className="rundown-list">
            {rundown.map((entry) => {
              const moment = momentById.get(entry.moment_id);
              if (!moment) return null;
              return (
                <button key={entry.moment_id} type="button" className={selectedMoment?.moment_id === entry.moment_id ? "active" : ""} onClick={() => selectMoment(moment)}>
                  <span className="rundown-rank">{String(entry.rank).padStart(2, "0")}</span>
                  <span className="rundown-copy"><strong>{moment.headline}</strong><small>{formatClock(moment.clock)} / {moment.type.replaceAll("_", " ")}</small><em>{entry.reason}</em></span>
                  <span className={`rundown-state ${entry.action}`}>{entry.action}</span>
                </button>
              );
            })}
          </div>
          <div className="rundown-rule"><ShieldCheck size={15} /> 60s dedupe / 15s airtime gap / stoppage preferred</div>
        </section>

        <section className="program-panel">
          <header><span className="section-label">Program monitor</span><Link to={`/overlay?bg=1&match=${matchId}&approval=${approval}`}>Full screen <ArrowUpRight size={13} /></Link></header>
          <div className="program-screen">
            <div className="program-match-meta"><span>{home?.name} vs {away?.name}</span><span>{currentEvent ? formatClock(currentEvent.clock) : "--:--"}</span></div>
            <OverlayCueView cue={cueVisible} guides={safe} variant={variant} features={features} moment={selectedMoment} events={events} compact />
            {!cueVisible && <div className="program-hold"><Monitor size={30} /><strong>{approval === "held" ? "Cue held off air" : "Waiting for a verified cue"}</strong><span>The program output changes only after approval.</span></div>}
          </div>
          <div className="overlay-switch">
            {OVERLAYS.map((item) => <button type="button" key={item.id} className={variant === item.id ? "active" : ""} onClick={() => setVariant(item.id)}>{item.label}</button>)}
            <button type="button" className={safe ? "active safe" : "safe"} onClick={() => setSafe(!safe)}><ShieldCheck size={13} /> SAFE</button>
          </div>
          <div className="studio-timeline">
            <input aria-label="Studio replay timeline" type="range" min={0} max={Math.max(0, events.length - 1)} value={cursor} onChange={(event) => { setPlaying(false); setCursor(Number(event.target.value)); }} />
            <div><span>{events[cursor]?.event_id ?? "No event"}</span><span>{cursor + 1} / {events.length}</span></div>
          </div>
        </section>

        <aside className="decision-panel">
          <header><span className="section-label">Decision inspector</span><span className={`decision-status ${insight?.verification.status ?? "loading"}`}>{insight?.verification.status ?? "loading"}</span></header>
          <div className="decision-story">
            <span>{selectedMoment ? formatClock(selectedMoment.clock) : "--:--"} / SELECTED MOMENT</span>
            <h2 className="insight-headline">{insight?.insight?.headline ?? selectedMoment?.headline ?? "Select a moment"}</h2>
            <p>{insight?.decision.reason ?? "The Director will explain why this moment should air or wait."}</p>
            {insight?.decision.air_at && <div className="air-slot"><Broadcast size={15} /><span>Suggested airtime</span><strong>{formatClock(insight.decision.air_at)}</strong></div>}
          </div>
          <div className="approval-controls">
            <button type="button" className={approval === "approved" ? "active" : ""} disabled={!insight?.cue || insight.verification.status !== "pass"} onClick={() => setApproval("approved")}><Check size={15} /> Approve</button>
            <button type="button" className={approval === "held" ? "active" : ""} onClick={() => setApproval("held")}><Pause size={15} /> Hold</button>
            <button type="button" className={approval === "killed" ? "active" : ""} onClick={() => { setApproval("killed"); }} aria-label="Kill cue"><X size={15} /></button>
          </div>
          <div className="agent-trace">
            <span className="section-label">Agent trace</span>
            {insight?.trace.map((step, index) => (
              <div key={`${step.agent}-${index}`}><span className={step.status}>{step.status}</span><strong>{step.agent}</strong><small>{step.latency_ms ? `${Math.round(step.latency_ms)}ms` : "cached"}</small></div>
            ))}
          </div>
          <div className="verification-evidence">
            <span className="section-label">Release gate</span>
            <strong>{insight?.verification.checked_claims ?? 0} claims checked</strong>
            <p>{insight?.verification.notes ?? "No unsupported claim reaches the program monitor."}</p>
            <Link to={`/moment?match=${matchId}`}>Inspect event evidence <ArrowUpRight size={13} /></Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
