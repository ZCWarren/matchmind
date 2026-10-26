import { ArrowRight, CheckCircle, Crosshair, Lightning, ShieldCheck, WarningOctagon } from "@phosphor-icons/react";
import { useState } from "react";
import type { HallucinationChallenge } from "../types";

type HallucinationLabProps = {
  challenges: HallucinationChallenge[];
  onSeekEvent?: (eventId: string) => void;
};

export default function HallucinationLab({ challenges, onSeekEvent }: HallucinationLabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!challenges.length) return null;
  const active = challenges[Math.min(selectedIndex, challenges.length - 1)];

  return (
    <section className="hallucination-lab" aria-label="AI Fact-Check Lab">
      <header className="hallucination-lab-head">
        <div>
          <span className="section-label"><ShieldCheck size={14} /> AI FACT-CHECK GUARD</span>
          <strong>What happens when AI tries to exaggerate?</strong>
        </div>
        <div className="challenge-tabs" role="tablist">
          {challenges.map((item, idx) => (
            <button
              key={item.challenge_id}
              type="button"
              role="tab"
              aria-selected={selectedIndex === idx}
              className={selectedIndex === idx ? "active" : ""}
              onClick={() => setSelectedIndex(idx)}
            >
              <Lightning size={14} weight="fill" />
              <span>{idx === 0 ? "Test 1: Fake 'Fastest Sprint'" : "Test 2: Fake '94.6%' Stat"}</span>
            </button>
          ))}
        </div>
      </header>

      {active && (
        <div className="challenge-body">
          <div className="challenge-injection">
            <div className="injection-meta">
              <span className={`verdict-pill ${active.verdict}`}>
                <WarningOctagon size={14} weight="fill" />
                {active.verdict === "reject" ? "CAUGHT & BLOCKED" : "CAUGHT & AUTO-FIXED"}
              </span>
              {onSeekEvent && active.counter_evidence_event_id && (
                <button
                  type="button"
                  className="counter-event-btn"
                  onClick={() => onSeekEvent(active.counter_evidence_event_id)}
                >
                  <Crosshair size={13} /> See real proof on 3D pitch
                </button>
              )}
            </div>
            <p className="injected-quote">“{active.injected_claim}”</p>
          </div>

          <div className="challenge-diff-grid">
            <div className="diff-box before">
              <span className="diff-tag"><WarningOctagon size={14} /> Blocked AI Claim</span>
              <p>{selectedIndex === 0 ? "“Fastest sprint of the match at 33.4 km/h” — False! Minute 31 was faster (33.8 km/h)." : "“94.6% pass threat index” — False! Number was invented by the model."}</p>
            </div>
            <div className="diff-arrow" aria-hidden="true"><ArrowRight size={22} weight="bold" /></div>
            <div className="diff-box after">
              <span className="diff-tag"><CheckCircle size={14} /> Verified TV Broadcast</span>
              <p>{selectedIndex === 0 ? "“24.6m pass through 0.82 pressure” — 100% backed by real match data." : "“Slices the press under 0.82 pressure (+0.174 threat)” — Verified & safe for air."}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
