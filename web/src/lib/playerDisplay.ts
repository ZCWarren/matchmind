import type { Event, Moment, Team } from "../types";

/** Stable, moment-local display names. Raw IDs stay in the event/evidence data. */
export function momentPlayerLabels(events: Event[], moment: Moment | null, narrative = ""): Record<string, string> {
  const labels: Record<string, string> = {};
  const add = (id: string | null | undefined) => {
    if (id && !labels[id]) labels[id] = `Player ${Object.keys(labels).length + 1}`;
  };

  const anchor = events.find((event) => event.event_id === moment?.event_id);
  add(anchor?.player_id);
  add(anchor?.recipient_id);

  for (const id of narrative.match(/\b[A-Z]{2,5}-\d{2}\b/g) ?? []) add(id);

  const momentEvents = new Set(moment?.event_ids ?? []);
  for (const event of events) {
    if (!momentEvents.has(event.event_id)) continue;
    add(event.player_id);
    add(event.recipient_id);
    add(event.assist_id);
  }
  for (const event of events) {
    add(event.player_id);
    add(event.recipient_id);
    add(event.assist_id);
  }
  return labels;
}

export function displayPlayer(id: string | null | undefined, labels: Record<string, string>): string {
  return id ? labels[id] ?? id : "—";
}

export function displayPlayerIds(text: string, labels: Record<string, string>, teams: Team[] = []): string {
  let result = text.replace(/\b[A-Z]{2,5}-\d{2}\b/g, (id) => labels[id] ?? id);
  for (const team of teams) {
    result = result.replace(new RegExp(`\\b${team.team_id}\\b`, "g"), team.name);
  }
  return result.replace(/\b[a-z]+(?:_[a-z]+)+\b/g, (word) => word.replaceAll("_", " "));
}
