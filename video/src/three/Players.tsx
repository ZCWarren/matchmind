import { useMemo } from "react";
import * as THREE from "three";
import { C } from "../theme";
import { PLAYERS, playerAt, type Player } from "../lib/moment";
import { makeGlowMaterial } from "./shaders";

/** Chess-piece silhouette, ~1.9 m tall. */
const bodyProfile = () => {
  const pts: [number, number][] = [
    [0.3, 0.0],
    [0.36, 0.0],
    [0.4, 0.05],
    [0.36, 0.12],
    [0.22, 0.22],
    [0.17, 0.55],
    [0.2, 0.9],
    [0.27, 1.18],
    [0.33, 1.36],
    [0.31, 1.44],
    [0.16, 1.5],
    [0.09, 1.56],
  ];
  return new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    40,
  );
};

const teamColor = (team: Player["team"]) => (team === "home" ? C.ice : C.signal);

export type PlayerLook = {
  dim?: number; // 0..1 overall visibility
  highlight?: string[]; // ids to emphasise
  fadeOthers?: number; // 0..1 how much non-highlighted players dim
};

export const Players = ({ t, look = {} }: { t: number; look?: PlayerLook }) => {
  const geo = useMemo(() => {
    const body = bodyProfile();
    const head = new THREE.SphereGeometry(0.16, 24, 16);
    const band = new THREE.TorusGeometry(0.29, 0.035, 8, 40);
    const ring = new THREE.RingGeometry(0.62, 0.74, 48);
    const disc = new THREE.PlaneGeometry(3.4, 3.4);
    return { body, head, band, ring, disc };
  }, []);
  const mats = useMemo(() => {
    const make = (team: Player["team"]) => ({
      body: new THREE.MeshPhysicalMaterial({
        color: teamColor(team),
        roughness: 0.65,
        metalness: 0,
        clearcoat: 0.1,
        envMapIntensity: 0.5,
      }),
      band: new THREE.MeshBasicMaterial({ color: "#FFFFFF" }),
      ring: new THREE.MeshBasicMaterial({
        color: teamColor(team),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
      glow: makeGlowMaterial(teamColor(team), 0.12, 2.4),
    });
    return { home: make("home"), away: make("away") };
  }, []);

  const { dim = 1, highlight = [], fadeOthers = 0 } = look;

  return (
    <group>
      {PLAYERS.map((p) => {
        const s = playerAt(p, t);
        const hi = highlight.includes(p.id);
        const vis = dim * (hi ? 1 : 1 - fadeOthers * 0.75);
        const m = mats[p.team];
        // per-player material instances are shared; vary via scale/opacity where possible
        const ringScale = hi ? 1.25 : 1;
        const lean = Math.min(0.22, s.speed * 0.02);
        return (
          <group key={p.id} position={[s.x, 0, s.z]} rotation-y={s.heading} visible={vis > 0.02}>
            <group rotation-x={lean}>
              <mesh geometry={geo.body} material={m.body} castShadow scale={[1, 1.12, 1]} />
              <mesh geometry={geo.head} material={m.body} position-y={1.9} castShadow />
              <mesh geometry={geo.band} material={m.band} position-y={1.38} rotation-x={Math.PI / 2} scale={vis} />
            </group>
            <mesh geometry={geo.ring} material={m.ring} rotation-x={-Math.PI / 2} position-y={0.03} scale={ringScale * (0.4 + 0.6 * vis)} />
            <mesh
              geometry={geo.disc}
              material={m.glow}
              rotation-x={-Math.PI / 2}
              position-y={0.04}
              scale={(hi ? 1.5 : 1) * vis}
            />
          </group>
        );
      })}
    </group>
  );
};
