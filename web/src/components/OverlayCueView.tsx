import { CheckCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clamp, formatClock } from "../lib";
import { displayPlayer, displayPlayerIds, momentPlayerLabels } from "../lib/playerDisplay";
import type { Event, FeatureSnapshot, Moment, OverlayCue, OverlayVariant, Team } from "../types";
import { BrandMark } from "./Brand";

const EASE = [0.16, 1, 0.3, 1] as const;

function metric(features: FeatureSnapshot | null | undefined, name: string): number | null {
  const value = features?.metrics[name]?.value;
  return typeof value === "number" ? value : null;
}

/** Renders a 1920×1080 broadcast canvas scaled to fit its container (program monitor or browser source). */
export function BroadcastCanvas({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const width = node.clientWidth;
      const height = node.clientHeight;
      if (width && height) setScale(Math.min(width / 1920, height / 1080));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`broadcast-viewport ${className}`} ref={ref}>
      <div className="broadcast-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

const plateIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};

const rise = (delay: number) => ({
  initial: { y: 8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.24, ease: EASE, delay: Math.min(delay, 0.12) },
});

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="ov-tag">
      <CheckCircle size={18} weight="fill" /> {children}
    </span>
  );
}

function Brandline() {
  return (
    <span className="ov-brand">
      <BrandMark size={22} /> MatchMind
    </span>
  );
}

/* ------------------------------------------------------------------ lower third */

function LowerThird({ cue, moment }: { cue: OverlayCue; moment?: Moment | null }) {
  const { eyebrow, headline, stat, subline } = cue.payload;
  const [statMain, ...statRest] = stat.split("·");
  return (
    <motion.div
      className="overlay-cue ov-plate"
      role="status"
      aria-live="polite"
      {...plateIn}
      transition={{ duration: 0.28, ease: EASE }}
    >
      <div className="l3-top">
        <motion.span className="l3-eyebrow" {...rise(0.25)}>
          <i className="l3-live" /> {eyebrow ?? (moment ? formatClock(moment.clock) : "Match intelligence")}
        </motion.span>
        <motion.span {...rise(0.35)}><Tag>Evidence verified</Tag></motion.span>
      </div>
      <div className="l3-main">
        <motion.i className="l3-accent" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 }} />
        <div className="l3-body">
          <motion.h2 className="cue-headline" {...rise(0.38)}>{headline}</motion.h2>
          <motion.p className="cue-subline" {...rise(0.5)}>{subline}</motion.p>
        </div>
        <motion.div className="l3-stat cue-stat" {...rise(0.6)}>
          <strong>{statMain?.trim() ?? stat}</strong>
          <span>{statRest.length ? statRest.join("·").trim() : "verified"}</span>
        </motion.div>
      </div>
      <div className="l3-foot">
        <Brandline />
        <span className="l3-foot-note">Every number traced to a logged event</span>
      </div>
      <span className="ov-shine" aria-hidden="true" />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ stat card */

function StatCard({ cue, features, moment }: { cue: OverlayCue; features?: FeatureSnapshot | null; moment?: Moment | null }) {
  const { eyebrow, headline, subline } = cue.payload;
  const xgHome = metric(features, "xg_home");
  const xgAway = metric(features, "xg_away");
  const xtHome = metric(features, "xt_home");
  const xtAway = metric(features, "xt_away");
  const pressure = moment?.metrics.event_pressure?.value ?? metric(features, "pressure");
  const xtDelta = moment?.metrics.xt_delta?.value ?? null;
  const tiles = [
    { label: "Expected goals", home: xgHome, away: xgAway, digits: 2 },
    { label: "Expected threat", home: xtHome, away: xtAway, digits: 1 },
  ];
  return (
    <motion.div className="overlay-variant stat-card ov-plate" role="status" aria-live="polite" {...plateIn} transition={{ duration: 0.28, ease: EASE }}>
      <div className="sc-head">
        <motion.span className="l3-eyebrow" {...rise(0.2)}><i className="l3-live" /> {eyebrow ?? "Moment snapshot"}</motion.span>
        <motion.span className="sc-clock" {...rise(0.25)}>{moment ? formatClock(moment.clock) : "LIVE"}</motion.span>
      </div>
      <motion.h2 {...rise(0.3)}>{headline}</motion.h2>
      <div className="sc-hero">
        <motion.div {...rise(0.4)}>
          <span>Pressure beaten</span>
          <b className="sig">{pressure !== null ? pressure.toFixed(2) : "—"}</b>
        </motion.div>
        <motion.div {...rise(0.48)}>
          <span>Threat added</span>
          <b className="ice">{xtDelta !== null ? `+${xtDelta.toFixed(3)}` : cue.payload.stat?.split("·")[0] ?? "—"}</b>
        </motion.div>
      </div>
      {tiles.map((tile, index) => {
        const total = (tile.home ?? 0) + (tile.away ?? 0) || 1;
        return (
          <motion.div className="sc-row" key={tile.label} {...rise(0.55 + index * 0.08)}>
            <span className="sc-val home">{tile.home !== null ? tile.home.toFixed(tile.digits) : "—"}</span>
            <div className="sc-bar">
              <span>{tile.label}</span>
              <i><motion.b className="home" initial={{ width: 0 }} animate={{ width: `${((tile.home ?? 0) / total) * 100}%` }} transition={{ duration: 1, ease: EASE, delay: 0.7 }} /><motion.b className="away" initial={{ width: 0 }} animate={{ width: `${((tile.away ?? 0) / total) * 100}%` }} transition={{ duration: 1, ease: EASE, delay: 0.75 }} /></i>
            </div>
            <span className="sc-val away">{tile.away !== null ? tile.away.toFixed(tile.digits) : "—"}</span>
          </motion.div>
        );
      })}
      <motion.p className="sc-sub" {...rise(0.75)}>{subline}</motion.p>
      <div className="l3-foot"><Brandline /><Tag>Verified</Tag></div>
      <span className="ov-shine" aria-hidden="true" />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ momentum */

function Momentum({ cue, features, moment }: { cue: OverlayCue; features?: FeatureSnapshot | null; moment?: Moment | null }) {
  const home = metric(features, "control_home") ?? 0.5;
  const away = metric(features, "control_away") ?? 0.5;
  const total = home + away || 1;
  const chaos = metric(features, "chaos") ?? 0;
  const momentum = metric(features, "momentum") ?? 0;
  const pressure = metric(features, "pressure") ?? 0;
  const momentumPct = clamp((momentum + 1) * 50, 0, 100);
  const [homeCode, awayCode] = (cue.payload.eyebrow ?? "HOME vs AWAY").split("·")[0].split(" vs ").map((part) => part.trim());
  return (
    <motion.div className="overlay-variant momentum ov-plate" role="status" aria-live="polite" {...plateIn} transition={{ duration: 0.28, ease: EASE }}>
      <div className="sc-head">
        <motion.span className="l3-eyebrow" {...rise(0.2)}><i className="l3-live" /> Match momentum</motion.span>
        <motion.span className="sc-clock" {...rise(0.25)}>{moment ? formatClock(moment.clock) : "LIVE"}</motion.span>
      </div>
      <div className="mo-title">
        <motion.h2 {...rise(0.3)}>{cue.payload.headline}</motion.h2>
        <motion.b className={momentum >= 0 ? "ice" : "sig"} {...rise(0.4)}>{momentum >= 0 ? homeCode : awayCode} {momentum >= 0 ? "+" : ""}{momentum.toFixed(2)}</motion.b>
      </div>
      <motion.div className="mo-bar" {...rise(0.45)}>
        <span className="home">{homeCode} <b>{Math.round((home / total) * 100)}%</b></span>
        <i>
          <motion.b className="home" initial={{ width: "50%" }} animate={{ width: `${(home / total) * 100}%` }} transition={{ duration: 1.2, ease: EASE, delay: 0.6 }} />
          <motion.b className="away" initial={{ width: "50%" }} animate={{ width: `${(away / total) * 100}%` }} transition={{ duration: 1.2, ease: EASE, delay: 0.6 }} />
        </i>
        <span className="away"><b>{Math.round((away / total) * 100)}%</b> {awayCode}</span>
      </motion.div>
      <div className="mo-meters">
        <motion.div {...rise(0.55)}><span>Chaos</span><b>{chaos.toFixed(2)}</b></motion.div>
        <motion.div className="mo-swing" {...rise(0.6)}>
          <span>Momentum swing</span>
          <i><motion.b initial={{ left: "50%" }} animate={{ left: `${momentumPct}%` }} transition={{ duration: 1.2, ease: EASE, delay: 0.7 }} /></i>
        </motion.div>
        <motion.div {...rise(0.65)}><span>Pressure</span><b>{pressure.toFixed(2)}</b></motion.div>
      </div>
      <span className="ov-shine" aria-hidden="true" />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ speed alert */

function SpeedAlert({ features }: { features?: FeatureSnapshot | null }) {
  const speed = metric(features, "top_speed") ?? 0;
  const pct = clamp(speed / 40, 0, 1);
  const arc = 2 * Math.PI * 120 * 0.75;
  return (
    <motion.div className="overlay-variant speed-alert ov-plate" role="status" aria-live="polite" {...plateIn} transition={{ duration: 0.28, ease: EASE }}>
      <div className="sc-head">
        <motion.span className="l3-eyebrow" {...rise(0.2)}><i className="l3-live" /> Speed alert</motion.span>
        <motion.span {...rise(0.25)}><Tag>Verified peak</Tag></motion.span>
      </div>
      <div className="sp-dial">
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <defs>
            <linearGradient id="sp-grad" x1="0" x2="1">
              <stop offset="0" stopColor="#1E6742" />
              <stop offset="1" stopColor="#58A56B" />
            </linearGradient>
          </defs>
          <circle cx="150" cy="150" r="120" fill="none" stroke="#DCE6D8" strokeWidth="14" strokeDasharray={`${arc} 999`} transform="rotate(135 150 150)" strokeLinecap="round" />
          <motion.circle
            cx="150" cy="150" r="120" fill="none" stroke="url(#sp-grad)" strokeWidth="14" strokeLinecap="round"
            transform="rotate(135 150 150)"
            initial={{ strokeDasharray: `0 999` }}
            animate={{ strokeDasharray: `${arc * pct} 999` }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.1 }}
          />
        </svg>
        <motion.div className="sp-value" {...rise(0.45)}>
          <b>{speed ? speed.toFixed(1) : "—"}</b>
          <span>km/h</span>
        </motion.div>
      </div>
      <motion.h2 {...rise(0.55)}>Fastest sprint this match</motion.h2>
      <motion.p className="sc-sub" {...rise(0.6)}>Peak tracked speed across {features?.event_count ? features.event_count.toLocaleString() : "all"} logged events.</motion.p>
      <div className="l3-foot"><Brandline /></div>
      <span className="ov-shine" aria-hidden="true" />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ pressure map */

function PressureMap({ cue, features, moment, events }: { cue: OverlayCue; features?: FeatureSnapshot | null; moment?: Moment | null; events?: Event[] }) {
  const index = events?.findIndex((event) => event.event_id === moment?.event_id) ?? -1;
  const windowEvents = index >= 0 ? (events ?? []).slice(Math.max(0, index - 30), index + 1) : [];
  const passes = windowEvents.filter((event) => event.end_location).slice(-14);
  const pressures = windowEvents.filter((event) => event.type === "pressure").slice(-24);
  const current = index >= 0 ? events?.[index] : undefined;
  const eventPressure = moment?.metrics.event_pressure?.value ?? metric(features, "pressure") ?? 0;
  return (
    <motion.div className="overlay-variant pressure-map ov-plate" role="status" aria-live="polite" {...plateIn} transition={{ duration: 0.28, ease: EASE }}>
      <div className="sc-head">
        <motion.span className="l3-eyebrow" {...rise(0.2)}><i className="l3-live" /> Pressure map</motion.span>
        <motion.span className="sc-clock" {...rise(0.25)}>{moment ? formatClock(moment.clock) : "LIVE"}</motion.span>
      </div>
      <motion.h2 {...rise(0.3)}>{cue.payload.headline}</motion.h2>
      <motion.svg className="pressure-svg" viewBox="0 0 100 64" role="img" aria-label="Pressure map" {...rise(0.4)}>
        <defs>
          <radialGradient id="pm-heat">
            <stop offset="0" stopColor="#CF6048" stopOpacity="0.6" />
            <stop offset="1" stopColor="#CF6048" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="64" rx="2" fill="#7FAC7B" />
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={i * 10} y="0" width="10" height="64" fill={i % 2 ? "transparent" : "rgba(255,255,255,0.07)"} />)}
        <g stroke="rgba(255,255,255,0.72)" strokeWidth="0.25" fill="none">
          <rect x="2" y="2" width="96" height="60" />
          <line x1="50" y1="2" x2="50" y2="62" />
          <circle cx="50" cy="32" r="8.2" />
          <rect x="2" y="15" width="16" height="34" />
          <rect x="82" y="15" width="16" height="34" />
        </g>
        {pressures.map((event) => (
          <circle key={`p-${event.event_id}`} cx={event.location.x} cy={event.location.y * 0.64} r={3 + event.pressure * 5} fill="url(#pm-heat)" />
        ))}
        {passes.map((event) => (
          <line key={`l-${event.event_id}`} x1={event.location.x} y1={event.location.y * 0.64} x2={event.end_location?.x} y2={(event.end_location?.y ?? 0) * 0.64} stroke="#167C9F" strokeWidth="0.35" opacity="0.65" strokeLinecap="round" />
        ))}
        {current?.end_location && (
          <motion.line
            x1={current.location.x} y1={current.location.y * 0.64} x2={current.end_location.x} y2={current.end_location.y * 0.64}
            stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: EASE, delay: 0.12 }}
          />
        )}
        {current && <circle cx={current.location.x} cy={current.location.y * 0.64} r="1.6" fill="#FFFFFF" />}
      </motion.svg>
      <div className="pm-foot">
        <span><i className="dot sig" /> Pressure</span>
        <span><i className="dot ice" /> Passes</span>
        <span className="pm-val">Event pressure <b>{eventPressure.toFixed(2)}</b></span>
      </div>
      <span className="ov-shine" aria-hidden="true" />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ scorebug */

export type ScorebugInfo = { home: string; away: string; score: { home: number; away: number }; clock: string };

function Scorebug({ info }: { info: ScorebugInfo }) {
  return (
    <motion.div className="ov-scorebug" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: EASE }}>
      <span className="sb-mark"><BrandMark size={26} /></span>
      <span className="sb-team home"><i />{info.home}</span>
      <span className="sb-score">{info.score.home}<em>–</em>{info.score.away}</span>
      <span className="sb-team away">{info.away}<i /></span>
      <span className="sb-clock">{info.clock}</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ public */

export default function OverlayCueView({
  cue,
  guides = false,
  compact = false,
  variant = "lower_third",
  features = null,
  moment = null,
  events = [],
  scorebug,
  homeTeam,
  awayTeam,
}: {
  cue: OverlayCue | null;
  guides?: boolean;
  compact?: boolean;
  variant?: OverlayVariant;
  features?: FeatureSnapshot | null;
  moment?: Moment | null;
  events?: Event[];
  scorebug?: ScorebugInfo | null;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
}) {
  const publicCue = useMemo(() => {
    if (!cue) return null;
    const labels = momentPlayerLabels(events, moment, `${cue.payload.headline ?? ""} ${cue.payload.subline ?? ""}`);
    const teams = [homeTeam, awayTeam].filter((team): team is Team => Boolean(team));
    const readable = (text: string) => displayPlayerIds(text, labels, teams);
    const anchor = events.find((event) => event.event_id === moment?.event_id);
    const shortLineBreak = variant === "lower_third" && moment?.type === "line_break"
      && /press/i.test(cue.payload.headline ?? "") && anchor?.player_id && anchor.recipient_id;
    return {
      ...cue,
      payload: {
        ...cue.payload,
        eyebrow: readable(cue.payload.eyebrow ?? ""),
        headline: shortLineBreak
          ? `${displayPlayer(anchor.player_id, labels)} beats the press → ${displayPlayer(anchor.recipient_id, labels)}`
          : readable(cue.payload.headline ?? ""),
        subline: readable(cue.payload.subline ?? ""),
      },
    };
  }, [cue, events, moment, variant, homeTeam, awayTeam]);

  return (
    <BroadcastCanvas className={compact ? "compact" : ""}>
      {guides && (
        <div className="overlay-safe" aria-hidden="true">
          <i className="action" />
          <i className="title" />
        </div>
      )}
      {scorebug && <Scorebug info={scorebug} />}
      <AnimatePresence mode="wait">
        {!publicCue ? (
          <motion.div key="waiting" className="overlay-waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            <BrandMark size={24} /> <span>MatchMind</span> <i className="l3-live" /> Waiting for a verified insight
          </motion.div>
        ) : (
          <div key={`${variant}-${publicCue.cue_id}`} className={`ov-slot slot-${variant}`}>
            {variant === "stat_card" && <StatCard cue={publicCue} features={features} moment={moment} />}
            {variant === "momentum" && <Momentum cue={publicCue} features={features} moment={moment} />}
            {variant === "speed_alert" && <SpeedAlert features={features} />}
            {variant === "pressure_map" && <PressureMap cue={publicCue} features={features} moment={moment} events={events} />}
            {variant === "lower_third" && <LowerThird cue={publicCue} moment={moment} />}
          </div>
        )}
      </AnimatePresence>
    </BroadcastCanvas>
  );
}
