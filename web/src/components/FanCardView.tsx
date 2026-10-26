import { CaretDown, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { FanCard, MatchSummary } from "../types";
import { EASE } from "./fx";

const PROFILE_LABEL: Record<string, string> = {
  analyst: "Analyst",
  casual: "Casual",
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
  return (
    <motion.article
      key={`${card.profile}-${card.language}-${card.insight_id}`}
      className={`fan-card ${compact ? "compact" : ""}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      lang={card.language}
    >
      <div className="fan-card-kicker">
        <span className="chip ai"><Sparkle size={11} weight="fill" /> {PROFILE_LABEL[card.profile] ?? card.profile} · {LANGUAGE_LABEL[card.language] ?? card.language}</span>
        {match && (
          <span className="fan-card-score mono">
            {match.home.team_id} {match.final_score.home}–{match.final_score.away} {match.away.team_id}
          </span>
        )}
      </div>
      <h1 className="fan-card-headline">{card.headline}</h1>

      <div className="fan-sections">
        <div className="fan-section">
          <span className="fan-section-label">What happened</span>
          <p>{card.what_happened}</p>
        </div>
        <div className="fan-section">
          <span className="fan-section-label">Why it matters</span>
          <p>{card.why_it_matters}</p>
        </div>
        {card.watch_next && (
          <div className="fan-section">
            <span className="fan-section-label">Watch next</span>
            <p>{card.watch_next}</p>
          </div>
        )}
      </div>

      <button type="button" className={`fan-evidence-toggle ${open ? "open" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span><ShieldCheck size={15} weight="bold" /> How we know</span>
        <CaretDown size={14} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="fan-evidence-box"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p>{card.how_we_know}</p>
            <div className="event-chip-row">
              {card.evidence_event_ids.map((eventId) => (
                <code className="event-chip" key={eventId}>{eventId}</code>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
