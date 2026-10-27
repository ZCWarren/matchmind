import { ArrowUpRight, Check, Eye, GitBranch, ListBullets, ShareNetwork, UsersThree } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AgentGraphVisualizer from "../components/AgentGraphVisualizer";
import AppNav from "../components/AppNav";
import FanCardView from "../components/FanCardView";
import { EASE } from "../components/fx";
import HallucinationLab from "../components/HallucinationLab";
import MomentTimeline from "../components/moment/MomentTimeline";
import SceneLoader from "../components/moment/SceneLoader";
import ShareCardModal from "../components/ShareCardModal";
import TacticalCopilot from "../components/TacticalCopilot";
import { useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock, metricNumber } from "../lib";
import { displayPlayer, displayPlayerIds, momentPlayerLabels } from "../lib/playerDisplay";
import type { Language, Profile } from "../types";

type ViewMode = "events" | "structure" | "evidence" | "audiences";

const VIEWS = [
  { id: "events" as const, label: "Events", icon: ListBullets },
  { id: "structure" as const, label: "Structure", icon: GitBranch },
  { id: "evidence" as const, label: "Evidence", icon: Check },
  { id: "audiences" as const, label: "Audiences", icon: UsersThree },
];

const METRIC_LABEL: Record<string, string> = {
  event_pressure: "Pressure",
  xt_delta: "Threat added",
  difficulty: "Difficulty",
  event_speed: "Speed",
};

export default function MomentFocus() {
  const experience = useMatchExperience();
  const {
    matchId, matches, setMatchId, match, home, away, events, moments, selectedMoment,
    selectMoment, features, insight, blackboard, currentEvent, cursor, setCursor, playing, setPlaying,
    seekEvent, error,
  } = experience;
  const [view, setView] = useState<ViewMode>("structure");
  const [profile, setProfile] = useState<Profile>("analyst");
  const [language, setLanguage] = useState<Language>("en");
  const [selectedClaim, setSelectedClaim] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const card = insight?.fan_cards.find((item) => item.profile === profile && item.language === language)
    ?? insight?.fan_cards.find((item) => item.profile === profile);
  const score = currentEvent?.score ?? match?.final_score ?? { home: 0, away: 0 };
  const metrics = selectedMoment?.metrics ?? {};
  const nearbyEvents = events.slice(Math.max(0, cursor - 4), cursor + 4);
  const pressure = currentEvent?.pressure ?? 0;
  const narrative = `${insight?.insight?.headline ?? selectedMoment?.headline ?? ""} ${insight?.insight?.why_it_matters ?? ""}`;
  const playerLabels = useMemo(() => momentPlayerLabels(events, selectedMoment, narrative), [events, selectedMoment, narrative]);
  const readable = (text: string) => displayPlayerIds(text, playerLabels, [home, away].filter((team): team is NonNullable<typeof team> => Boolean(team)));

  return (
    <main className="moment-page app-page">
      <AppNav matchId={matchId} />
      <section className="commandbar">
        <select className="fixture-select" value={matchId} onChange={(event) => setMatchId(event.target.value)} aria-label="Select match">
          {matches.map((item) => <option key={item.match_id} value={item.match_id}>{item.home.name} vs {item.away.name}</option>)}
        </select>
        <div className="scoreline">
          <span className="team home"><i />{home?.name ?? "Nova Harbor"}</span>
          <strong className="mono">{score.home}<em>–</em>{score.away}</strong>
          <span className="team away">{away?.name ?? "Orion North"}<i /></span>
        </div>
        <div className="commandbar-actions">
          <button type="button" className="btn btn-glass btn-sm share-poster-btn" onClick={() => setShareOpen(true)}>
            <ShareNetwork size={15} weight="bold" /> Poster
          </button>
          <Link className="btn btn-ghost btn-sm" to={`/studio?match=${matchId}`}>Open in Studio <ArrowUpRight size={14} /></Link>
        </div>
      </section>
      {error && <div className="error-banner">{error}</div>}

      <div className="moment-workspace">
        <section className="moment-stage panel">
          <div className="stage-scene">
            <SceneLoader events={events} cursor={cursor} home={home} away={away} variant="focus" playerLabels={playerLabels} />
            <div className="stage-shade" aria-hidden="true" />
            <div className="stage-headline">
              <span className="stage-kicker">
                <span className="live-dot" />
                {selectedMoment ? formatClock(selectedMoment.clock) : "--'--"} · {selectedMoment?.type.replaceAll("_", " ") ?? "moment"}
                <span className="verified-stamp"><Check size={12} weight="bold" /> {insight?.verification.status ?? "event data"}</span>
              </span>
            </div>
          </div>
          <div className="stage-context">
            <h1>{readable(insight?.insight?.headline ?? selectedMoment?.headline ?? "Revealing the match")}</h1>
            <div className="stage-context-facts">
              <span>{displayPlayer(currentEvent?.player_id, playerLabels)} · {currentEvent?.type.replaceAll("_", " ") ?? "play"}</span>
              <span>Pressure <strong className="mono">{currentEvent ? pressure.toFixed(2) : "--"}</strong></span>
            </div>
          </div>
          <MomentTimeline
            events={events}
            moments={moments}
            cursor={cursor}
            playing={playing}
            selectedMomentId={selectedMoment?.moment_id}
            onPlay={() => setPlaying(!playing)}
            onSeek={(index) => { setPlaying(false); setCursor(index); }}
            onMoment={selectMoment}
          />
        </section>

        <aside className="moment-inspector panel">
          <nav className="layer-tabs" aria-label="Moment layers">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={view === id ? "active" : ""} onClick={() => setView(id)}>
                {view === id && <motion.span className="layer-tab-pill" layoutId="layer-tab-pill" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <Icon size={16} weight="bold" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="inspector-scroll">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="inspector-content"
              >
                {view === "events" && (
                  <>
                    <h2 className="inspector-title">Event anatomy</h2>
                    <p className="inspector-intro">Every line on the pitch begins with a logged event. Select one to move the scene.</p>
                    <div className="event-anatomy-list">
                      {nearbyEvents.map((event) => (
                        <button key={event.event_id} type="button" className={event.event_id === currentEvent?.event_id ? "active" : ""} onClick={() => seekEvent(event.event_id)}>
                          <span className="mono">{formatClock(event.clock)}</span>
                          <strong>{event.type.replaceAll("_", " ")}</strong>
                          <small className={event.team_id === home?.team_id ? "home" : "away"}>{event.player_id ? displayPlayer(event.player_id, playerLabels) : event.team_id ?? "Match"}</small>
                          <i className="mini-meter"><b style={{ width: `${event.pressure * 100}%` }} /></i>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {view === "structure" && (
                  <>
                    <h2 className="inspector-title">What the score can't show</h2>
                    <p className="inspector-intro">{readable(insight?.insight?.why_it_matters ?? "Move through the event stream to reveal pressure, passing lanes and territorial threat.")}</p>
                    <div className="structure-metrics">
                      {["event_pressure", "xt_delta", "difficulty", "event_speed"].map((name) => {
                        const metric = metrics[name] ?? features?.metrics[name];
                        return metric ? (
                          <div key={name}>
                            <span>{METRIC_LABEL[name] ?? name.replaceAll("_", " ")}</span>
                            <strong className="mono">{metricNumber(metric.value, name === "xt_delta" ? 3 : 2)}</strong>
                            <small>{metric.formula_version}</small>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <div className="agent-sequence">
                      <span className="section-label">Five-agent run</span>
                      {insight?.trace.map((step, index) => (
                        <div key={`${step.agent}-${index}`} className={step.status !== "ok" ? "degraded" : ""}>
                          <span className="mono">{String(index + 1).padStart(2, "0")}</span>
                          <strong>{step.agent}</strong>
                          <small className="mono">{step.latency_ms ? `${(step.latency_ms / 1000).toFixed(1)}s` : step.status}</small>
                        </div>
                      )) ?? <p className="empty-note">The agent trace appears with the cached or live insight.</p>}
                    </div>
                  </>
                )}

                {view === "evidence" && (
                  <>
                    <h2 className="inspector-title">Claims meet evidence</h2>
                    <p className="inspector-intro">Select a claim — the scene jumps to the exact event behind it.</p>
                    <div className="claim-list">
                      {insight?.insight?.claims.map((claim, index) => (
                        <button key={`${claim.text}-${index}`} type="button" className={selectedClaim === index ? "active" : ""} onClick={() => { setSelectedClaim(index); if (claim.event_ids[0]) seekEvent(claim.event_ids[0]); }}>
                          <span className="claim-n mono">Claim {index + 1} · {Math.round(claim.confidence * 100)}%</span>
                          <strong>{readable(claim.text)}</strong>
                          <span className="claim-refs">
                            {claim.event_ids.slice(0, 3).map((id) => <code key={id}>{id}</code>)}
                            {claim.metric_refs.slice(0, 2).map((ref) => <code key={ref.name} className="metric">{ref.name} {ref.value}</code>)}
                          </span>
                        </button>
                      )) ?? <p className="empty-note">No generated claims for this moment. Raw events remain available.</p>}
                    </div>
                    {insight && <div className="verification-note"><Check size={15} weight="bold" /> {insight.verification.checked_claims} claims checked · {insight.verification.notes}</div>}
                  </>
                )}

                {view === "audiences" && (
                  <>
                    <h2 className="inspector-title">Same truth, different depth</h2>
                    <div className="audience-controls">
                      <div className="segmented segmented-control">
                        {(["analyst", "casual", "player"] as Profile[]).map((item) => <button key={item} className={profile === item ? "active" : ""} onClick={() => setProfile(item)} type="button">{item}</button>)}
                      </div>
                      <div className="segmented language-control">
                        {(["en", "es", "zh"] as Language[]).map((item) => <button key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)} type="button">{item === "zh" ? "中文" : item.toUpperCase()}</button>)}
                      </div>
                    </div>
                    {card ? <FanCardView card={card} match={match} compact /> : <p className="empty-note">No audience card is cached for this moment.</p>}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="inspector-foot mono">{selectedMoment ? `${selectedMoment.moment_id} · ${selectedMoment.analytics_version}` : "Loading match data"}</div>
        </aside>
      </div>

      <div className="deep-deck container-wide">
        {insight && (
          <AgentGraphVisualizer trace={insight.trace} verification={insight.verification} mcpInvocations={blackboard?.mcp_invocations} />
        )}
        <TacticalCopilot
          matchId={matchId}
          blackboard={blackboard}
          moments={moments}
          selectedMomentId={selectedMoment?.moment_id}
          onSelectMoment={selectMoment}
          onSeekEvent={seekEvent}
        />
        {blackboard && <HallucinationLab challenges={blackboard.hallucination_challenges} onSeekEvent={seekEvent} />}
      </div>

      <p className="page-note"><Eye size={14} /> Data creates the structure. Agents explain it. Evidence decides what goes on air.</p>
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
