import {
  CheckCircle,
  Eye,
  Pause,
  Robot,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import type { InsightResult } from "../types";

const ROLES = [
  ["TacticalAnalyst", "Analyst"],
  ["StoryProducer", "Producer"],
  ["AudienceEditor", "Audience"],
  ["FactChecker", "Verifier"],
  ["Director", "Director"],
] as const;

function verificationTone(status: string): string {
  if (status === "pass") return "ok";
  if (status === "revise") return "warn";
  return "bad";
}

export default function AgentRundown({
  result,
  status,
  cached,
  generating,
  allowLive,
  onApprove,
  onHold,
  onGenerate,
  onEvidence,
}: {
  result: InsightResult | null;
  status: "approved" | "held";
  cached: boolean;
  generating: boolean;
  allowLive: boolean;
  onApprove: () => void;
  onHold: () => void;
  onGenerate: () => void;
  onEvidence: () => void;
}) {
  const verified = result?.verification.status === "pass";
  return (
    <section className="panel rundown-panel">
      <header className="panel-head">
        <span className="panel-title">
          <Robot size={13} /> Agent rundown
        </span>
        <span className="rundown-count">
          <span className="source-tag ai">AI explanation</span>
          {result ? `${result.verification.checked_claims} CLAIMS` : "IDLE"}
        </span>
      </header>
      <div className="rundown-body">
        {!result && (
          <div className="empty-state">
            <strong>No verified insight loaded</strong>
            <span>
              {allowLive
                ? "Generate a rundown from the selected moment. The cached hero insight is instant; a live run takes about a minute."
                : "This is a cached public demo. Select the hero match to view the precomputed rundown."}
            </span>
            <button
              className="btn btn-primary"
              type="button"
              onClick={onGenerate}
              disabled={generating || !allowLive}
            >
              {generating ? <span className="spinner" /> : <Sparkle size={12} />}
              {generating ? "Generating" : allowLive ? "Generate insight" : "Cached only"}
            </button>
          </div>
        )}

        {result && (
          <article className={`insight-card ${status === "held" ? "held" : ""}`}>
            <div className="insight-top">
              <span className={`chip ${verificationTone(result.verification.status)}`}>
                {result.verification.status === "pass" ? (
                  <CheckCircle size={10} />
                ) : (
                  <WarningCircle size={10} />
                )}
                {result.verification.status === "pass" ? "Verified" : result.verification.status}
              </span>
              <span className="chip">{cached ? "Cached" : "Live"}</span>
            </div>
            <h2 className="insight-headline">{result.insight?.headline ?? result.moment.headline}</h2>
            <p className="insight-why">{result.insight?.why_it_matters}</p>
            <div className="insight-meta">
              <span>{result.moment.type.replace(/_/g, " ")}</span>
              <span>CONF {Math.round((result.insight?.confidence ?? 0) * 100)}%</span>
              <span>{result.decision.action.toUpperCase()}</span>
            </div>
            <div className="insight-actions">
              {status === "held" ? (
                <button className="btn btn-primary btn-wide" type="button" onClick={onApprove}>
                  <CheckCircle size={11} /> Approve on air
                </button>
              ) : (
                <button className="btn btn-quiet btn-wide" type="button" onClick={onHold}>
                  <Pause size={11} /> Hold
                </button>
              )}
              <button className="btn btn-quiet" type="button" onClick={onEvidence}>
                <Eye size={11} /> Evidence
              </button>
            </div>

            <div className="agent-rail">
              {ROLES.map(([agent, label]) => {
                const step = result.trace.find((item) => item.agent.startsWith(agent));
                const state = step?.status ?? (cached ? "cached" : "queued");
                return (
                  <div className="agent-row" key={agent}>
                    <span className={`agent-dot ${state === "cached" ? "ok" : state}`} />
                    <span className="agent-name">{label}</span>
                    <span className="agent-latency">
                      {step ? `${Math.round(step.latency_ms)}ms` : state.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>

            {result.verification.issues.length > 0 && (
              <div className="insight-meta" style={{ color: "var(--amber)" }}>
                <WarningCircle size={10} />
                {result.verification.issues.length} verifier note
                {result.verification.issues.length === 1 ? "" : "s"}
              </div>
            )}
          </article>
        )}

        {!verified && result && (
          <div className="error-banner">
            <WarningCircle size={13} />
            <span>
              This insight is held: the deterministic verifier did not clear every claim.
              Nothing is sent to the overlay.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
