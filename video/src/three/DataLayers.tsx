import { useMemo } from "react";
import * as THREE from "three";
import { C } from "../theme";
import { hero, toWorld } from "../lib/data";
import { clamp01, rng, smooth } from "../lib/motion";
import {
  LINE_X,
  PASS_CURVE,
  PRESSERS,
  T_RECEIVE,
  T_SPRINT_END,
  ballAt,
  passProgress,
  playerAt,
  playerById,
} from "../lib/moment";
import {
  makeCurtainMaterial,
  makeGlowMaterial,
  makePointsMaterial,
  makeRibbonMaterial,
  makeRingMaterial,
} from "./shaders";

/* -------------------------------------------------------------- ball */

let glowTex: THREE.Texture | null = null;
export const glowSprite = (color: string) => {
  if (!glowTex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c);
  }
  return new THREE.SpriteMaterial({
    map: glowTex,
    color,
    blending: THREE.NormalBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.2,
  });
};

export const Ball = ({ t, frame, opacity = 1 }: { t: number; frame: number; opacity?: number }) => {
  const glow = useMemo(() => glowSprite(C.flood), []);
  const trail = useMemo(() => makeRibbonMaterial(C.flood, "#ffffff"), []);
  const trailGeo = useMemo(() => new THREE.TubeGeometry(PASS_CURVE, 120, 0.09, 8, false), []);
  const pos = ballAt(t);
  const p = passProgress(t);
  glow.opacity = 0.2 * opacity;
  trail.uniforms.uProgress.value = p;
  trail.uniforms.uTail.value = 0.28;
  trail.uniforms.uDash.value = 0;
  trail.uniforms.uTime.value = frame;
  trail.uniforms.uOpacity.value = opacity * (p > 0 && t < T_RECEIVE + 0.6 ? 1 - clamp01((t - T_RECEIVE) / 0.6) : 0);
  return (
    <group>
      <mesh position={pos} castShadow>
        <sphereGeometry args={[0.24, 32, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      <sprite position={pos} scale={[2.6, 2.6, 2.6]} material={glow} />
      <mesh geometry={trailGeo} material={trail} />
    </group>
  );
};

/* ---------------------------------------------------- pass light ribbon */

export const PassRibbon = ({ reveal, frame, opacity = 1 }: { reveal: number; frame: number; opacity?: number }) => {
  const mat = useMemo(() => makeRibbonMaterial(C.ice, "#e9f8ff"), []);
  const groundMat = useMemo(() => makeRibbonMaterial(C.ice, C.ice), []);
  const geo = useMemo(() => new THREE.TubeGeometry(PASS_CURVE, 200, 0.13, 20, false), []);
  const ground = useMemo(() => {
    const pts = Array.from({ length: 60 }, (_, i) => {
      const v = PASS_CURVE.getPoint(i / 59);
      return new THREE.Vector3(v.x, 0.05, v.z);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.07, 4, false);
  }, []);
  mat.uniforms.uProgress.value = reveal;
  mat.uniforms.uTail.value = 1.4;
  mat.uniforms.uTime.value = frame;
  mat.uniforms.uOpacity.value = opacity;
  groundMat.uniforms.uProgress.value = reveal;
  groundMat.uniforms.uTail.value = 2;
  groundMat.uniforms.uTime.value = frame;
  groundMat.uniforms.uOpacity.value = opacity * 0.45;
  if (opacity <= 0.001 || reveal <= 0) return null;
  return (
    <group>
      <mesh geometry={geo} material={mat} />
      <mesh geometry={ground} material={groundMat} />
    </group>
  );
};

/* ------------------------------------------------------ pressure field */

export const PressureField = ({
  t,
  frame,
  amount,
  target = "NHR-08",
}: {
  t: number;
  frame: number;
  amount: number;
  target?: string;
}) => {
  const rings = useMemo(() => [0, 1, 2, 3].map(() => makeRingMaterial(C.signal)), []);
  const heat = useMemo(() => makeGlowMaterial(C.signal, 0.6, 1.5), []);
  const core = useMemo(() => makeGlowMaterial(C.signal2, 0.6, 3), []);
  const vecMat = useMemo(() => makeRibbonMaterial(C.signal, C.flood), []);
  const p = playerAt(playerById(target), t);
  const vectors = PRESSERS.map((id) => {
    const q = playerAt(playerById(id), t);
    const a = new THREE.Vector3(q.x, 0.06, q.z);
    const b = new THREE.Vector3(p.x, 0.06, p.z);
    const len = a.distanceTo(b);
    const dirB = a.clone().lerp(b, Math.max(0, (len - 1.1) / len));
    return { a, b: dirB, len };
  });
  if (amount <= 0.001) return null;
  heat.uniforms.uOpacity.value = 0.55 * amount;
  core.uniforms.uOpacity.value = 0.5 * amount;
  vecMat.uniforms.uProgress.value = 1;
  vecMat.uniforms.uTail.value = 1;
  vecMat.uniforms.uTime.value = frame * 1.6;
  vecMat.uniforms.uOpacity.value = amount * 0.9;
  return (
    <group>
      <mesh position={[p.x, 0.07, p.z]} rotation-x={-Math.PI / 2} material={heat}>
        <planeGeometry args={[16, 16]} />
      </mesh>
      <mesh position={[p.x, 0.08, p.z]} rotation-x={-Math.PI / 2} material={core}>
        <planeGeometry args={[5, 5]} />
      </mesh>
      {rings.map((m, i) => {
        const phase = ((frame / 30) * 0.85 + i / rings.length) % 1;
        const r = 1.2 + phase * 7.5;
        m.uniforms.uOpacity.value = amount * (1 - phase) * 1.1;
        m.uniforms.uWidth.value = 0.05;
        return (
          <mesh key={i} position={[p.x, 0.09 + i * 0.002, p.z]} rotation-x={-Math.PI / 2} material={m}>
            <planeGeometry args={[r * 2, r * 2]} />
          </mesh>
        );
      })}
      {vectors.map((v, i) =>
        v.len < 14 ? (
          <mesh key={i} material={vecMat}>
            <tubeGeometry args={[new THREE.LineCurve3(v.a, v.b), 12, 0.06, 5, false]} />
          </mesh>
        ) : null,
      )}
    </group>
  );
};

/* ---------------------------------------------------- line-break plane */

export const LineBreakCurtain = ({ sweep, opacity, frame }: { sweep: number; opacity: number; frame: number }) => {
  const mat = useMemo(() => makeCurtainMaterial(C.flood, "#ffffff"), []);
  const [lx] = toWorld(LINE_X, 50);
  mat.uniforms.uSweep.value = sweep;
  mat.uniforms.uOpacity.value = opacity;
  mat.uniforms.uTime.value = frame;
  if (opacity <= 0.001) return null;
  return (
    <mesh position={[lx, 3.5, 0]} rotation-y={Math.PI / 2} material={mat}>
      <planeGeometry args={[68, 7, 1, 1]} />
    </mesh>
  );
};

/* -------------------------------------------------------- sprint streak */

export const SprintStreak = ({ t, frame, opacity }: { t: number; frame: number; opacity: number }) => {
  const mat = useMemo(() => makeRibbonMaterial(C.ice, "#ffffff"), []);
  const geo = useMemo(() => {
    const p = playerById("NHR-14");
    const pts = Array.from({ length: 40 }, (_, i) => {
      const tt = T_RECEIVE + (i / 39) * (T_SPRINT_END - T_RECEIVE);
      const s = playerAt(p, tt);
      return new THREE.Vector3(s.x, 0.08, s.z);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.3, 4, false);
  }, []);
  const prog = clamp01((t - T_RECEIVE) / (T_SPRINT_END - T_RECEIVE));
  mat.uniforms.uProgress.value = prog;
  mat.uniforms.uTail.value = 0.5;
  mat.uniforms.uTime.value = frame;
  mat.uniforms.uOpacity.value = opacity * 0.8;
  if (prog <= 0 || opacity <= 0) return null;
  return <mesh geometry={geo} material={mat} scale={[1, 0.2, 1]} />;
};

/* ---------------------------------------------------------- event storm */

/**
 * All 1,275 logged events. `form` 0 = scattered vortex, 1 = settled on their pitch
 * coordinates; `collapse` pulls everything into a single point (the scoreline).
 */
export const EventStorm = ({
  frame,
  form,
  collapse,
  opacity = 1,
  lift = 0,
}: {
  frame: number;
  form: number;
  collapse: number;
  opacity?: number;
  lift?: number;
}) => {
  const data = useMemo(() => {
    const ev = hero.allEvents as number[][];
    const n = ev.length;
    const r = rng(1275);
    const home = new THREE.Color(C.ice);
    const away = new THREE.Color(C.signal);
    const hot = new THREE.Color(C.flood);
    const target = new Float32Array(n * 3);
    const scatter = new Float32Array(n * 4);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const types = hero.types as string[];
    for (let i = 0; i < n; i++) {
      const [x, y, type, team] = ev[i];
      const [wx, wz] = toWorld(x, y);
      target.set([wx, 0.4, wz], i * 3);
      const rad = 30 + r() * 70;
      scatter.set([rad, r() * Math.PI * 2, (r() - 0.5) * 60, 0.5 + r()], i * 4);
      const name = types[type];
      const special = name === "goal" || name === "shot";
      const c = special ? hot : team === 0 ? home : away;
      col.set([c.r * 1.6, c.g * 1.6, c.b * 1.6], i * 3);
      size[i] = special ? 4.2 : name === "pass" ? 1.6 : 2.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return { geo, target, scatter, n, mat: makePointsMaterial() };
  }, []);
  const pos = data.geo.getAttribute("position") as THREE.BufferAttribute;
  const t = frame / 30;
  for (let i = 0; i < data.n; i++) {
    const [rad, ang, h, spd] = [data.scatter[i * 4], data.scatter[i * 4 + 1], data.scatter[i * 4 + 2], data.scatter[i * 4 + 3]];
    const a = ang + t * 0.35 * spd;
    const sx = Math.cos(a) * rad;
    const sz = Math.sin(a) * rad * 0.7;
    const sy = 18 + h + Math.sin(a * 2 + i) * 4;
    // stagger formation by index (chronological order of the match)
    const k = smooth(clamp01(form * 1.6 - (i / data.n) * 0.6));
    let x = sx + (data.target[i * 3] - sx) * k;
    let y = sy + (data.target[i * 3 + 1] + lift - sy) * k;
    let z = sz + (data.target[i * 3 + 2] - sz) * k;
    const c = smooth(clamp01(collapse * 1.3 - (1 - i / data.n) * 0.3));
    x *= 1 - c;
    z *= 1 - c;
    y = y + (6 - y) * c;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  data.mat.uniforms.uOpacity.value = opacity;
  data.mat.uniforms.uScale.value = 1 + collapse * 0.5;
  return <points geometry={data.geo} material={data.mat} frustumCulled={false} />;
};
