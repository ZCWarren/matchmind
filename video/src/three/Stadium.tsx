import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../theme";
import { PITCH } from "../lib/data";
import { rng } from "../lib/motion";

const L = PITCH.length;
const W = PITCH.width;

/* ------------------------------------------------------------------ pitch */

const drawPitch = () => {
  const s = 24;
  const pad = 6;
  const cw = (L + pad * 2) * s;
  const ch = (W + pad * 2) * s;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#587E59";
  g.fillRect(0, 0, cw, ch);
  const stripes = 18;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? "#628861" : "#6B9067";
    g.fillRect((pad + (i * L) / stripes) * s, pad * s, (L / stripes) * s + 1, W * s);
  }
  const r = rng(7);
  for (let i = 0; i < 18000; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "238,244,222" : "29,66,39"},${0.014 + r() * 0.022})`;
    g.fillRect(r() * cw, r() * ch, 1 + r() * 3, 1);
  }
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
    ctx.strokeStyle = ctx === g ? "rgba(250,250,238,0.88)" : "rgba(255,255,255,1)";
    ctx.fillStyle = ctx.strokeStyle as string;
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
      ctx.arc(x0 + dir * 11, W / 2, 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(L / 2, W / 2, 0.2, 0, Math.PI * 2);
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
        <meshStandardMaterial
          map={tex.map}
          emissiveMap={tex.emissive}
          emissive="#ffffff"
          emissiveIntensity={lineGlow * 0.015}
          roughness={0.96}
          metalness={0}
          envMapIntensity={0.22}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.025} receiveShadow>
        <planeGeometry args={[220, 170]} />
        <meshStandardMaterial color="#AAB7A5" roughness={1} metalness={0} envMapIntensity={0.2} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ goals */

const goalNetGeometry = () => {
  const vertices: number[] = [];
  const segment = (a: [number, number, number], b: [number, number, number]) => vertices.push(...a, ...b);
  const halfWidth = 3.66;
  const height = 2.44;
  const depth = 2.1;
  for (let i = 0; i <= 16; i++) {
    const z = -halfWidth + (i / 16) * halfWidth * 2;
    segment([depth, 0, z], [depth, height * 0.86, z]);
    segment([0, height, z], [depth, height * 0.86, z]);
  }
  for (let i = 0; i <= 6; i++) {
    const y = (i / 6) * height * 0.86;
    segment([depth, y, -halfWidth], [depth, y, halfWidth]);
  }
  for (const side of [-1, 1]) {
    const z = side * halfWidth;
    for (let i = 0; i <= 5; i++) {
      const x = (i / 5) * depth;
      segment([x, 0, z], [x, height - (x / depth) * height * 0.14, z]);
    }
    for (let i = 0; i <= 6; i++) {
      const y = (i / 6) * height;
      segment([0, y, z], [depth, y * 0.86, z]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
};

const Goal = ({ side }: { side: -1 | 1 }) => {
  const net = useMemo(goalNetGeometry, []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F7F7F0", roughness: 0.42, metalness: 0.12 }), []);
  const mesh = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#E9EEE8", transparent: true, opacity: 0.42, depthWrite: false }),
    [],
  );
  return (
    <group position={[side * (L / 2), 0, 0]} scale-x={side}>
      {[-3.66, 3.66].map((z) => (
        <mesh key={z} position={[0, 1.22, z]} material={frame} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.44, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 2.44, 0]} rotation-x={Math.PI / 2} material={frame} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 7.44, 10]} />
      </mesh>
      {[-3.66, 3.66].map((z) => (
        <mesh key={z} position={[1.05, 0.06, z]} rotation-z={Math.PI / 2} material={frame}>
          <cylinderGeometry args={[0.035, 0.035, 2.1, 8]} />
        </mesh>
      ))}
      <lineSegments geometry={net} material={mesh} />
    </group>
  );
};

export const Goals = () => (
  <group>
    <Goal side={-1} />
    <Goal side={1} />
  </group>
);

/* -------------------------------------------------------------- LED boards */

const drawBoard = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#F2F3EE";
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = "#D8DED8";
  g.fillRect(0, 0, canvas.width, 4);
  g.font = "600 62px 'Inter Tight'";
  g.textBaseline = "middle";
  const marks = ["MatchMind", "MM"];
  let x = 56;
  let i = 0;
  while (x < canvas.width - 80) {
    const mark = marks[i % marks.length];
    g.fillStyle = i % 2 ? C.ice : C.text;
    g.fillText(mark, x, 68);
    x += g.measureText(mark).width + 120;
    g.fillStyle = C.signal;
    g.fillRect(x - 60, 60, 9, 9);
    x += 36;
    i++;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
};

export const Boards = ({ intensity = 1, scroll = 0 }: { intensity?: number; scroll?: number }) => {
  const texs = useMemo(() => {
    const base = drawBoard();
    return [0, 1, 2, 3].map(() => {
      const texture = base.clone();
      texture.needsUpdate = true;
      return texture;
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
  const brightness = 0.86 + intensity * 0.14;
  return (
    <group>
      {sides.map((side, i) => {
        const texture = texs[i];
        texture.repeat.set(side.len / 60, 1);
        texture.offset.x = scroll + i * 0.37;
        return (
          <mesh key={i} position={side.pos as unknown as [number, number, number]} rotation-y={side.rot}>
            <planeGeometry args={[side.len, 0.95]} />
            <meshBasicMaterial map={texture} color={new THREE.Color(brightness, brightness, brightness)} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------------- bowl */

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
  segs = 180,
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
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  return geometry;
};

const drawSeats = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#9CA7A1";
  g.fillRect(0, 0, 512, 1024);
  const r = rng(99);
  const rows = 48;
  for (let j = 0; j < rows; j++) {
    const y = (j / rows) * 1024;
    g.fillStyle = j % 2 ? "#B9C0B9" : "#AFB8B1";
    g.fillRect(0, y, 512, 1024 / rows / 2.5);
    for (let k = 0; k < 72; k++) {
      const v = r();
      g.fillStyle = v > 0.985 ? "rgba(22,124,159,0.24)" : v > 0.97 ? "rgba(207,96,72,0.2)" : `rgba(44,57,52,${0.06 + r() * 0.1})`;
      g.fillRect(r() * 512, y + 4 + r() * 8, 3 + r() * 3, 4 + r() * 4);
    }
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = "#7F8B85";
    g.fillRect(60 + i * 128, 380, 18, 140);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
};

export const Bowl = ({ glow = 1 }: { glow?: number }) => {
  const parts = useMemo(() => {
    const seats = drawSeats();
    const lower = makeBand([64, 46, 0.8], [88, 66, 15], 20);
    const upper = makeBand([90, 68, 18], [112, 86, 38], 20);
    const fascia = makeBand([88, 66, 15], [90, 68, 18], 1);
    const roof = makeBand([96, 74, 46], [116, 90, 41], 2);
    const back = makeBand([112, 86, 38], [116, 90, 41], 1);
    const ringPts = Array.from({ length: 180 }, (_, i) => {
      const [x, z] = contour((i / 180) * Math.PI * 2, 96, 74);
      return new THREE.Vector3(x, 45.8, z);
    });
    const ring = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts, true), 360, 0.28, 6, true);
    const fasciaPts = Array.from({ length: 180 }, (_, i) => {
      const [x, z] = contour((i / 180) * Math.PI * 2, 88.6, 66.6);
      return new THREE.Vector3(x, 16.2, z);
    });
    const fasciaLine = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fasciaPts, true), 360, 0.16, 6, true);
    return { seats, lower, upper, fascia, roof, back, ring, fasciaLine };
  }, []);
  const concrete = new THREE.Color("#D9DCD4").multiplyScalar(0.9 + glow * 0.1);
  return (
    <group>
      <mesh geometry={parts.lower} receiveShadow>
        <meshStandardMaterial map={parts.seats} roughness={0.94} metalness={0} side={THREE.DoubleSide} envMapIntensity={0.2} />
      </mesh>
      <mesh geometry={parts.upper}>
        <meshStandardMaterial map={parts.seats} roughness={0.94} metalness={0} side={THREE.DoubleSide} envMapIntensity={0.2} />
      </mesh>
      <mesh geometry={parts.fascia}>
        <meshStandardMaterial color={concrete} roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={parts.roof}>
        <meshStandardMaterial color="#E5E5DE" roughness={0.76} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={parts.back}>
        <meshStandardMaterial color="#B6C0B7" roughness={0.94} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={parts.ring}>
        <meshStandardMaterial color="#E9E9E1" roughness={0.58} metalness={0.18} />
      </mesh>
      <mesh geometry={parts.fasciaLine}>
        <meshStandardMaterial color="#89968F" roughness={0.72} />
      </mesh>
    </group>
  );
};

/* --------------------------------------------------------------- lighting */

export const TOWERS: [number, number][] = [
  [-90, -69],
  [90, -69],
  [-90, 69],
  [90, 69],
];
const MAST_H = 62;

export const Floodlights = ({ power }: { power: number[]; frame: number; beam?: number }) => {
  const lamps = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) out.push([(i - 2.5) * 1.6, (j - 1.5) * 1.5]);
    return out;
  }, []);
  return (
    <group>
      {TOWERS.map(([x, z], k) => {
        const head = new THREE.Vector3(x, MAST_H, z);
        const target = new THREE.Vector3(x * 0.12, 0, z * 0.1);
        const faceQuat = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(head, target, new THREE.Vector3(0, 1, 0)),
        );
        const lampColor = new THREE.Color("#F4F1E8").multiplyScalar(0.8 + (power[k] ?? 1) * 0.2);
        return (
          <group key={k}>
            <mesh position={[x, MAST_H / 2, z]}>
              <cylinderGeometry args={[0.48, 1.05, MAST_H, 12]} />
              <meshStandardMaterial color="#78857F" roughness={0.62} metalness={0.34} />
            </mesh>
            <group position={head} quaternion={faceQuat}>
              <mesh position-z={0.6}>
                <boxGeometry args={[11, 7.5, 0.8]} />
                <meshStandardMaterial color="#929E98" roughness={0.62} metalness={0.28} />
              </mesh>
              {lamps.map(([lx, ly], i) => (
                <mesh key={i} position={[lx, ly, -0.05]} rotation-x={Math.PI}>
                  <circleGeometry args={[0.54, 12]} />
                  <meshBasicMaterial color={lampColor} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
    </group>
  );
};

export const FloodLighting = ({ power, shadows = true }: { power: number[]; shadows?: boolean }) => {
  const targets = useMemo(
    () =>
      TOWERS.map(([x, z]) => {
        const object = new THREE.Object3D();
        object.position.set(-x * 0.12, 0, -z * 0.1);
        return object;
      }),
    [],
  );
  return (
    <group>
      <hemisphereLight args={["#EAF3F6", "#65775D", 0.8]} />
      <ambientLight color="#F4F1E8" intensity={0.12} />
      <directionalLight
        position={[-55, 95, 45]}
        color="#FFF3DD"
        intensity={1.75}
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-82}
        shadow-camera-right={82}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={20}
        shadow-camera-far={220}
        shadow-bias={-0.00018}
        shadow-normalBias={0.035}
      />
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
            intensity={0.12 * (power[k] ?? 1)}
            color="#FFF7E9"
          />
        </group>
      ))}
    </group>
  );
};

export const FloodEnvironment = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const env = new THREE.Scene();
    env.background = new THREE.Color("#E7EEF0");
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(400, 24, 12),
      new THREE.MeshBasicMaterial({ color: "#E7EEF0", side: THREE.BackSide }),
    );
    env.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: "#91A087" }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -4;
    env.add(ground);
    const sun = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.25, 1.95) }));
    sun.position.set(-80, 120, 60);
    sun.lookAt(0, 0, 0);
    env.add(sun);
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(env, 0.04);
    scene.environment = rt.texture;
    pm.dispose();
  }, [gl, scene]);
  return null;
};

/* -------------------------------------------------- optional atmosphere API */

export const CrowdFlashes = (_props: { frame: number; amount?: number }) => null;
export const Haze = (_props: { frame: number; amount?: number }) => null;
export const GroundMist = (_props: { amount?: number }) => null;
