import { ArrowRight, CheckCircle, Crosshair, ShieldCheck, WarningOctagon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState } from "react";
import type { HallucinationChallenge } from "../types";
import { EASE } from "./fx";

type HallucinationLabProps = {
  challenges: HallucinationChallenge[];
  onSeekEvent?: (eventId: string) => void;
};

const COPY = [
  {
    tab: "Fake 'fastest sprint'",
    before: "“Fastest sprint of the match at 33.4 km/h” — false. Minute 31 was faster, at 33.8 km/h.",
    after: "“24.6 m pass through 0.82 pressure” — every number backed by a logged event.",
  },
  {
    tab: "Invented '94.6%' stat",
    before: "“94.6% pass threat index” — false. The model invented the number.",
    after: "“Slices the press under 0.82 pressure (+0.174 threat)” — verified and safe for air.",
  },
];

export default function HallucinationLab({ challenges, onSeekEvent }: HallucinationLabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  if (!challenges.length) return null;
  const active = challenges[Math.min(selectedIndex, challenges.length - 1)];
  const copy = COPY[selectedIndex] ?? COPY[0];

  return (
    <section className="hallucination-lab panel" aria-label="AI fact-check lab">
      <header className="deck-head">
        <div>
          <span className="section-label"><ShieldCheck size={14} /> Hallucination lab</span>
          <h2 className="deck-title">What happens when AI <em>exaggerates?</em></h2>
        </div>
        <div className="segmented challenge-tabs" role="tablist">
          {challenges.map((item, idx) => (
            <button
              key={item.challenge_id}
              type="button"
              role="tab"
              aria-selected={selectedIndex === idx}
              className={selectedIndex === idx ? "active" : ""}
              onClick={() => setSelectedIndex(idx)}
            >
              Test {idx + 1}: {COPY[idx]?.tab ?? item.title}
            </button>
          ))}
        </div>
      </header>

        <motion.div
          key={active.challenge_id}
          className="challenge-body"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="challenge-injection">
            <div className="injection-meta">
              <span className={`verdict-pill ${active.verdict}`}>
                <WarningOctagon size={14} weight="fill" />
                {active.verdict === "reject" ? "Caught & blocked" : "Caught & auto-fixed"}
              </span>
              <span className="injection-agent">injected into {active.target_agent} · checked with <code>{active.mcp_tool_used}</code></span>
              {onSeekEvent && active.counter_evidence_event_id && (
                <button type="button" className="counter-event-btn" onClick={() => onSeekEvent(active.counter_evidence_event_id)}>
                  <Crosshair size={13} /> See the real proof on the pitch
                </button>
              )}
            </div>
            <p className="injected-quote">“{active.injected_claim}”</p>
          </div>

          <div className="challenge-diff">
            <div className="diff-box before">
              <span className="diff-tag"><WarningOctagon size={14} /> Blocked claim</span>
              <p>{copy.before}</p>
            </div>
            <div className="diff-arrow" aria-hidden="true"><ArrowRight size={20} weight="bold" /></div>
            <div className="diff-box after">
              <span className="diff-tag"><CheckCircle size={14} /> What airs instead</span>
              <p>{copy.after}</p>
            </div>
          </div>
        </motion.div>
    </section>
  );
}
