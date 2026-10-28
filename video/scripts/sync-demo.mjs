import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const matchId = "ast-2026-1018-nhr-orn";
const eventPage = JSON.parse(fs.readFileSync(path.join(root, `web/public/demo/${matchId}/events.json`), "utf8"));
const insight = JSON.parse(fs.readFileSync(path.join(root, `web/public/demo/${matchId}/insight.json`), "utf8"));
const blackboard = JSON.parse(fs.readFileSync(path.join(root, `web/public/demo/${matchId}/blackboard.json`), "utf8"));
const heroIndex = eventPage.events.findIndex((event) => event.event_id === "e-000974");
if (heroIndex < 0) throw new Error("Hero event e-000974 is missing");
const playerIds = [...new Set(eventPage.events.flatMap((event) => [
  event.player_id,
  event.recipient_id,
  event.assist_id,
]).filter(Boolean))].sort();
const playerLabels = Object.fromEntries(playerIds.map((id, index) => [id, `p${index + 1}`]));
const payload = {
  matchId,
  eventCount: eventPage.total,
  playerLabels,
  heroIndex,
  events: eventPage.events.slice(Math.max(0, heroIndex - 10), heroIndex + 2),
  insight,
  blackboard,
  finalScore: eventPage.events.at(-1).score,
  // Compact map of every event: [x, y, typeCode, team (0 home / 1 away), match minute]
  types: [...new Set(eventPage.events.map((event) => event.type))],
  allEvents: [],
};
payload.allEvents = eventPage.events.map((event) => [
  event.location?.x ?? 50,
  event.location?.y ?? 50,
  payload.types.indexOf(event.type),
  event.team_id === "NHR" ? 0 : 1,
  event.clock.minute,
]);
fs.mkdirSync(path.join(root, "video/src/generated"), { recursive: true });
fs.writeFileSync(path.join(root, "video/src/generated/hero.json"), `${JSON.stringify(payload)}\n`);
console.log(`Synced ${payload.events.length} real events, ${insight.trace.length} trace steps, and ${blackboard.story_arc.length} story arc chapters`);
