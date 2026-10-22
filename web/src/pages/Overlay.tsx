import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OverlayCueView from "../components/OverlayCueView";
import { api } from "../api";
import type { Event, FeatureSnapshot, Moment, OverlayCue, OverlayVariant } from "../types";

const HERO_MATCH = "ast-2026-1018-nhr-orn";

function chooseMoment(moments: Moment[]): Moment | null {
  const lineBreak = moments.find((moment) => moment.type === "line_break" && moment.clock.minute >= 70);
  return lineBreak ?? [...moments].sort((a, b) => b.importance - a.importance)[0] ?? null;
}

export default function Overlay() {
  const [params] = useSearchParams();
  const matchId = params.get("match") ?? HERO_MATCH;
  const preview = params.get("bg") === "1";
  const guides = params.get("guides") === "1";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("overlay-body");
    document.title = "MatchMind Overlay";
    return () => document.body.classList.remove("overlay-body");
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .events(matchId)
      .then((response) => {
        if (!cancelled) setEvents(response.events);
      })
      .catch(() => undefined);
    api
      .moments(matchId)
      .then(async (response) => {
        const moment = chooseMoment(response.moments);
        if (!moment) throw new Error("No moments available");
        const result = await api.insight(matchId, {
          moment_id: moment.moment_id,
          profiles: ["analyst", "casual", "player"],
          languages: ["en", "es", "zh"],
          use_cache: true,
          use_mcp: true,
        });
        const snapshot = await api.features(matchId, moment.event_id).catch(() => null);
        if (!cancelled) {
          setCue(result.cue);
          setMoment(moment);
          setFeatures(snapshot);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load overlay");
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return (
    <div className={`overlay-page ${preview ? "preview" : ""}`}>
      {error && <div className="overlay-waiting">{error.toUpperCase()}</div>}
      <div className="cue-stage">
        <OverlayCueView
          cue={cue}
          guides={guides}
          variant={variant}
          features={features}
          moment={moment}
          events={events}
        />
      </div>
    </div>
  );
}
