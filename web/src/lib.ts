import type { Clock, Team } from "./types";

export function formatClock(clock: Clock): string {
  return `${clock.minute}'${clock.second.toString().padStart(2, "0")}`;
}

export function formatMinute(clock: Clock): string {
  return `${clock.minute}'`;
}

export function teamCode(team: Team): string {
  return team.short_name.toUpperCase();
}

export function eventLabel(type: string, playerId?: string | null): string {
  const label = type.replace(/_/g, " ");
  if (!playerId) return label;
  return `${label} / ${playerId}`;
}

export function metricNumber(value: number, digits = 2): string {
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(digits);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function shortId(id: string): string {
  return id.replace(/^e-/, "");
}
