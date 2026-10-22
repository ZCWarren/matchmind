import { clamp, formatClock } from "../lib";
import type { FeatureSnapshot, Moment, OverlayCue, OverlayVariant } from "../types";

function metric(features: FeatureSnapshot | null | undefined, name: string): number | null {
  const value = features?.metrics[name]?.value;
  return typeof value === "number" ? value : null;
}

function StatCard({
  cue,
  features,
  compact,
  moment,
}: {
  cue: OverlayCue;
  features?: FeatureSnapshot | null;
  compact: boolean;
  moment?: Moment | null;
}) {
  const { eyebrow, headline, subline } = cue.payload;
  const xgHome = metric(features, "xg_home");
  const xgAway = metric(features, "xg_away");
  const xtHome = metric(features, "xt_home");
  const xtAway = metric(features, "xt_away");
  const pressure = moment?.metrics.event_pressure?.value ?? metric(features, "pressure");
  return (
    <div className={`overlay-variant stat-card ${compact ? "compact" : ""}`} role="status" aria-live="polite">
      <div className="variant-top">
        <span>{eyebrow ?? "MOMENT SNAPSHOT"}</span>
        <span>{moment ? formatClock(moment.clock) : "VERIFIED"}</span>
      </div>
      <h2>{headline}</h2>
      <div className="stat-grid">
        <div>
          <span>xG H / A</span>
          <b>{xgHome !== null ? xgHome.toFixed(2) : "—"} / {xgAway !== null ? xgAway.toFixed(2) : "—"}</b>
        </div>
        <div>
          <span>xT H / A</span>
          <b>{xtHome !== null ? xtHome.toFixed(1) : "—"} / {xtAway !== null ? xtAway.toFixed(1) : "—"}</b>
        </div>
        <div>
          <span>Event press</span>
          <b>{pressure !== null ? pressure.toFixed(2) : cue.payload.stat?.split("·")[0] ?? "—"}</b>
        </div>
      </div>
      <p>{subline}</p>
    </div>
  );
}

function Momentum({
  cue,
  features,
  compact,
  moment,
}: {
  cue: OverlayCue;
  features?: FeatureSnapshot | null;
  compact: boolean;
  moment?: Moment | null;
}) {
  const home = metric(features, "control_home") ?? 0.5;
  const away = metric(features, "control_away") ?? 0.5;
  const controlTotal = home + away || 1;
  const homeShare = home / controlTotal;
  const awayShare = away / controlTotal;
  const chaos = metric(features, "chaos") ?? 0;
  const momentum = metric(features, "momentum") ?? 0;
  const pressure = metric(features, "pressure") ?? 0;
  const momentumPct = clamp((momentum + 1) * 50, 0, 100);
  return (
    <div className={`overlay-variant momentum ${compact ? "compact" : ""}`} role="status" aria-live="polite">
      <div className="variant-top">
        <span>MATCH MOMENTUM</span>
        <span>{moment ? formatClock(moment.clock) : "VERIFIED"}</span>
      </div>
      <div className="momentum-title">
        <b>{cue.payload.headline}</b>
        <span>{momentum >= 0 ? "NHR" : "ORN"} {momentum >= 0 ? "+" : ""}{momentum.toFixed(2)}</span>
      </div>
      <div className="control-bar">
        <i style={{ width: `${clamp(homeShare * 100, 0, 100)}%` }} />
        <em style={{ width: `${clamp(awayShare * 100, 0, 100)}%` }} />
      </div>
      <div className="control-labels">
        <span>NHR {home.toFixed(2)}</span>
        <span>CONTROL SHARE</span>
        <span>{away.toFixed(2)} ORN</span>
      </div>
      <div className="momentum-meter">
        <span>CHAOS {chaos.toFixed(2)}</span>
        <div><i style={{ width: `${momentumPct}%` }} /></div>
        <span>PRESS {pressure.toFixed(2)}</span>
      </div>
    </div>
  );
}

function SpeedAlert({
  features,
  compact,
}: {
  features?: FeatureSnapshot | null;
  compact: boolean;
}) {
  const speed = metric(features, "top_speed") ?? 0;
  return (
    <div className={`overlay-variant speed-alert ${compact ? "compact" : ""}`} role="status" aria-live="polite">
      <div className="variant-top">
        <span>SPEED ALERT</span>
        <span>LIVE / VERIFIED</span>
      </div>
      <div className="speed-value">
        {speed ? speed.toFixed(1) : "—"}<small>km/h</small>
      </div>
      <b>Fastest sprint this match</b>
      <p>
        Peak tracked speed across{" "}
        {features?.event_count ? features.event_count.toLocaleString() : "all"} events.
      </p>
      <div className="speed-foot">TOP SPEED / THIS MATCH</div>
    </div>
  );
}

export default function OverlayCueView({
  cue,
  guides = false,
  compact = false,
  variant = "lower_third",
  features = null,
  moment = null,
}: {
  cue: OverlayCue | null;
  guides?: boolean;
  compact?: boolean;
  variant?: OverlayVariant;
  features?: FeatureSnapshot | null;
  moment?: Moment | null;
}) {
  if (!cue) {
    return <div className="overlay-waiting">MATCHMIND / WAITING FOR VERIFIED INSIGHT</div>;
  }
  const { eyebrow, headline, stat, subline } = cue.payload;
  return (
    <>
      {guides && <div className="overlay-safe" />}
      {variant === "stat_card" && (
        <StatCard cue={cue} features={features} compact={compact} moment={moment} />
      )}
      {variant === "momentum" && (
        <Momentum cue={cue} features={features} compact={compact} moment={moment} />
      )}
      {variant === "speed_alert" && (
        <SpeedAlert features={features} compact={compact} />
      )}
      {variant === "lower_third" && (
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
      )}
    </>
  );
}
