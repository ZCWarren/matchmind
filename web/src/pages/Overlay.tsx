import { ArrowLeft, Broadcast, ShieldCheck } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import OverlayCueView, { type ScorebugInfo } from "../components/OverlayCueView";
import { eventIndex } from "../hooks/useMatchExperience";
import { formatClock } from "../lib";
import type { Event, FeatureSnapshot, Moment, OverlayCue, OverlayVariant, Team } from "../types";

const HERO_MATCH = "ast-2026-1018-nhr-orn";

const TEMPLATES: { id: OverlayVariant; label: string; short: string }[] = [
  { id: "lower_third", label: "Lower third", short: "L3" },
  { id: "stat_card", label: "Stat card", short: "STAT" },
  { id: "momentum", label: "Momentum", short: "MOM" },
  { id: "speed_alert", label: "Speed alert", short: "SPD" },
  { id: "pressure_map", label: "Pressure map", short: "MAP" },
];

function chooseMoment(moments: Moment[]): Moment | null {
  const lineBreak = moments.find((moment) => moment.type === "line_break" && moment.clock.minute >= 70);
  return lineBreak ?? [...moments].sort((a, b) => b.importance - a.importance)[0] ?? null;
}

export default function Overlay() {
  const [params, setParams] = useSearchParams();
  const matchId = params.get("match") ?? HERO_MATCH;
  const preview = params.get("bg") === "1";
  const guides = params.get("guides") === "1";
  const humanApproved = params.get("approval") === "approved";
  const requestedTemplate = params.get("template");
  const variant: OverlayVariant =
    requestedTemplate === "stat_card" ||
    requestedTemplate === "momentum" ||
    requestedTemplate === "speed_alert" ||
    requestedTemplate === "pressure_map"
      ? requestedTemplate
      : "lower_third";

  const [cue, setCue] = useState<OverlayCue | null>(null);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [features, setFeatures] = useState<FeatureSnapshot | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [home, setHome] = useState<Team | null>(null);
  const [away, setAway] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("overlay-body");
    document.title = "MatchMind Overlay";
    return () => document.body.classList.remove("overlay-body");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCue(null);
    setMoment(null);
    setFeatures(null);
    setError(null);
    api
      .match(matchId)
      .then((detail) => {
        if (!cancelled) {
          setHome(detail.match.home);
          setAway(detail.match.away);
        }
      })
      .catch(() => undefined);
    api
      .events(matchId)
      .then((response) => {
        if (!cancelled) setEvents(response.events);
      })
      .catch(() => undefined);
    api
      .moments(matchId)
      .then(async (response) => {
        const chosen = chooseMoment(response.moments);
        if (!chosen) throw new Error("No moments available");
        const result = await api.insight(matchId, {
          moment_id: chosen.moment_id,
          profiles: ["analyst", "casual", "player"],
          languages: ["en", "es", "zh"],
          use_cache: true,
          use_mcp: true,
        });
        const snapshot = await api.features(matchId, chosen.event_id).catch(() => null);
        if (!cancelled) {
          setCue(result.decision.action === "approve" || humanApproved ? result.cue : null);
          setMoment(chosen);
          setFeatures(snapshot);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load overlay");
      });
    return () => {
      cancelled = true;
    };
  }, [matchId, humanApproved]);

  const setQueryParam = (key: string, value: string | null) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const idx = moment && events.length ? eventIndex(events, moment.event_id) : -1;
  const ev = idx >= 0 ? events[idx] : undefined;
  const scorebug: ScorebugInfo = {
    home: home?.short_name ?? "NHR",
    away: away?.short_name ?? "ORN",
    score: ev?.score ?? features?.score ?? { home: 1, away: 1 },
    clock: moment ? formatClock(moment.clock) : "72'12",
  };

  return (
    <div className={`overlay-page ${preview ? "preview" : "transparent"}`}>
      {preview && (
        <div className="overlay-backdrop" aria-hidden="true">
          <div className="overlay-beams" />
          <div className="overlay-pitch-grid" />
        </div>
      )}

      {preview && (
        <header className="overlay-dock">
          <Link to={`/studio?match=${matchId}`} className="dock-back">
            <ArrowLeft size={14} weight="bold" /> Studio
          </Link>
          <span className="dock-sep" />
          <span className="dock-label">
            <Broadcast size={14} weight="bold" /> 1920×1080 Broadcast Source
          </span>
          <div className="segmented dock-templates" role="tablist" aria-label="Overlay templates">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                role="tab"
                aria-selected={variant === tpl.id}
                className={variant === tpl.id ? "active" : ""}
                onClick={() => setQueryParam("template", tpl.id === "lower_third" ? null : tpl.id)}
              >
                {tpl.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`dock-safe ${guides ? "active" : ""}`}
            onClick={() => setQueryParam("guides", guides ? null : "1")}
          >
            <ShieldCheck size={14} weight="bold" /> Safe guides
          </button>
        </header>
      )}

      {error && <div className="overlay-error">{error}</div>}

      <div className="cue-stage">
        <OverlayCueView
          cue={cue}
          guides={guides}
          variant={variant}
          features={features}
          moment={moment}
          events={events}
          scorebug={preview ? scorebug : null}
          homeTeam={home}
          awayTeam={away}
        />
      </div>
    </div>
  );
}
