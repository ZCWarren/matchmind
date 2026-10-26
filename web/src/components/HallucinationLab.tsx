import { ArrowRight, CheckCircle, Crosshair, Lightning, ShieldCheck, WarningOctagon } from "@phosphor-icons/react";
import { useState } from "react";
import type { HallucinationChallenge } from "../types";

type HallucinationLabProps = {
  challenges: HallucinationChallenge[];
  onSeekEvent?: (eventId: string) => void;
};

export default function HallucinationLab({ challenges, onSeekEvent }: HallucinationLabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [simulated, setSimulated] = useState<boolean>(true);

  if (!challenges.length) return null;
  const active = challenges[Math.min(selectedIndex, challenges.length - 1)];

  return (
    <section className="hallucination-lab" aria-label="Hallucination Gate Adversarial Lab">
      <header className="hallucination-lab-head">
        <div>
          <span className="section-label"><ShieldCheck size={14} /> Hallucination Gate · Adversarial Verifier Lab</span>
          <strong>Test what happens when a model invents a number or superlative</strong>
        </div>
        <div className="challenge-tabs" role="tablist">
          {challenges.map((item, idx) => (
            <button
              key={item.challenge_id}
              type="button"
              role="tab"
              aria-selected={selectedIndex === idx}
              className={selectedIndex === idx ? "active" : ""}
              onClick={() => {
                setSelectedIndex(idx);
                setSimulated(true);
              }}
            >
              <Lightning size={13} weight="fill" />
              <span>{idx === 0 ? "Trap #1: Fastest Sprint (33.4 vs 33.8)" : "Trap #2: Unverified Cue Number"}</span>
            </button>
          ))}
        </div>
      </header>

      {simulated && active && (
        <div className="challenge-body">
          <div className="challenge-injection">
            <div className="injection-meta">
              <span className={`verdict-pill ${active.verdict}`}>
                <WarningOctagon size={13} weight="fill" />
                {active.verdict === "reject" ? "DETERMINISTIC REJECT · WITHHELD" : "BOUNDED REVISE (1×) · REWRITTEN"}
              </span>
              <code>Code: {active.issue.code}</code>
              <code>MCP: {active.mcp_tool_used}()</code>
            </div>
            <p className="injected-quote">“{active.injected_claim}”</p>
            <div className="ground-truth-row">
              <span>{active.ground_truth_summary}</span>
              {onSeekEvent && active.counter_evidence_event_id && (
                <button
                  type="button"
                  className="counter-event-btn"
                  onClick={() => onSeekEvent(active.counter_evidence_event_id)}
                >
                  <Crosshair size={13} /> Inspect counter-evidence {active.counter_evidence_event_id}
                </button>
              )}
            </div>
          </div>

          <div className="challenge-diff-grid">
            <div className="diff-box before">
              <span className="diff-tag"><WarningOctagon size={12} /> Unverified Draft (Blocked)</span>
              <p>{active.before_text}</p>
            </div>
            <div className="diff-arrow" aria-hidden="true"><ArrowRight size={18} weight="bold" /></div>
            <div className="diff-box after">
              <span className="diff-tag"><CheckCircle size={12} /> Grounded Broadcast Output</span>
              <p>{active.after_text}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
