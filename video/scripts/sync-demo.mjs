import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const matchId = "ast-2026-1018-nhr-orn";
const eventPage = JSON.parse(fs.readFileSync(path.join(root, `web/public/demo/${matchId}/events.json`), "utf8"));
const insight = JSON.parse(fs.readFileSync(path.join(root, `web/public/demo/${matchId}/insight.json`), "utf8"));
const blackboard = JSON.parse(fs.readFileSync(path.join(root, `web/public/demo/${matchId}/blackboard.json`), "utf8"));
const heroIndex = eventPage.events.findIndex((event) => event.event_id === "e-000974");
if (heroIndex < 0) throw new Error("Hero event e-000974 is missing");
const payload = {
  matchId,
  eventCount: eventPage.total,
  heroIndex,
  events: eventPage.events.slice(Math.max(0, heroIndex - 10), heroIndex + 2),
  insight,
  blackboard,
};
fs.mkdirSync(path.join(root, "video/src/generated"), { recursive: true });
fs.writeFileSync(path.join(root, "video/src/generated/hero.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Synced ${payload.events.length} real events, ${insight.trace.length} trace steps, and ${blackboard.story_arc.length} story arc chapters`);
