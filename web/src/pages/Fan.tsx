import { ArrowUpRight, CaretDown, ShieldCheck } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AppNav from "../components/AppNav";
import FanCardView from "../components/FanCardView";
import { useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock, metricNumber } from "../lib";
import type { Language, MatchRecap, Profile } from "../types";

const PROFILES: { id: Profile; label: string; note: string }[] = [
  { id: "analyst", label: "Analyst", note: "Shape, threat and detail" },
  { id: "casual", label: "Casual", note: "The story without jargon" },
  { id: "player", label: "Player", note: "Follow one player's match" },
];

export default function Fan() {
  const experience = useMatchExperience();
  const { matchId, setMatchId, matches, match, detail, events, selectedMoment, insight, features, error } = experience;
  const [profile, setProfile] = useState<Profile>("casual");
  const [language, setLanguage] = useState<Language>("en");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [recap, setRecap] = useState<MatchRecap | null>(null);

  useEffect(() => {
    setRecap(null);
    api.recap(matchId).then(setRecap).catch(() => undefined);
  }, [matchId]);

  const lineups = useMemo(() => detail?.match.lineups ?? [], [detail]);
  useEffect(() => {
    if (!lineups.length) return;
    const counts = new Map<string, number>();
    events.forEach((event) => {
      if (event.player_id) counts.set(event.player_id, (counts.get(event.player_id) ?? 0) + 1);
    });
    const active = [...lineups].filter((player) => player.position !== "GK")
      .sort((a, b) => (counts.get(b.player_id) ?? 0) - (counts.get(a.player_id) ?? 0))[0];
    setPlayerId((current) => lineups.some((player) => player.player_id === current)
      ? current
      : active?.player_id ?? null);
  }, [events, lineups]);

  const selectedPlayer = lineups.find((player) => player.player_id === playerId)
    ?? lineups.find((player) => player.position !== "GK")
    ?? lineups[0];
  const selectedPlayerId = selectedPlayer?.player_id ?? null;
  const playerEvents = useMemo(
    () => selectedPlayerId ? events.filter((event) => event.player_id === selectedPlayerId) : [],
    [events, selectedPlayerId],
  );
  const passes = playerEvents.filter((event) => event.type === "pass");
  const completed = passes.filter((event) => event.outcome === "complete").length;
  const shots = playerEvents.filter((event) => event.type === "shot").length;
  const topSpeed = Math.max(0, ...playerEvents.map((event) => event.speed_kmh ?? 0));
  const card = insight?.fan_cards.find((item) => item.profile === profile && item.language === language)
    ?? insight?.fan_cards.find((item) => item.profile === profile);
  const score = features?.score ?? match?.final_score ?? { home: 0, away: 0 };
  const momentMetric = (name: string, digits = 2) => {
    const value = selectedMoment?.metrics[name]?.value;
    return value === undefined ? "--" : metricNumber(value, digits);
  };

  return (
    <main className="fan-page new-fan-page">
      <AppNav matchId={matchId} />
      <section className="fan-match-header">
        <select value={matchId} onChange={(event) => setMatchId(event.target.value)} aria-label="Select match">
          {matches.map((item) => <option key={item.match_id} value={item.match_id}>{item.home.short_name.toUpperCase()} vs {item.away.short_name.toUpperCase()}</option>)}
        </select>
        <div className="fan-teams"><span>{match?.home.name ?? "Nova Harbor"}</span><strong>{score.home}<i>:</i>{score.away}</strong><span>{match?.away.name ?? "Orion North"}</span></div>
        <span className="fan-moment-clock">{selectedMoment ? formatClock(selectedMoment.clock) : "--:--"}</span>
        <Link to={`/moment?match=${matchId}`}>Explore this moment <ArrowUpRight size={14} /></Link>
      </section>
      {error && <div className="error-banner">{error}</div>}

      <div className="fan-experience">
        <aside className="fan-profile-rail">
          <span className="section-label">Your match, your depth</span>
          <h1>How do you want to see it?</h1>
          <div className="fan-profile-options">
            {PROFILES.map((item) => (
              <button key={item.id} type="button" className={profile === item.id ? "active" : ""} onClick={() => setProfile(item.id)}>
                <strong>{item.label}</strong><span>{item.note}</span><ArrowUpRight size={15} />
              </button>
            ))}
          </div>
          <div className="fan-languages" aria-label="Language">
            {(["en", "es", "zh"] as Language[]).map((item) => <button type="button" key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>{item === "zh" ? "中文" : item.toUpperCase()}</button>)}
          </div>
          <div className="fan-trust"><ShieldCheck size={18} /><span>Same evidence underneath every language and every point of view.</span></div>
        </aside>

        <section className="fan-story">
          <div className="fan-story-metrics">
            <div><span>xT added</span><strong>{momentMetric("xt_delta", 3)}</strong></div>
            <div><span>Pressure</span><strong>{momentMetric("event_pressure")}</strong></div>
            <div><span>Match top speed</span><strong>{features?.metrics.top_speed ? metricNumber(features.metrics.top_speed.value, 1) : "--"}<small>km/h</small></strong></div>
          </div>
          {card ? <FanCardView card={card} match={match} /> : <div className="fan-card"><div className="skeleton" style={{ height: 24, width: "70%" }} /><div className="skeleton" style={{ height: 100, marginTop: 24 }} /></div>}
          <div className="fan-evidence-note"><ShieldCheck size={14} /> Every number is checked against event-level evidence before it appears.</div>
        </section>

        <aside className="fan-context-rail">
          {profile === "player" ? (
            <div className="fan-player-panel">
              <span className="section-label">Player focus</span>
              <div className="fan-player-head">
                <strong>{selectedPlayer?.name ?? "Select a player"}</strong>
                <select value={selectedPlayerId ?? ""} onChange={(event) => setPlayerId(event.target.value)} aria-label="Select player">
                  {lineups.map((player) => <option key={player.player_id} value={player.player_id}>{player.number} {player.name}</option>)}
                </select>
                <CaretDown size={13} />
              </div>
              <div className="player-numbers">
                <div><strong>{passes.length}</strong><span>Passes</span></div>
                <div><strong>{passes.length ? Math.round(completed / passes.length * 100) : 0}%</strong><span>Complete</span></div>
                <div><strong>{shots}</strong><span>Shots</span></div>
                <div><strong>{topSpeed ? topSpeed.toFixed(1) : "--"}</strong><span>Top km/h</span></div>
              </div>
              <div className="player-event-log">
                {playerEvents.slice(-5).reverse().map((event) => <div key={event.event_id}><span>{formatClock(event.clock)}</span><strong>{event.type}</strong><small>{event.outcome ?? event.event_id}</small></div>)}
              </div>
            </div>
          ) : (
            <div className="fan-why-panel">
              <span className="section-label">One moment, three readings</span>
              <h2>{profile === "analyst" ? "See the mechanism." : "Feel the turning point."}</h2>
              <p>{profile === "analyst" ? "Follow the pressure, territory and tactical consequences behind the headline." : "Understand why one pass matters without needing a tactics manual."}</p>
            </div>
          )}
          {recap && (
            <details className="fan-recap">
              <summary><span>Match recap</span><CaretDown size={15} /></summary>
              <h2>{recap.title}</h2>
              <p>{recap.summary}</p>
              {recap.key_moments.slice(0, 5).map((moment) => <div className="fan-recap-row" key={`${moment.clock.minute}-${moment.type}`}><span>{formatClock(moment.clock)}</span><strong>{moment.type.replaceAll("_", " ")}</strong></div>)}
            </details>
          )}
        </aside>
      </div>
    </main>
  );
}
