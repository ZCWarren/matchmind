import type { OverlayCue } from "../types";

export default function OverlayCueView({
  cue,
  guides = false,
  compact = false,
}: {
  cue: OverlayCue | null;
  guides?: boolean;
  compact?: boolean;
}) {
  if (!cue) {
    return <div className="overlay-waiting">MATCHMIND / WAITING FOR VERIFIED INSIGHT</div>;
  }
  const { eyebrow, headline, stat, subline } = cue.payload;
  return (
    <>
      {guides && <div className="overlay-safe" />}
      <div className={`overlay-cue ${compact ? "compact" : ""}`} role="status" aria-live="polite">
        <div className="cue-topline">
          <span className="cue-eyebrow">{eyebrow ?? "MATCH INTELLIGENCE"}</span>
          <span className="cue-id">EVIDENCE VERIFIED</span>
        </div>
        <h2 className="cue-headline">{headline}</h2>
        <div className="cue-stat">
          <strong>{stat.split("·")[0]?.trim() ?? stat}</strong>
          <span>{stat.includes("·") ? stat.split("·").slice(1).join("·").trim() : "VERIFIED"}</span>
        </div>
        <p className="cue-subline">{subline}</p>
        <div className="cue-brand">
          <b>MM</b> MATCHMIND / EVIDENCE VERIFIED
        </div>
      </div>
    </>
  );
}
