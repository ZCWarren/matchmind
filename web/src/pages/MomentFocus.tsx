import { ArrowUpRight, Check, Clock, Eye, GitBranch, ListBullets, ShareNetwork, UsersThree } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AgentGraphVisualizer from "../components/AgentGraphVisualizer";
import AppNav from "../components/AppNav";
import FanCardView from "../components/FanCardView";
import HallucinationLab from "../components/HallucinationLab";
import MomentTimeline from "../components/moment/MomentTimeline";
import SceneLoader from "../components/moment/SceneLoader";
import ShareCardModal from "../components/ShareCardModal";
import TacticalCopilot from "../components/TacticalCopilot";
import { useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock, metricNumber } from "../lib";
import type { Language, Profile } from "../types";

type ViewMode = "events" | "structure" | "evidence" | "audiences";

const VIEWS = [
  { id: "events" as const, label: "Events", icon: ListBullets },
  { id: "structure" as const, label: "Structure", icon: GitBranch },
  { id: "evidence" as const, label: "Evidence", icon: Check },
  { id: "audiences" as const, label: "Audiences", icon: UsersThree },
];

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
  const nearbyEvents = events.slice(Math.max(0, cursor - 3), cursor + 4);

  return (
    <main className="moment-page">
      <AppNav matchId={matchId} />
      <section className="moment-commandbar">
        <select className="fixture-select" value={matchId} onChange={(event) => setMatchId(event.target.value)} aria-label="Select match">
          {matches.map((item) => <option key={item.match_id} value={item.match_id}>{item.home.name} vs {item.away.name}</option>)}
        </select>
        <div className="moment-scoreline">
          <span>{home?.short_name.toUpperCase() ?? "NHR"}</span>
          <strong>{score.home}<i>:</i>{score.away}</strong>
          <span>{away?.short_name.toUpperCase() ?? "ORN"}</span>
        </div>
        <span className="moment-live-label">{currentEvent ? formatClock(currentEvent.clock) : "--:--"} / {currentEvent?.type.replaceAll("_", " ") ?? "loading"}</span>
        <div className="commandbar-actions">
          <button type="button" className="share-poster-btn" onClick={() => setShareOpen(true)}>
            <ShareNetwork size={14} weight="bold" /> Poster
          </button>
          <Link className="text-link" to={`/studio?match=${matchId}`}>Open in Studio <ArrowUpRight size={14} /></Link>
        </div>
      </section>
      {error && <div className="error-banner">{error}</div>}

      <div className="moment-workspace">
        <nav className="view-switch" aria-label="Moment layers">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={view === id ? "active" : ""} onClick={() => setView(id)}>
              <Icon size={18} weight="bold" /><span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="moment-canvas">
          <div className="canvas-heading">
            <div>
              <span className="section-label">{view === "structure" ? "The hidden shape of the match" : `Moment ${view}`}</span>
              <h1>{insight?.insight?.headline ?? selectedMoment?.headline ?? "Revealing the match"}</h1>
            </div>
            <span className="verified-stamp"><Check size={14} weight="bold" /> {insight?.verification.status ?? "event data"}</span>
          </div>
          <div className="scene-wrap">
            <SceneLoader events={events} cursor={cursor} home={home} away={away} />
            <div className="scene-coordinate">{currentEvent?.player_id ?? "MATCH"} / X {currentEvent?.location.x.toFixed(1) ?? "--"} / Y {currentEvent?.location.y.toFixed(1) ?? "--"}</div>
            <div className="scene-metric">
              <span>Event pressure</span>
              <strong>{currentEvent?.pressure.toFixed(2) ?? "--"}</strong>
            </div>
          </div>
          <MomentTimeline
            events={events}
            moments={moments}
            cursor={cursor}
            playing={playing}
            onPlay={() => setPlaying(!playing)}
            onSeek={(index) => { setPlaying(false); setCursor(index); }}
            onMoment={selectMoment}
          />
        </section>

        <aside className="moment-inspector">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              className="inspector-content"
            >
              {view === "events" && (
                <>
                  <div className="inspector-title"><ListBullets size={17} /> Event anatomy</div>
                  <p className="inspector-intro">Every visible line begins with a real event. Select one to move the scene.</p>
                  <div className="event-anatomy-list">
                    {nearbyEvents.map((event) => (
                      <button key={event.event_id} type="button" className={event.event_id === currentEvent?.event_id ? "active" : ""} onClick={() => seekEvent(event.event_id)}>
                        <span>{formatClock(event.clock)}</span>
                        <strong>{event.type.replaceAll("_", " ")}</strong>
                        <small>{event.player_id ?? event.team_id ?? "Match"} / {event.event_id}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {view === "structure" && (
                <>
                  <div className="inspector-title"><GitBranch size={17} /> What the score cannot show</div>
                  <p className="inspector-intro">{insight?.insight?.why_it_matters ?? "Move through the event stream to reveal pressure, passing lines and territorial threat."}</p>
                  <div className="structure-metrics">
                    {["event_pressure", "xt_delta", "difficulty", "event_speed"].map((name) => {
                      const metric = metrics[name] ?? features?.metrics[name];
                      return metric ? (
                        <div key={name}><span>{name.replaceAll("_", " ")}</span><strong>{metricNumber(metric.value, name === "xt_delta" ? 3 : 2)}</strong><small>{metric.unit}</small></div>
                      ) : null;
                    })}
                  </div>
                  <div className="agent-sequence">
                    <span className="section-label">Five-agent run</span>
                    {insight?.trace.map((step, index) => (
                      <div key={`${step.agent}-${index}`} className={step.status !== "ok" ? "degraded" : ""}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{step.agent}</strong>
                        <small>{step.status}</small>
                      </div>
                    )) ?? <p className="empty-note">The agent trace appears with the cached or live insight.</p>}
                  </div>
                </>
              )}

              {view === "evidence" && (
                <>
                  <div className="inspector-title"><Check size={17} /> Claims meet evidence</div>
                  <p className="inspector-intro">Select a claim. The scene returns to the exact event behind it.</p>
                  <div className="claim-list">
                    {insight?.insight?.claims.map((claim, index) => (
                      <button key={`${claim.text}-${index}`} type="button" className={selectedClaim === index ? "active" : ""} onClick={() => { setSelectedClaim(index); if (claim.event_ids[0]) seekEvent(claim.event_ids[0]); }}>
                        <span>Claim {index + 1}</span>
                        <strong>{claim.text}</strong>
                        <small>{claim.event_ids.join(" / ")}</small>
                        {claim.metric_refs.map((ref) => <em key={ref.name}>{ref.name} {ref.value} / {ref.formula_version}</em>)}
                      </button>
                    )) ?? <p className="empty-note">No generated claims for this moment. Raw events remain available.</p>}
                  </div>
                  {insight && <div className="verification-note"><Check size={15} /> {insight.verification.checked_claims} claims checked. {insight.verification.notes}</div>}
                </>
              )}

              {view === "audiences" && (
                <>
                  <div className="inspector-title"><UsersThree size={17} /> Same truth, different depth</div>
                  <div className="segmented-control">
                    {(["analyst", "casual", "player"] as Profile[]).map((item) => <button key={item} className={profile === item ? "active" : ""} onClick={() => setProfile(item)} type="button">{item}</button>)}
                  </div>
                  <div className="language-control">
                    {(["en", "es", "zh"] as Language[]).map((item) => <button key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)} type="button">{item === "zh" ? "中文" : item.toUpperCase()}</button>)}
                  </div>
                  {card ? <FanCardView card={card} match={match} /> : <p className="empty-note">No audience card is cached for this moment.</p>}
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="inspector-foot"><Clock size={13} /> {selectedMoment ? `${formatClock(selectedMoment.clock)} / ${selectedMoment.analytics_version}` : "Loading match data"}</div>
        </aside>
      </div>

      <div className="moment-deep-deck">
        {insight && (
          <AgentGraphVisualizer
            trace={insight.trace}
            verification={insight.verification}
            mcpInvocations={blackboard?.mcp_invocations}
          />
        )}
        <TacticalCopilot
          matchId={matchId}
          blackboard={blackboard}
          moments={moments}
          selectedMomentId={selectedMoment?.moment_id}
          onSelectMoment={selectMoment}
          onSeekEvent={seekEvent}
        />
        {blackboard && (
          <HallucinationLab
            challenges={blackboard.hallucination_challenges}
            onSeekEvent={seekEvent}
          />
        )}
      </div>

      <div className="moment-bottom-note"><Eye size={14} /> Data creates the structure. Agents explain it. Evidence decides what goes on air.</div>
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
