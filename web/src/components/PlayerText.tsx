import type { Team } from "../types";
import { displayPlayerIds } from "../lib/playerDisplay";

/** Color only the display aliases; evidence IDs and source text stay untouched. */
export default function PlayerText({
  text,
  labels,
  home,
  away,
}: {
  text: string;
  labels: Record<string, string>;
  home?: Team | null;
  away?: Team | null;
}) {
  const teams = [home, away].filter((team): team is Team => Boolean(team));
  const readable = displayPlayerIds(text, labels, teams);
  const aliasTeams = new Map(Object.entries(labels).map(([id, alias]) => [
    alias,
    id.startsWith(`${home?.team_id}-`) ? "home" : id.startsWith(`${away?.team_id}-`) ? "away" : "",
  ]));

  return <>{readable.split(/(\bp\d+\b)/g).map((part, index) => {
    const team = aliasTeams.get(part);
    return team ? <span className={`player-token ${team}`} key={index}>{part}</span> : part;
  })}</>;
}
