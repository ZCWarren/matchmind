import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../theme";
import { PITCH } from "../lib/data";
import { rng } from "../lib/motion";
import { makeBeamMaterial, makeGlowMaterial, makePointsMaterial } from "./shaders";

const L = PITCH.length;
const W = PITCH.width;

/* ------------------------------------------------------------------ pitch */

const drawPitch = () => {
  const s = 40; // px per metre
  const pad = 6; // metres of run-off drawn into texture
  const cw = (L + pad * 2) * s;
  const ch = (W + pad * 2) * s;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const g = canvas.getContext("2d")!;
  // base
  g.fillStyle = "#638D60";
  g.fillRect(0, 0, cw, ch);
  // mowing stripes
  const stripes = 18;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? "#6D9B67" : "#7DA976";
    g.fillRect((pad + (i * L) / stripes) * s, pad * s, (L / stripes) * s, W * s);
  }
  // subtle cross-hatching grain
  const r = rng(7);
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "36,77,50"},${0.012 + r() * 0.018})`;
    g.fillRect(r() * cw, r() * ch, 2 + r() * 3, 1);
  }
  // lines
  const lineCanvas = document.createElement("canvas");
  lineCanvas.width = cw;
  lineCanvas.height = ch;
  const lg = lineCanvas.getContext("2d")!;
  lg.fillStyle = "#000";
  lg.fillRect(0, 0, cw, ch);
  for (const ctx of [g, lg]) {
    ctx.save();
    ctx.translate(pad * s, pad * s);
    ctx.scale(s, s);
    ctx.strokeStyle = ctx === g ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,1)";
    ctx.lineWidth = 0.12;
    ctx.strokeRect(0, 0, L, W);
    ctx.beginPath();
    ctx.moveTo(L / 2, 0);
    ctx.lineTo(L / 2, W);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(L / 2, W / 2, 9.15, 0, Math.PI * 2);
    ctx.stroke();
    for (const side of [0, 1]) {
      const x0 = side ? L : 0;
      const dir = side ? -1 : 1;
      ctx.strokeRect(side ? L - 16.5 : 0, W / 2 - 20.16, 16.5, 40.32);
      ctx.strokeRect(side ? L - 5.5 : 0, W / 2 - 9.16, 5.5, 18.32);
      ctx.beginPath();
      ctx.arc(x0 + dir * 11, W / 2, 9.15, side ? Math.PI - 0.93 : -0.93, side ? Math.PI + 0.93 : 0.93);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x0 + dir * 11, W / 2, 0.22, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(L / 2, W / 2, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const emissive = new THREE.CanvasTexture(lineCanvas);
  emissive.anisotropy = 8;
  return { map, emissive, size: [L + pad * 2, W + pad * 2] as const };
};

export const Pitch = ({ lineGlow = 0.18 }: { lineGlow?: number }) => {
  const tex = useMemo(drawPitch, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[tex.size[0], tex.size[1]]} />
        <meshPhysicalMaterial
          map={tex.map}
          emissiveMap={tex.emissive}
          emissive={"#ffffff"}
          emissiveIntensity={lineGlow * 0.2}
          roughness={0.86}
          metalness={0}
          clearcoat={0.05}
          clearcoatRoughness={0.8}
          envMapIntensity={0.4}
        />
      </mesh>
      {/* outer apron */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <planeGeometry args={[220, 170]} />
        <meshStandardMaterial color={"#CBDCBF"} roughness={0.9} metalness={0} envMapIntensity={0.4} />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------- LED boards */

const drawBoard = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 4096;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 4096, 0);
  grad.addColorStop(0, "#F4F7F1");
  grad.addColorStop(0.5, "#EAF0E6");
  grad.addColorStop(1, "#F4F7F1");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4096, 128);
  g.font = "600 76px 'Inter Tight'";
  g.textBaseline = "middle";
  const words = ["MatchMind", "See the game beneath the game", "MatchMind", "Nova Harbor · Orion North"];
  let x = 40;
  let i = 0;
  while (x < 4096) {
    const word = words[i % words.length];
    g.fillStyle = i % 2 ? C.flood : C.signal;
    g.fillText(word, x, 68);
    x += g.measureText(word).width + 140;
    g.fillStyle = C.ice;
    g.beginPath();
    g.arc(x - 70, 64, 7, 0, Math.PI * 2);
    g.fill();
    i++;
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

export const Boards = ({ intensity = 1, scroll = 0 }: { intensity?: number; scroll?: number }) => {
  const texs = useMemo(() => {
    const base = drawBoard();
    return [0, 1, 2, 3].map(() => {
      const t = base.clone();
      t.needsUpdate = true;
      return t;
    });
  }, []);
  const sides = useMemo(() => {
    const offL = L / 2 + 5;
    const offW = W / 2 + 4.5;
    return [
      { pos: [0, 0.5, -offW] as const, rot: 0, len: L + 6 },
      { pos: [0, 0.5, offW] as const, rot: Math.PI, len: L + 6 },
      { pos: [-offL, 0.5, 0] as const, rot: Math.PI / 2, len: W + 4 },
      { pos: [offL, 0.5, 0] as const, rot: -Math.PI / 2, len: W + 4 },
    ];
  }, []);
  return (
    <group>
      {sides.map((side, i) => {
        const t = texs[i];
        t.repeat.set(side.len / 60, 1);
        t.offset.x = scroll + i * 0.37;
        return (
          <mesh key={i} position={side.pos as unknown as [number, number, number]} rotation-y={side.rot}>
            <planeGeometry args={[side.len, 0.95]} />
            <meshBasicMaterial map={t} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(1.3 * intensity)} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------- bowl */

/** Superellipse contour point. */
const contour = (theta: number, a: number, b: number, n = 4) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * a;
  const z = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * b;
  return [x, z] as const;
};

const makeBand = (
  inner: [number, number, number],
  outer: [number, number, number],
  rows: number,
  segs = 220,
  n = 4,
) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const th = (i / segs) * Math.PI * 2;
    for (let j = 0; j <= rows; j++) {
      const r = j / rows;
      const a = inner[0] + (outer[0] - inner[0]) * r;
      const b = inner[1] + (outer[1] - inner[1]) * r;
      const h = inner[2] + (outer[2] - inner[2]) * r;
      const [x, z] = contour(th, a, b, n);
      pos.push(x, h, z);
      uv.push((i / segs) * 24, r);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j;
      const b = (i + 1) * (rows + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

const drawSeats = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#D3DFCD";
  g.fillRect(0, 0, 512, 1024);
  const r = rng(99);
  const rows = 48;
  for (let j = 0; j < rows; j++) {
    const y = (j / rows) * 1024;
    g.fillStyle = "#E4EDDF";
    g.fillRect(0, y, 512, 1024 / rows / 2.4);
    // crowd specks
    for (let k = 0; k < 90; k++) {
      const v = r();
      g.fillStyle = v > 0.97 ? "rgba(22,124,159,0.32)" : v > 0.94 ? "rgba(207,96,72,0.28)" : `rgba(83,100,90,${0.08 + r() * 0.12})`;
      g.fillRect(r() * 512, y + 4 + r() * 8, 3 + r() * 3, 4 + r() * 4);
    }
  }
  // vomitory gaps
  for (let i = 0; i < 4; i++) {
    g.fillStyle = "#A9BCA3";
    g.fillRect(60 + i * 128, 380, 18, 140);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

export const Bowl = ({ glow = 1 }: { glow?: number }) => {
  const parts = useMemo(() => {
    const seats = drawSeats();
    const lower = makeBand([64, 46, 0.8], [88, 66, 15], 24);
    const upper = makeBand([90, 68, 18], [112, 86, 38], 24);
    const fascia = makeBand([88, 66, 15], [90, 68, 18], 1);
    const roof = makeBand([96, 74, 46], [116, 90, 41], 2);
    const back = makeBand([112, 86, 38], [116, 90, 41], 1);
    const ringPts = Array.from({ length: 240 }, (_, i) => {
      const [x, z] = contour((i / 240) * Math.PI * 2, 96, 74);
      return new THREE.Vector3(x, 45.8, z);
    });
    const ring = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts, true), 480, 0.35, 6, true);
    const fasciaPts = Array.from({ length: 240 }, (_, i) => {
      const [x, z] = contour((i / 240) * Math.PI * 2, 88.6, 66.6);
      return new THREE.Vector3(x, 16.2, z);
    });
    const fasciaLine = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fasciaPts, true), 480, 0.22, 6, true);
    return { seats, lower, upper, fascia, roof, back, ring, fasciaLine };
  }, []);
  return (
    <group>
      <mesh geometry={parts.lower} receiveShadow>
        <meshStandardMaterial map={parts.seats} roughness={0.9} metalness={0} side={THREE.DoubleSide} envMapIntensity={0.25} />
      </mesh>
      <mesh geometry={parts.upper}>
        <meshStandardMaterial map={parts.seats} roughness={0.9} metalness={0} side={THREE.DoubleSide} envMapIntensity={0.25} />
      </mesh>
      <mesh geometry={parts.fascia}>
        <meshStandardMaterial color="#D3DFCD" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={parts.roof}>
        <meshStandardMaterial color="#E4EDDF" roughness={0.8} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={parts.back}>
        <meshStandardMaterial color="#CBDCBF" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={parts.ring}>
        <meshBasicMaterial color={C.flood} />
      </mesh>
      <mesh geometry={parts.fasciaLine}>
        <meshBasicMaterial color={C.signal} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------ crowd flashes */

export const CrowdFlashes = ({ frame, amount = 1 }: { frame: number; amount?: number }) => {
  const { geo, mat, seeds } = useMemo(() => {
    const r = rng(2026);
    const count = 900;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seeds = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const upper = r() > 0.55;
      const t = r();
      const th = r() * Math.PI * 2;
      const a = upper ? 90 + 22 * t : 64 + 24 * t;
      const b = upper ? 68 + 18 * t : 46 + 20 * t;
      const h = upper ? 18 + 20 * t : 0.8 + 14.2 * t;
      const [x, z] = contour(th, a, b);
      pos.set([x, h + 0.6, z], i * 3);
      seeds[i * 2] = r() * 400;
      seeds[i * 2 + 1] = 40 + r() * 140;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const mat = makePointsMaterial();
    return { geo, mat, seeds };
  }, []);
  const col = geo.getAttribute("aColor") as THREE.BufferAttribute;
  const size = geo.getAttribute("aSize") as THREE.BufferAttribute;
  for (let i = 0; i < size.count; i++) {
    const phase = (frame + seeds[i * 2]) % seeds[i * 2 + 1];
    const flash = phase < 3 ? 1 - phase / 3 : 0;
    const v = flash * amount;
    col.setXYZ(i, v * 3, v * 2.9, v * 2.7);
    size.setX(i, 1.2 + flash * 2.5);
  }
  col.needsUpdate = true;
  size.needsUpdate = true;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

/* ------------------------------------------------------- floodlights */

export const TOWERS: [number, number][] = [
  [-90, -69],
  [90, -69],
  [-90, 69],
  [90, 69],
];
const MAST_H = 62;

export const Floodlights = ({ power, frame, beam = 1 }: { power: number[]; frame: number; beam?: number }) => {
  const mats = useMemo(() => TOWERS.map(() => makeBeamMaterial(C.flood)), []);
  const glow = useMemo(() => TOWERS.map(() => makeGlowMaterial(C.flood, 1, 2.6)), []);
  const lamps = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) out.push([(i - 2.5) * 1.6, (j - 1.5) * 1.5]);
    return out;
  }, []);
  return (
    <group>
      {TOWERS.map(([x, z], k) => {
        const p = power[k] ?? 1;
        const head = new THREE.Vector3(x, MAST_H, z);
        const target = new THREE.Vector3(x * 0.12, 0, z * 0.1);
        const dir = target.clone().sub(head);
        const len = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
        const faceQuat = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(head, target, new THREE.Vector3(0, 1, 0)),
        );
        mats[k].uniforms.uIntensity.value = p * beam;
        mats[k].uniforms.uTime.value = frame;
        glow[k].uniforms.uOpacity.value = p * 0.08;
        const mid = head.clone().add(dir.clone().multiplyScalar(0.5));
        return (
          <group key={k}>
            {/* mast */}
            <mesh position={[x, MAST_H / 2, z]}>
              <cylinderGeometry args={[0.6, 1.3, MAST_H, 10]} />
              <meshStandardMaterial color="#80927C" roughness={0.75} metalness={0.2} />
            </mesh>
            {/* lamp head */}
            <group position={head} quaternion={faceQuat}>
              <mesh position-z={0.6}>
                <boxGeometry args={[11, 7.5, 0.8]} />
                <meshStandardMaterial color="#A9BCA3" roughness={0.7} metalness={0.2} />
              </mesh>
              {lamps.map(([lx, ly], i) => (
                <mesh key={i} position={[lx, ly, -0.05]} rotation-x={Math.PI}>
                  <circleGeometry args={[0.6, 16]} />
                  <meshBasicMaterial color="#FFFDF5" side={THREE.DoubleSide} />
                </mesh>
              ))}
              <mesh position-z={-0.6} material={glow[k]}>
                <planeGeometry args={[46, 46]} />
              </mesh>
            </group>
            {/* volumetric cone */}
            <mesh position={mid} quaternion={quat} material={mats[k]}>
              <cylinderGeometry args={[3.2, 46, len, 48, 1, true]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Real light sources matching the towers. Shadow-casting spot lights radiate player shadows. */
export const FloodLighting = ({ power, shadows = true }: { power: number[]; shadows?: boolean }) => {
  const targets = useMemo(
    () =>
      TOWERS.map(([x, z]) => {
        const o = new THREE.Object3D();
        o.position.set(-x * 0.12, 0, -z * 0.1);
        return o;
      }),
    [],
  );
  return (
    <group>
      <hemisphereLight args={["#F4F7F1", "#6F8F68", 0.85]} />
      {TOWERS.map(([x, z], k) => (
        <group key={k}>
          <primitive object={targets[k]} />
          <spotLight
            position={[x, MAST_H, z]}
            target={targets[k]}
            angle={0.78}
            penumbra={1}
            decay={0}
            distance={0}
            intensity={0.9 * (power[k] ?? 1)}
            color={"#FFFDF5"}
            castShadow={shadows}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0004}
            shadow-camera-near={60}
            shadow-camera-far={220}
          />
        </group>
      ))}
    </group>
  );
};

/* ------------------------------------------------- env for reflections */

export const FloodEnvironment = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const env = new THREE.Scene();
    env.background = new THREE.Color("#DFEADA");
    const lampMat = new THREE.MeshBasicMaterial({ color: "#FFFDF5" });
    for (const [x, z] of TOWERS) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), lampMat);
      m.position.set(x, MAST_H, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    }
    const ringMat = new THREE.MeshBasicMaterial({ color: C.flood, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(105, 1.2, 6, 120), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 45;
    env.add(ring);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(400, 32, 16),
      new THREE.MeshBasicMaterial({ color: "#DFEADA", side: THREE.BackSide }),
    );
    env.add(sky);
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(env, 0.02);
    scene.environment = rt.texture;
    pm.dispose();
  }, [gl, scene]);
  return null;
};

/* ------------------------------------------------------ haze & dust */

export const Haze = ({ frame, amount = 1 }: { frame: number; amount?: number }) => {
  const { geo, mat, base } = useMemo(() => {
    const r = rng(404);
    const count = 2400;
    const base = new Float32Array(count * 4);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      base.set([(r() - 0.5) * 150, r() * 45 + 0.5, (r() - 0.5) * 110, r() * Math.PI * 2], i * 4);
      const warm = r();
      col.set([1 * warm + 0.6, 0.85 * warm + 0.6, 0.7 * warm + 0.65].map((c) => c * 0.22), i * 3);
      size[i] = 0.15 + r() * 0.35;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return { geo, mat: makePointsMaterial(), base };
  }, []);
  const p = geo.getAttribute("position") as THREE.BufferAttribute;
  const t = frame / 30;
  for (let i = 0; i < p.count; i++) {
    const ph = base[i * 4 + 3];
    p.setXYZ(
      i,
      base[i * 4] + Math.sin(t * 0.25 + ph) * 1.6,
      base[i * 4 + 1] + Math.sin(t * 0.18 + ph * 2) * 0.8,
      base[i * 4 + 2] + Math.cos(t * 0.2 + ph) * 1.6,
    );
  }
  p.needsUpdate = true;
  mat.uniforms.uOpacity.value = amount;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

/** Low ground mist: big soft additive discs hugging the pitch. */
export const GroundMist = ({ amount = 1 }: { amount?: number }) => {
  const mats = useMemo(
    () => [makeGlowMaterial("#7d8fb8", 0.05, 1.4), makeGlowMaterial(C.flood, 0.04, 1.6)],
    [],
  );
  mats[0].uniforms.uOpacity.value = 0.025 * amount;
  mats[1].uniforms.uOpacity.value = 0.02 * amount;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.6} material={mats[0]}>
        <planeGeometry args={[190, 140]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={1.2} material={mats[1]}>
        <planeGeometry args={[120, 80]} />
      </mesh>
    </group>
  );
};
