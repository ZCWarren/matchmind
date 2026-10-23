import { MagnifyingGlass, ShieldCheck, Target, WarningCircle } from "@phosphor-icons/react";
import { eventLabel, formatClock, shortId } from "../lib";
import type { Event, InsightResult } from "../types";

export default function EvidenceDrawer({
  result,
  events,
  selectedClaim,
  onSelectClaim,
  onSelectEvent,
}: {
  result: InsightResult | null;
  events: Event[];
  selectedClaim: number;
  onSelectClaim: (index: number) => void;
  onSelectEvent: (eventId: string) => void;
}) {
  const insight = result?.insight;
  const claim = insight?.claims[selectedClaim];
  const eventMap = new Map(events.map((event) => [event.event_id, event]));
  return (
    <section className="panel evidence-panel">
      <header className="panel-head">
        <span className="panel-title">
          <MagnifyingGlass size={13} /> Evidence
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="source-tag evidence">Evidence</span>
          <span className="mono dim" style={{ fontSize: 8 }}>
            {claim ? `CLAIM ${selectedClaim + 1}/${insight?.claims.length}` : "NO CLAIM"}
          </span>
        </span>
      </header>
      <div className="evidence-body">
        {!result || !insight ? (
          <div className="empty-state">
            <strong>Evidence is attached to every insight</strong>
            <span>Load a rundown to inspect event IDs, metric formulas, and verifier notes.</span>
          </div>
        ) : (
          <>
            {insight.claims.map((item, index) => (
              <button
                key={item.text}
                type="button"
                className={`claim-btn ${selectedClaim === index ? "active" : ""}`}
                onClick={() => onSelectClaim(index)}
              >
                <span className="claim-index">{String(index + 1).padStart(2, "0")}</span>
                {item.text}
              </button>
            ))}

            {claim && (
              <div className="claim-evidence">
                <div className="evidence-subhead">
                  <Target size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Event IDs
                </div>
                <div className="event-chip-row">
                  {claim.event_ids.map((eventId) => (
                    <button
                      type="button"
                      key={eventId}
                      className="event-chip"
                      onClick={() => onSelectEvent(eventId)}
                    >
                      {shortId(eventId)}
                    </button>
                  ))}
                </div>

                <div className="evidence-subhead">Metric references</div>
                {claim.metric_refs.length === 0 && (
                  <div className="mono dim" style={{ fontSize: 8 }}>
                    EVENT-LEVEL EVIDENCE ONLY
                  </div>
                )}
                {claim.metric_refs.map((ref) => (
                  <div className="metric-line" key={`${ref.name}-${ref.value}`}>
                    <span>{ref.name}</span>
                    <b>{ref.value}</b>
                    <span>{ref.formula_version}</span>
                  </div>
                ))}

                {claim.event_ids[0] && eventMap.get(claim.event_ids[0]) && (
                  <>
                    <div className="evidence-subhead">Primary event</div>
                    <div className="metric-line">
                      <span>{eventLabel(eventMap.get(claim.event_ids[0])!.type, eventMap.get(claim.event_ids[0])!.player_id)}</span>
                      <b>{formatClock(eventMap.get(claim.event_ids[0])!.clock)}</b>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="evidence-subhead">
              <ShieldCheck size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
              Verifier notes
            </div>
            {result.verification.issues.length === 0 ? (
              <div className="mono dim" style={{ fontSize: 8, lineHeight: 1.5 }}>
                DETERMINISTIC GATE: PASS
                <br />
                {result.verification.notes || "NO ISSUES"}
              </div>
            ) : (
              result.verification.issues.map((issue, index) => (
                <div className="metric-line" key={`${issue.code}-${index}`} style={{ alignItems: "flex-start" }}>
                  <span style={{ color: issue.severity === "error" ? "var(--coral)" : "var(--amber)" }}>
                    <WarningCircle size={10} />
                  </span>
                  <span style={{ flex: 1, whiteSpace: "normal" }}>{issue.message}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </section>
  );
}
