import { ArrowUpRight, CaretDown, ShareNetwork, ShieldCheck, Sparkle, UsersThree } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AppNav from "../components/AppNav";
import FanCardView from "../components/FanCardView";
import ShareCardModal from "../components/ShareCardModal";
import { useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock, metricNumber } from "../lib";
import type { Language, MatchRecap, Profile } from "../types";

const PROFILES: { id: Profile; label: string; note: string }[] = [
  { id: "analyst", label: "Analyst", note: "Shape, threat and tactical structure" },
  { id: "casual", label: "Casual", note: "The turning point without jargon" },
  { id: "player", label: "Player Follow", note: "Follow one player's match & touches" },
];

export default function Fan() {
  const experience = useMatchExperience();
  const {
    matchId,
    setMatchId,
    matches,
    match,
    detail,
    home,
    away,
    events,
    selectedMoment,
    insight,
    features,
    currentEvent,
    error,
  } = experience;

  const [profile, setProfile] = useState<Profile>("casual");
  const [language, setLanguage] = useState<Language>("en");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [recap, setRecap] = useState<MatchRecap | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

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
    const active = [...lineups]
      .filter((player) => player.position !== "GK")
      .sort((a, b) => (counts.get(b.player_id) ?? 0) - (counts.get(a.player_id) ?? 0))[0];
    setPlayerId((current) =>
      lineups.some((player) => player.player_id === current) ? current : active?.player_id ?? null,
    );
  }, [events, lineups]);

  const selectedPlayer =
    lineups.find((player) => player.player_id === playerId) ??
    lineups.find((player) => player.position !== "GK") ??
    lineups[0];
  const selectedPlayerId = selectedPlayer?.player_id ?? null;
  const playerEvents = useMemo(
    () => (selectedPlayerId ? events.filter((event) => event.player_id === selectedPlayerId) : []),
    [events, selectedPlayerId],
  );
  const passes = playerEvents.filter((event) => event.type === "pass");
  const completed = passes.filter((event) => event.outcome === "complete").length;
  const shots = playerEvents.filter((event) => event.type === "shot").length;
  const topSpeed = Math.max(0, ...playerEvents.map((event) => event.speed_kmh ?? 0));
  const card =
    insight?.fan_cards.find((item) => item.profile === profile && item.language === language) ??
    insight?.fan_cards.find((item) => item.profile === profile);
  const score = features?.score ?? match?.final_score ?? { home: 0, away: 0 };
  const momentMetric = (name: string, digits = 2) => {
    const value = selectedMoment?.metrics[name]?.value;
    return value === undefined ? "--" : metricNumber(value, digits);
  };

  return (
    <main className="fan-page app-page">
      <AppNav matchId={matchId} />

      <section className="commandbar fan-match-header">
        <select
          className="fixture-select"
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
          aria-label="Select match"
        >
          {matches.map((item) => (
            <option key={item.match_id} value={item.match_id}>
              {item.home.short_name.toUpperCase()} vs {item.away.short_name.toUpperCase()}
            </option>
          ))}
        </select>

        <div className="scoreline fan-teams">
          <span className="team home">
            <i />
            {match?.home.name ?? "Nova Harbor"}
          </span>
          <strong className="mono">
            {score.home}
            <em>–</em>
            {score.away}
          </strong>
          <span className="team away">
            {match?.away.name ?? "Orion North"}
            <i />
          </span>
        </div>

        <div className="commandbar-actions">
          <span className="fan-moment-clock mono">
            {selectedMoment ? formatClock(selectedMoment.clock) : "--'--"}
          </span>
          <button
            type="button"
            className="btn btn-glass btn-sm share-poster-btn"
            onClick={() => setShareOpen(true)}
          >
            <ShareNetwork size={15} weight="bold" /> Poster
          </button>
          <Link className="btn btn-ghost btn-sm" to={`/moment?match=${matchId}`}>
            Explore in 3D <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <div className="fan-experience">
        <aside className="fan-profile-rail panel">
          <span className="section-label">
            <UsersThree size={14} weight="bold" /> Second-screen companion
          </span>
          <h2 className="display fan-rail-title">
            How do you want to <em>read it?</em>
          </h2>
          <p className="fan-rail-sub">
            Switch lens and language at any time. Every reading is generated from the same verified match events.
          </p>

          <div className="fan-profile-options">
            {PROFILES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={profile === item.id ? "active" : ""}
                onClick={() => setProfile(item.id)}
              >
                <div className="profile-opt-copy">
                  <strong>{item.label}</strong>
                  <span>{item.note}</span>
                </div>
                <ArrowUpRight size={15} weight="bold" />
              </button>
            ))}
          </div>

          <div className="fan-lang-block">
            <span className="section-label">Language</span>
            <div className="segmented fan-languages" aria-label="Language">
              {(["en", "es", "zh"] as Language[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={language === item ? "active" : ""}
                  onClick={() => setLanguage(item)}
                >
                  {item === "zh" ? "中文" : item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="fan-trust">
            <ShieldCheck size={18} weight="bold" />
            <span>Same evidence underneath every language and every point of view.</span>
          </div>
        </aside>

        <section className="fan-story">
          <div className="fan-story-metrics">
            <div className="panel metric-tile">
              <span>Threat added (xT)</span>
              <strong className="mono tone-ice">+{momentMetric("xt_delta", 3)}</strong>
            </div>
            <div className="panel metric-tile">
              <span>Event pressure</span>
              <strong className="mono tone-signal">{momentMetric("event_pressure")}</strong>
            </div>
            <div className="panel metric-tile">
              <span>Match top speed</span>
              <strong className="mono tone-flood">
                {features?.metrics.top_speed ? metricNumber(features.metrics.top_speed.value, 1) : "--"}
                <small>km/h</small>
              </strong>
            </div>
          </div>

          {card ? (
            <FanCardView card={card} match={match} />
          ) : (
            <div className="fan-card panel">
              <div className="skeleton" style={{ height: 24, width: "70%" }} />
              <div className="skeleton" style={{ height: 110, marginTop: 24 }} />
            </div>
          )}

          <div className="fan-evidence-note">
            <ShieldCheck size={15} weight="bold" /> Every number is checked against event-level evidence before it appears.
          </div>
        </section>

        <aside className="fan-context-rail">
          {profile === "player" ? (
            <div className="fan-player-panel panel">
              <span className="section-label">Player spotlight</span>
              <div className="fan-player-head">
                <div className="player-identity">
                  <span className="player-num mono">#{selectedPlayer?.number ?? "—"}</span>
                  <div>
                    <strong>{selectedPlayer?.name ?? "Select a player"}</strong>
                    <small className="mono">
                      {selectedPlayer?.team_id} · {selectedPlayer?.position}
                    </small>
                  </div>
                </div>
                <select
                  className="field-select"
                  value={selectedPlayerId ?? ""}
                  onChange={(event) => setPlayerId(event.target.value)}
                  aria-label="Select player"
                >
                  {lineups.map((player) => (
                    <option key={player.player_id} value={player.player_id}>
                      #{player.number} {player.name} ({player.team_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="player-numbers">
                <div>
                  <strong className="mono tone-ice">{passes.length}</strong>
                  <span>Passes</span>
                </div>
                <div>
                  <strong className="mono tone-verify">
                    {passes.length ? Math.round((completed / passes.length) * 100) : 0}%
                  </strong>
                  <span>Complete</span>
                </div>
                <div>
                  <strong className="mono tone-signal">{shots}</strong>
                  <span>Shots</span>
                </div>
                <div>
                  <strong className="mono tone-flood">{topSpeed ? topSpeed.toFixed(1) : "--"}</strong>
                  <span>Top km/h</span>
                </div>
              </div>

              <div className="player-event-log">
                <span className="section-label">Recent involvements</span>
                {playerEvents
                  .slice(-5)
                  .reverse()
                  .map((event) => (
                    <div key={event.event_id} className="player-event-row">
                      <span className="mono">{formatClock(event.clock)}</span>
                      <strong>{event.type.replaceAll("_", " ")}</strong>
                      <small className="mono">{event.outcome ?? event.event_id}</small>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="fan-why-panel panel">
              <span className="section-label">
                <Sparkle size={13} weight="fill" /> One moment, three readings
              </span>
              <h2 className="display">
                {profile === "analyst" ? (
                  <>
                    See the <em>mechanism.</em>
                  </>
                ) : (
                  <>
                    Feel the <em>turning point.</em>
                  </>
                )}
              </h2>
              <p>
                {profile === "analyst"
                  ? "Follow the pressure, territory and tactical consequences behind the headline — with exact event IDs attached."
                  : "Understand why one pass matters in seconds, without needing a coaching manual."}
              </p>
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={() => setProfile("player")}
              >
                Explore player spotlight <ArrowUpRight size={14} weight="bold" />
              </button>
            </div>
          )}

          {recap && (
            <details className="fan-recap panel">
              <summary>
                <span>Match recap</span>
                <CaretDown size={15} weight="bold" />
              </summary>
              <div className="fan-recap-body">
                <h3>{recap.title}</h3>
                <p>{recap.summary}</p>
                <div className="fan-recap-list">
                  {recap.key_moments.slice(0, 5).map((moment) => (
                    <div className="fan-recap-row" key={`${moment.clock.minute}-${moment.type}`}>
                      <span className="mono">{formatClock(moment.clock)}</span>
                      <strong>{moment.type.replaceAll("_", " ")}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </aside>
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
