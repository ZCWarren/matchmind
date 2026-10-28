import { useMemo } from "react";
import * as THREE from "three";
import { C } from "../theme";
import { PLAYERS, playerAt, type Player } from "../lib/moment";

const createPieceGeometry = () => {
  const profile: [number, number][] = [
    [0, 0.02],
    [0.28, 0.02],
    [0.345, 0.035],
    [0.375, 0.07],
    [0.38, 0.105],
    [0.37, 0.145],
    [0.34, 0.175],
    [0.315, 0.2],
    [0.305, 0.235],
    [0.275, 0.27],
    [0.235, 0.315],
    [0.2, 0.39],
    [0.172, 0.5],
    [0.155, 0.64],
    [0.152, 0.79],
    [0.165, 0.94],
    [0.195, 1.08],
    [0.24, 1.2],
    [0.285, 1.285],
    [0.305, 1.335],
    [0.3, 1.375],
    [0.275, 1.405],
    [0.225, 1.435],
    [0.17, 1.475],
    [0.125, 1.525],
    [0.105, 1.58],
    [0.112, 1.635],
    [0.14, 1.69],
    [0.158, 1.75],
    [0.155, 1.81],
    [0.135, 1.865],
    [0.098, 1.915],
    [0.052, 1.95],
    [0, 1.965],
  ];
  const geometry = new THREE.LatheGeometry(
    profile.map(([radius, y]) => new THREE.Vector2(radius, y)),
    48,
  );
  const positions = geometry.getAttribute("position");
  const tones = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const baseTone = y < 0.25 ? 0.78 : y < 0.34 ? 0.78 + ((y - 0.25) / 0.09) * 0.22 : 1;
    const tone = y > 1.39 && y < 1.45 ? 0.86 : baseTone;
    tones[i * 3] = tone;
    tones[i * 3 + 1] = tone;
    tones[i * 3 + 2] = tone;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(tones, 3));
  return geometry;
};

const teamColor = (team: Player["team"]) => (team === "home" ? C.ice : C.signal);

export type PlayerLook = {
  dim?: number;
  highlight?: string[];
  fadeOthers?: number;
};

export const Players = ({ t, look = {} }: { t: number; look?: PlayerLook }) => {
  const geo = useMemo(
    () => ({
      piece: createPieceGeometry(),
      ring: new THREE.RingGeometry(0.54, 0.59, 40),
    }),
    [],
  );
  const mats = useMemo(() => {
    const make = (team: Player["team"]) => ({
      piece: new THREE.MeshStandardMaterial({
        color: teamColor(team),
        roughness: 0.66,
        metalness: 0.04,
        envMapIntensity: 0.45,
        vertexColors: true,
      }),
      ring: new THREE.MeshBasicMaterial({
        color: teamColor(team),
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    });
    return { home: make("home"), away: make("away") };
  }, []);

  const { dim = 1, highlight = [], fadeOthers = 0 } = look;

  return (
    <group>
      {PLAYERS.map((p, index) => {
        const s = playerAt(p, t);
        const hi = highlight.includes(p.id);
        const vis = dim * (hi ? 1 : 1 - fadeOthers * 0.75);
        const m = mats[p.team];
        const lean = Math.min(0.16, s.speed * 0.016);
        const phase = t * (4.2 + s.speed * 0.35) + index * 1.71;
        const sway = Math.sin(phase) * Math.min(0.025, s.speed * 0.003);
        const lift = Math.abs(Math.sin(phase)) * Math.min(0.035, s.speed * 0.004);
        return (
          <group key={p.id} position={[s.x, 0, s.z]} rotation-y={s.heading} visible={vis > 0.02}>
            <mesh geometry={geo.ring} material={m.ring} rotation-x={-Math.PI / 2} position-y={0.025} scale={(hi ? 1.45 : 1) * (0.5 + 0.5 * vis)} />
            <group rotation-x={lean} rotation-z={sway} position-y={lift}>
              <mesh geometry={geo.piece} material={m.piece} castShadow />
            </group>
          </group>
        );
      })}
    </group>
  );
};
