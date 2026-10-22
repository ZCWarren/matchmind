import { useMemo } from "react";
import type { Event, Team } from "../types";

function colorFor(event: Event, home: Team, away: Team): string {
  if (event.team_id === home.team_id) return home.color;
  if (event.team_id === away.team_id) return away.color;
  return "#c8ff3d";
}

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
  const trail = useMemo(
    () => events.slice(Math.max(0, cursor - 9), cursor + 1),
    [events, cursor],
  );
  const current = events[cursor];
  const markerFor = (event: Event) => {
    if (event.team_id === home.team_id) return "url(#arrow-home)";
    if (event.team_id === away.team_id) return "url(#arrow-away)";
    return "url(#arrow-lime)";
  };

  return (
    <svg className="pitch-svg" viewBox="0 0 100 64" role="img" aria-label="Match pitch">
      <defs>
        <marker id="arrow-home" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={home.color} />
        </marker>
        <marker id="arrow-away" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={away.color} />
        </marker>
        <marker id="arrow-lime" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#c8ff3d" />
        </marker>
      </defs>

      <rect x="0" y="0" width="100" height="64" fill="#071712" />
      {Array.from({ length: 10 }).map((_, index) => (
        <rect
          key={index}
          x={index * 10}
          y="0"
          width="10"
          height="64"
          fill={index % 2 === 0 ? "rgba(255,255,255,0.018)" : "transparent"}
        />
      ))}

      <g stroke="#2b5b4b" strokeWidth="0.22" fill="none">
        <rect x="2" y="2" width="96" height="60" />
        <line x1="50" y1="2" x2="50" y2="62" />
        <circle cx="50" cy="32" r="8.2" />
        <circle cx="50" cy="32" r="0.7" fill="#2b5b4b" />
        <rect x="2" y="15" width="16" height="34" />
        <rect x="82" y="15" width="16" height="34" />
        <rect x="2" y="23" width="6" height="18" />
        <rect x="92" y="23" width="6" height="18" />
        <rect x="0.4" y="27" width="1.6" height="10" />
        <rect x="98" y="27" width="1.6" height="10" />
      </g>

      <g stroke="#2b5b4b" strokeWidth="0.18" strokeDasharray="0.8 0.8" opacity="0.65">
        <path d="M2 8 L18 8 L18 56 L2 56" />
        <path d="M98 8 L82 8 L82 56 L98 56" />
      </g>

      {trail.map((event, index) => {
        const isCurrent = event.event_id === current?.event_id;
        const color = colorFor(event, home, away);
        const x1 = event.location.x;
        const y1 = event.location.y * 0.64;
        const opacity = isCurrent ? 0.95 : 0.12 + index * 0.025;
        if (!event.end_location) {
          return (
            <circle
              key={event.event_id}
              cx={x1}
              cy={y1}
              r={isCurrent ? 1.3 : 0.55}
              fill={color}
              opacity={opacity}
            />
          );
        }
        const x2 = event.end_location.x;
        const y2 = event.end_location.y * 0.64;
        return (
          <g key={event.event_id} opacity={opacity}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={isCurrent ? 0.65 : 0.3}
              markerEnd={markerFor(event)}
            />
            <circle cx={x1} cy={y1} r={isCurrent ? 0.9 : 0.4} fill={color} />
            {isCurrent && <circle cx={x2} cy={y2} r="1.1" fill="none" stroke={color} strokeWidth="0.3" />}
          </g>
        );
      })}

      {current && (
        <g>
          <circle
            cx={current.location.x}
            cy={current.location.y * 0.64}
            r={5 + current.pressure * 9}
            fill="none"
            stroke={current.pressure > 0.65 ? "#ff625f" : "#c8ff3d"}
            strokeWidth="0.22"
            opacity={0.18 + current.pressure * 0.25}
            strokeDasharray="1.2 1.2"
          />
          <circle
            cx={current.location.x}
            cy={current.location.y * 0.64}
            r="1.45"
            fill="#f2ffd0"
            stroke={colorFor(current, home, away)}
            strokeWidth="0.35"
          />
          <text
            x={current.location.x + 2.4}
            y={current.location.y * 0.64 - 1.8}
            fill="#e8eef8"
            fontSize="1.7"
            fontFamily="IBM Plex Mono, monospace"
            opacity="0.82"
          >
            {current.player_id ?? current.type}
          </text>
        </g>
      )}

      <text x="4.2" y="61" fill="#5d6b81" fontSize="1.55" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12">
        {home.short_name.toUpperCase()} ATTACKS →
      </text>
      <text x="80.5" y="61" fill="#5d6b81" fontSize="1.55" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12">
        ← {away.short_name.toUpperCase()}
      </text>
    </svg>
  );
}
