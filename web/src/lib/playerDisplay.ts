import type { Event, Moment, Team } from "../types";

/** Stable, match-wide display aliases. Raw IDs stay in the event/evidence data. */
export function momentPlayerLabels(events: Event[], _moment: Moment | null, narrative = ""): Record<string, string> {
  const eventIds = new Set<string>();
  for (const event of events) {
    for (const id of [event.player_id, event.recipient_id, event.assist_id]) {
      if (id) eventIds.add(id);
    }
  }

  const narrativeIds = new Set(narrative.match(/\b[A-Z]{2,5}-\d{2}\b/g) ?? []);
  const ids = [
    ...[...eventIds].sort(),
    ...[...narrativeIds].filter((id) => !eventIds.has(id)).sort(),
  ];
  return Object.fromEntries(ids.map((id, index) => [id, `p${index + 1}`]));
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
