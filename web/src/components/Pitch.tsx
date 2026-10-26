import { useId, useMemo } from "react";
import type { Event, Team } from "../types";

const ICE = "#5CC8FF";
const SIGNAL = "#FF4D2E";
const FLOOD = "#FFE3B3";

function colorFor(event: Event, home: Team, away: Team): string {
  if (event.team_id === home.team_id) return ICE;
  if (event.team_id === away.team_id) return SIGNAL;
  return FLOOD;
}

/** Static night-pitch rendering: the no-WebGL / reduced-motion fallback for the 3D scene. */
export default function Pitch({
  events,
  cursor,
  home,
  away,
}: {
  events: Event[];
  cursor: number;
  home: Team;
  away: Team;
}) {
  const uid = useId().replace(/:/g, "");
  const trail = useMemo(() => events.slice(Math.max(0, cursor - 9), cursor + 1), [events, cursor]);
  const current = events[cursor];
  const pressure = useMemo(
    () => events.slice(Math.max(0, cursor - 14), cursor + 1).filter((event) => event.type === "pressure" || event.pressure > 0.6),
    [events, cursor],
  );
  const Y = (y: number) => y * 0.64;

  return (
    <svg className="pitch-svg" viewBox="0 0 100 64" role="img" aria-label="Match pitch" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={`flood-${uid}`} cx="0.5" cy="0.15" r="0.9">
          <stop offset="0" stopColor="#1d2b2c" />
          <stop offset="0.6" stopColor="#0d1718" />
          <stop offset="1" stopColor="#070b0e" />
        </radialGradient>
        <radialGradient id={`heat-${uid}`}>
          <stop offset="0" stopColor={SIGNAL} stopOpacity="0.55" />
          <stop offset="1" stopColor={SIGNAL} stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="100" height="64" rx="1.5" fill={`url(#flood-${uid})`} />
      {Array.from({ length: 12 }).map((_, index) => (
        <rect key={index} x={2 + index * 8} y="2" width="8" height="60" fill={index % 2 === 0 ? "rgba(255,255,255,0.022)" : "transparent"} />
      ))}

      <g stroke="rgba(235,240,245,0.32)" strokeWidth="0.22" fill="none">
        <rect x="2" y="2" width="96" height="60" />
        <line x1="50" y1="2" x2="50" y2="62" />
        <circle cx="50" cy="32" r="8.2" />
        <rect x="2" y="15" width="16" height="34" />
        <rect x="82" y="15" width="16" height="34" />
        <rect x="2" y="23" width="6" height="18" />
        <rect x="92" y="23" width="6" height="18" />
      </g>
      <circle cx="50" cy="32" r="0.6" fill="rgba(235,240,245,0.5)" />

      {pressure.map((event) => (
        <circle key={`h-${event.event_id}`} cx={event.location.x} cy={Y(event.location.y)} r={3 + event.pressure * 5} fill={`url(#heat-${uid})`} />
      ))}

      {trail.map((event, index) => {
        const isCurrent = event.event_id === current?.event_id;
        const color = colorFor(event, home, away);
        const x1 = event.location.x;
        const y1 = Y(event.location.y);
        const opacity = isCurrent ? 1 : 0.18 + index * 0.06;
        if (!event.end_location) {
          return <circle key={event.event_id} cx={x1} cy={y1} r={isCurrent ? 1.2 : 0.55} fill={color} opacity={opacity} />;
        }
        const x2 = event.end_location.x;
        const y2 = Y(event.end_location.y);
        const mx = (x1 + x2) / 2;
        const my = Math.min(y1, y2) - Math.hypot(x2 - x1, y2 - y1) * 0.18;
        return (
          <g key={event.event_id} opacity={opacity} filter={isCurrent ? `url(#glow-${uid})` : undefined}>
            <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={isCurrent ? 0.7 : 0.28} strokeLinecap="round" />
            <circle cx={x1} cy={y1} r={isCurrent ? 0.9 : 0.4} fill={color} />
            {isCurrent && <circle cx={x2} cy={y2} r="1.4" fill="none" stroke={FLOOD} strokeWidth="0.3" />}
          </g>
        );
      })}

      {current && (
        <g>
          <circle cx={current.location.x} cy={Y(current.location.y)} r={4 + current.pressure * 7} fill="none" stroke={SIGNAL} strokeWidth="0.25" opacity={0.25 + current.pressure * 0.4} />
          <circle cx={current.location.x} cy={Y(current.location.y)} r="1.3" fill="#FFF3DF" filter={`url(#glow-${uid})`} />
          <text x={current.location.x + 2.4} y={Y(current.location.y) - 2} fill="#F5F3EE" fontSize="1.8" fontFamily="JetBrains Mono Variable, monospace" opacity="0.85">
            {current.player_id ?? current.type}
          </text>
        </g>
      )}

      <text x="4" y="60.4" fill="#646A7D" fontSize="1.5" fontFamily="JetBrains Mono Variable, monospace">
        {home.short_name} →
      </text>
      <text x="96" y="60.4" fill="#646A7D" fontSize="1.5" fontFamily="JetBrains Mono Variable, monospace" textAnchor="end">
        ← {away.short_name}
      </text>
    </svg>
  );
}
