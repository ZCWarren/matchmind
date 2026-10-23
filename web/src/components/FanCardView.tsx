import { CaretDown, ShieldCheck } from "@phosphor-icons/react";
import { useState } from "react";
import type { FanCard, MatchSummary } from "../types";

const PROFILE_LABEL: Record<string, string> = {
  analyst: "Analyst mode",
  casual: "Casual mode",
  player: "Player focus",
};

const LANGUAGE_LABEL: Record<string, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
};

export default function FanCardView({
  card,
  match,
  compact = false,
}: {
  card: FanCard;
  match: MatchSummary | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const kicker = `${PROFILE_LABEL[card.profile] ?? card.profile} / ${LANGUAGE_LABEL[card.language] ?? card.language}`;
  return (
    <article className={`fan-card ${compact ? "compact" : ""}`}>
      <div className="fan-card-kicker">
        <span className="chip ok">{kicker}</span>
        <span className="source-tag ai">AI explanation</span>
        {match && (
          <span className="mono dim" style={{ fontSize: 8 }}>
            {match.home.short_name.toUpperCase()} {match.final_score.home} - {match.final_score.away}{" "}
            {match.away.short_name.toUpperCase()}
          </span>
        )}
      </div>
      <h1 className="fan-card-headline">{card.headline}</h1>

      <div className="fan-section">
        <div className="fan-section-label">What happened</div>
        <p>{card.what_happened}</p>
      </div>
      <div className="fan-section">
        <div className="fan-section-label">Why it matters</div>
        <p>{card.why_it_matters}</p>
      </div>
      {card.watch_next && (
        <div className="fan-section">
          <div className="fan-section-label">What to watch next</div>
          <p>{card.watch_next}</p>
        </div>
      )}

      <button type="button" className="fan-evidence-toggle" onClick={() => setOpen((value) => !value)}>
        <span>
          <ShieldCheck size={12} style={{ marginRight: 5, verticalAlign: -2 }} />
          How we know
        </span>
        <CaretDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms" }} />
      </button>
      {open && (
        <div className="fan-evidence-box">
          <p style={{ margin: "0 0 7px" }}>{card.how_we_know}</p>
          <div className="event-chip-row">
            {card.evidence_event_ids.map((eventId) => (
              <span className="event-chip" key={eventId}>
                {eventId}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
