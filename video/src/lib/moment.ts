/**
 * The 72'12 hero sequence as a pure function of moment-time `t` (seconds after 72:10).
 * Event coordinates for the trap, the pass and the sprint come from hero.json; the
 * surrounding shape of both teams is authored to read clearly on camera.
 */
import * as THREE from "three";
import { heroEvent, sprintEvent, toWorld, trapEvent } from "./data";
import { clamp01, smooth } from "./motion";

export type Team = "home" | "away";
type Key = [t: number, x: number, y: number];
export type Player = { id: string; team: Team; keys: Key[]; hero?: boolean };

export const T_TRAP = 0; // 72:10 ORN-06 press trap
export const T_PASS = 2; // 72:12 NHR-08 strikes
export const T_RECEIVE = 2.95;
export const T_SPRINT_END = 5.4;

const P = heroEvent.location; // 38,52
const E = heroEvent.end_location!; // 62,44
const S = sprintEvent.end_location!; // 74,48
const TR = trapEvent.location; // 42,52

export const PLAYERS: Player[] = [
  // Nova Harbor — ice, attacking +x
  { id: "NHR-01", team: "home", keys: [[-2, 6, 50], [6, 9, 50]] },
  { id: "NHR-02", team: "home", keys: [[-2, 26, 18], [6, 34, 20]] },
  { id: "NHR-03", team: "home", keys: [[-2, 24, 40], [6, 31, 41]] },
  { id: "NHR-04", team: "home", keys: [[-2, 25, 61], [6, 32, 60]] },
  { id: "NHR-05", team: "home", keys: [[-2, 29, 84], [6, 38, 82]] },
  { id: "NHR-06", team: "home", keys: [[-2, 33, 33], [6, 42, 34]] },
  { id: "NHR-08", team: "home", hero: true, keys: [[-2, P.x - 3, P.y + 3], [T_PASS, P.x, P.y], [6, P.x + 6, P.y - 2]] },
  { id: "NHR-10", team: "home", keys: [[-2, 49, 73], [6, 58, 70]] },
  { id: "NHR-07", team: "home", keys: [[-2, 54, 22], [6, 64, 24]] },
  { id: "NHR-09", team: "home", keys: [[-2, 67, 60], [T_PASS, 68, 58], [6, 77, 56]] },
  {
    id: "NHR-14",
    team: "home",
    hero: true,
    keys: [[-2, 51, 34], [T_PASS, 54.5, 38], [T_RECEIVE, E.x, E.y], [T_SPRINT_END, S.x, S.y], [8, S.x + 3, S.y + 1]],
  },
  // Orion North — signal, defending the +x goal, midfield line ≈ x 47–50
  { id: "ORN-01", team: "away", keys: [[-2, 95, 50], [6, 93, 49]] },
  { id: "ORN-02", team: "away", keys: [[-2, 73, 21], [6, 75, 25]] },
  { id: "ORN-03", team: "away", keys: [[-2, 71, 40], [6, 75, 44]] },
  { id: "ORN-04", team: "away", keys: [[-2, 72, 59], [6, 76, 54]] },
  { id: "ORN-05", team: "away", keys: [[-2, 74, 77], [6, 77, 70]] },
  { id: "ORN-07", team: "away", keys: [[-2, 49, 38], [T_PASS, 45, 46], [6, 52, 44]] },
  { id: "ORN-08", team: "away", keys: [[-2, 50, 64], [T_PASS, 46, 58], [6, 54, 54]] },
  { id: "ORN-11", team: "away", keys: [[-2, 51, 24], [6, 55, 30]] },
  { id: "ORN-06", team: "away", hero: true, keys: [[-2, TR.x + 6, TR.y - 2], [T_TRAP, TR.x, TR.y], [T_PASS, P.x + 2.4, P.y], [6, P.x + 6, P.y + 1]] },
  { id: "ORN-10", team: "away", keys: [[-2, 33, 62], [T_PASS, 36, 56], [6, 40, 56]] },
  { id: "ORN-09", team: "away", keys: [[-2, 31, 42], [T_PASS, 35, 48], [6, 38, 48]] },
];

export const PRESSERS = ["ORN-06", "ORN-07", "ORN-10", "ORN-09"];
/** ORN's midfield line the pass breaks (provider x). */
export const LINE_X = 47.5;

const sample = (keys: Key[], t: number): [number, number] => {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const k = smooth(clamp01((t - a[0]) / (b[0] - a[0])));
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
  }
  const last = keys[keys.length - 1];
  return [last[1], last[2]];
};

export const playerAt = (p: Player, t: number) => {
  const [x, y] = sample(p.keys, t);
  const [wx, wz] = toWorld(x, y);
  // heading from velocity
  const [x2, y2] = sample(p.keys, t + 0.1);
  const [vx, vz] = toWorld(x2, y2);
  const dx = vx - wx;
  const dz = vz - wz;
  const speed = Math.hypot(dx, dz) * 10;
  return { x: wx, z: wz, heading: speed > 0.05 ? Math.atan2(dx, dz) : p.team === "home" ? Math.PI / 2 : -Math.PI / 2, speed };
};

export const playerById = (id: string) => PLAYERS.find((p) => p.id === id)!;

const [sx, sz] = toWorld(P.x, P.y);
const [ex, ez] = toWorld(E.x, E.y);
export const PASS_START = new THREE.Vector3(sx, 0.25, sz);
export const PASS_END = new THREE.Vector3(ex, 0.25, ez);
export const PASS_CURVE = new THREE.QuadraticBezierCurve3(
  PASS_START,
  PASS_START.clone().lerp(PASS_END, 0.5).add(new THREE.Vector3(0, 2.6, 0)),
  PASS_END,
);

/** Pass progress 0..1 (eased like a ball losing a little speed). */
export const passProgress = (t: number) => {
  const k = clamp01((t - T_PASS) / (T_RECEIVE - T_PASS));
  return 1 - Math.pow(1 - k, 1.35);
};

export const ballAt = (t: number) => {
  if (t < T_PASS) {
    const p = playerAt(playerById("NHR-08"), t);
    return new THREE.Vector3(p.x + 0.55, 0.25, p.z);
  }
  if (t <= T_RECEIVE) return PASS_CURVE.getPoint(passProgress(t));
  const p = playerAt(playerById("NHR-14"), t);
  return new THREE.Vector3(p.x + Math.sin(p.heading) * 0.8, 0.25, p.z + Math.cos(p.heading) * 0.8);
};

/** Point where the pass crosses ORN's midfield line (0..1 along the curve). */
export const LINE_CROSS = (() => {
  const [lx] = toWorld(LINE_X, 50);
  return clamp01((lx - PASS_START.x) / (PASS_END.x - PASS_START.x));
})();
