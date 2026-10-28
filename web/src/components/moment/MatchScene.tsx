import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Event, Team } from "../../types";
import Pitch from "../Pitch";

export type CameraMode = "broadcast" | "tactical" | "press";
export type SceneVariant = "hero" | "focus" | "story" | "broadcast";

type MatchSceneProps = {
  events: Event[];
  cursor: number;
  home?: Team;
  away?: Team;
  variant?: SceneVariant;
  /** Story variant only: continuous reveal stage 0..4 (events → pressure → lane → line break). */
  stage?: number;
  /** Story variant only: index of the hero event the camera frames. */
  anchor?: number;
  /** Moment-local public labels; the renderer still tracks raw player IDs. */
  playerLabels?: Record<string, string>;
};

const FALLBACK_HOME = { team_id: "home", name: "Home", short_name: "HOM", color: "#167C9F", venue: "" };
const FALLBACK_AWAY = { team_id: "away", name: "Away", short_name: "AWY", color: "#CF6048", venue: "" };

const ICE = new THREE.Color("#167C9F");
const SIGNAL = new THREE.Color("#CF6048");
const FLOOD = new THREE.Color("#2E6D46");
const INK = new THREE.Color("#DFEADA");

const SX = 0.18;
const SZ = 0.11;
function toWorld(x: number, y: number, h = 0) {
  return new THREE.Vector3((x - 50) * SX, h, (y - 50) * SZ);
}
function smooth(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/* ------------------------------------------------------------------ textures */

function pitchTexture(): THREE.CanvasTexture {
  const PX = 100; // px per world unit
  const W = 20 * PX;
  const H = 13 * PX;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const u = (x: number) => (x + 10) * PX;
  const v = (z: number) => (z + 6.5) * PX;
  // apron
  ctx.fillStyle = "#638d60";
  ctx.fillRect(0, 0, W, H);
  // mowing stripes
  const stripes = 14;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#7da976" : "#6d9b67";
    ctx.fillRect(u(-9 - 0.6) + (i * (19.2 * PX)) / stripes, v(-6.1), (19.2 * PX) / stripes + 1, 12.2 * PX);
  }
  // fine grain
  const grain = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 5;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);
  // markings
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  const rect = (x0: number, z0: number, x1: number, z1: number) => ctx.strokeRect(u(x0), v(z0), u(x1) - u(x0), v(z1) - v(z0));
  rect(-9, -5.5, 9, 5.5);
  ctx.beginPath();
  ctx.moveTo(u(0), v(-5.5));
  ctx.lineTo(u(0), v(5.5));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(u(0), v(0), 1.57 * PX, 0, Math.PI * 2);
  ctx.stroke();
  for (const side of [-1, 1]) {
    const gx = side * 9;
    const pa = gx - side * 2.83;
    const sb = gx - side * 0.94;
    rect(Math.min(gx, pa), -3.26, Math.max(gx, pa), 3.26);
    rect(Math.min(gx, sb), -1.48, Math.max(gx, sb), 1.48);
    const spot = gx - side * 1.89;
    ctx.fillStyle = "rgba(235,240,245,0.7)";
    ctx.beginPath();
    ctx.arc(u(spot), v(0), 6, 0, Math.PI * 2);
    ctx.fill();
    // penalty arc (outside the box only)
    ctx.save();
    ctx.beginPath();
    ctx.rect(side < 0 ? u(pa) : 0, 0, side < 0 ? W : u(pa), H);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(u(spot), v(0), 1.57 * PX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = "rgba(235,240,245,0.7)";
  ctx.beginPath();
  ctx.arc(u(0), v(0), 7, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function glowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/* ------------------------------------------------------------------ shaders */

const ribbonVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ribbonFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uTime; uniform float uProgress; uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    if (vUv.x > uProgress) discard;
    float f = fract(vUv.x * 10.0 - uTime * 1.4);
    float dash = smoothstep(0.0, 0.25, f) * smoothstep(1.0, 0.55, f);
    float head = smoothstep(uProgress - 0.12, uProgress, vUv.x);
    float tail = smoothstep(0.0, 0.08, vUv.x);
    vec3 c = uColor * (0.9 + dash * 1.4) + vec3(1.0) * head * 1.2;
    float a = uOpacity * tail;
    gl_FragColor = vec4(c * a, a);
  }`;

const laneFloorFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; uniform float uProgress; uniform float uTime;
  varying vec2 vUv;
  void main() {
    if (vUv.x > uProgress) discard;
    float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
    float core = pow(edge, 2.5);
    float pulse = 0.75 + 0.25 * sin(uTime * 2.0 - vUv.x * 8.0);
    float a = uOpacity * core * pulse * smoothstep(0.0, 0.1, vUv.x);
    gl_FragColor = vec4(uColor * a, a);
  }`;

const heatFragment = /* glsl */ `
  #define MAX_HEAT 16
  uniform vec4 uHeat[MAX_HEAT];
  uniform int uCount; uniform float uOpacity; uniform float uTime;
  uniform vec3 uHot; uniform vec3 uWarm;
  varying vec2 vUv;
  void main() {
    vec2 p = vec2((vUv.x - 0.5) * 18.0, (0.5 - vUv.y) * 11.0);
    float h = 0.0;
    for (int i = 0; i < MAX_HEAT; i++) {
      if (i >= uCount) break;
      vec4 s = uHeat[i];
      float d = length(p - s.xy);
      float r = 0.7 + s.z * 0.8;
      h += s.w * s.z * exp(-(d * d) / (r * r));
    }
    h = clamp(h, 0.0, 1.4);
    float bands = 0.88 + 0.12 * sin(h * 26.0 - uTime * 2.0);
    vec3 c = mix(uHot, uWarm, smoothstep(0.7, 1.3, h)) * bands;
    float a = uOpacity * smoothstep(0.05, 0.9, h) * 0.85;
    gl_FragColor = vec4(c * a, a);
  }`;

const sweepFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
  varying vec2 vUv;
  void main() {
    float vertical = pow(1.0 - vUv.y, 2.2);
    float sides = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float scan = 0.7 + 0.3 * sin(vUv.x * 40.0 + uTime * 6.0);
    float a = uOpacity * vertical * sides * scan;
    gl_FragColor = vec4(uColor * a, a);
  }`;

/* ------------------------------------------------------------------ players */

type Figure = {
  group: THREE.Group;
  ring: THREE.Mesh;
  glow: THREE.Mesh;
  band: THREE.Mesh;
  body: THREE.Mesh;
  target: THREE.Vector3;
  team: "home" | "away";
};

function playerKitGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0, 0.052], [0.132, 0.052], [0.127, 0.069], [0.114, 0.085],
    [0.102, 0.112], [0.092, 0.15], [0.08, 0.205], [0.067, 0.275],
    [0.063, 0.335], [0.068, 0.385], [0.079, 0.425], [0.083, 0.447],
    [0.078, 0.468], [0.064, 0.488], [0.047, 0.508], [0.039, 0.532],
    [0.041, 0.552], [0.052, 0.573], [0.06, 0.594], [0.06, 0.614],
    [0.052, 0.635], [0.037, 0.653], [0.017, 0.666], [0, 0.672],
  ];
  return new THREE.LatheGeometry(profile.map(([radius, y]) => new THREE.Vector2(radius, y)), 32);
}

function playerBaseGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0, 0.012], [0.105, 0.012], [0.135, 0.016], [0.148, 0.027],
    [0.15, 0.041], [0.146, 0.052], [0.132, 0.062], [0, 0.062],
  ];
  return new THREE.LatheGeometry(profile.map(([radius, y]) => new THREE.Vector2(radius, y)), 32);
}

/* ------------------------------------------------------------------ component */

export default function MatchScene({
  events,
  cursor,
  home,
  away,
  variant = "focus",
  stage = 4,
  anchor,
  playerLabels,
}: MatchSceneProps) {
  const mount = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(cursor);
  const stageRef = useRef(stage);
  const anchorRef = useRef(anchor ?? cursor);
  const playerLabelsRef = useRef(playerLabels);
  const cameraModeRef = useRef<CameraMode>("broadcast");
  const [cameraMode, setCameraMode] = useState<CameraMode>("broadcast");
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  const homeTeam = home ?? FALLBACK_HOME;
  const awayTeam = away ?? FALLBACK_AWAY;

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { anchorRef.current = anchor ?? cursor; }, [anchor, cursor]);
  useEffect(() => { playerLabelsRef.current = playerLabels; }, [playerLabels]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);

  useEffect(() => {
    if (!mount.current || events.length === 0 || reduceMotion) return;
    const container = mount.current;
    const mobile = window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: "high-performance" });
      if (!renderer.getContext()) throw new Error("no webgl");
    } catch {
      setFailed(true);
      return;
    }
    const dprCap = mobile ? 1.25 : variant === "hero" || variant === "story" ? 1.5 : 1.35;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setClearColor(INK, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.prepend(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const scene = new THREE.Scene();
    scene.background = INK.clone();
    scene.fog = new THREE.FogExp2(INK.getHex(), variant === "hero" ? 0.01 : 0.008);
    const camera = new THREE.PerspectiveCamera(variant === "hero" ? 36 : 38, 1, 0.1, 160);

    /* --- daylight rig: one shadow-casting sun, soft sky fill --- */
    scene.add(new THREE.HemisphereLight(0xf5f9ff, 0x637b59, 1.65));
    const sun = new THREE.DirectionalLight(0xfff6e8, 3.1);
    sun.position.set(-9, 17, 11);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = renderer.shadowMap.enabled;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 45;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    const towers: THREE.Vector3[] = [
      new THREE.Vector3(-13.5, 9.5, -10),
      new THREE.Vector3(13.5, 9.5, -10),
      new THREE.Vector3(-13.5, 9.5, 10),
      new THREE.Vector3(13.5, 9.5, 10),
    ];

    /* --- ground, pitch --- */
    const ground = new THREE.Mesh(
      track(new THREE.PlaneGeometry(160, 160)),
      track(new THREE.MeshStandardMaterial({ color: 0xcbdcbf, roughness: 0.95, metalness: 0 })),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    const pitchMap = track(pitchTexture());
    pitchMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const pitch = new THREE.Mesh(
      track(new THREE.PlaneGeometry(20, 13)),
      track(new THREE.MeshStandardMaterial({
        map: pitchMap,
        bumpMap: pitchMap,
        bumpScale: 0.006,
        roughness: 0.94,
        metalness: 0,
      })),
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    scene.add(pitch);

    /* --- goals: tubular frames and a single line-segment net per goal --- */
    const goalMat = track(new THREE.MeshStandardMaterial({ color: 0xf8faf7, roughness: 0.38, metalness: 0.05 }));
    const postGeo = track(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12));
    const barGeo = track(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 12));
    const netMat = track(new THREE.LineBasicMaterial({ color: 0xe5ece7, transparent: true, opacity: 0.52, depthWrite: false }));
    for (const side of [-1, 1]) {
      const gx = side * 9;
      const backX = gx + side * 0.48;
      for (const z of [-0.6, 0.6]) {
        const post = new THREE.Mesh(postGeo, goalMat);
        post.position.set(gx, 0.25, z);
        post.castShadow = true;
        scene.add(post);
      }
      for (const [x, y] of [[gx, 0.5], [backX, 0.42], [backX, 0.025]]) {
        const bar = new THREE.Mesh(barGeo, goalMat);
        bar.rotation.x = Math.PI / 2;
        bar.position.set(x, y, 0);
        scene.add(bar);
      }
      for (const z of [-0.6, 0.6]) {
        const start = new THREE.Vector3(gx, 0.5, z);
        const end = new THREE.Vector3(backX, 0.42, z);
        const rail = new THREE.Mesh(track(new THREE.CylinderGeometry(0.018, 0.018, start.distanceTo(end), 10)), goalMat);
        rail.position.copy(start).lerp(end, 0.5);
        rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
        scene.add(rail);
      }

      const netPoints: number[] = [];
      const segment = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
        netPoints.push(ax, ay, az, bx, by, bz);
      };
      for (let i = 0; i <= 12; i += 1) {
        const z = -0.6 + i * 0.1;
        segment(backX, 0.025, z, backX, 0.42, z);
        segment(gx, 0.5, z, backX, 0.42, z);
      }
      for (let i = 0; i <= 6; i += 1) {
        const t = i / 6;
        const y = 0.025 + t * 0.395;
        segment(backX, y, -0.6, backX, y, 0.6);
        const roofY = THREE.MathUtils.lerp(0.5, 0.42, t);
        segment(THREE.MathUtils.lerp(gx, backX, t), roofY, -0.6, THREE.MathUtils.lerp(gx, backX, t), roofY, 0.6);
      }
      for (const z of [-0.6, 0.6]) {
        for (let i = 1; i < 6; i += 1) {
          const t = i / 6;
          const x = THREE.MathUtils.lerp(gx, backX, t);
          segment(x, 0.025, z, x, THREE.MathUtils.lerp(0.5, 0.42, t), z);
        }
        for (let i = 1; i < 6; i += 1) {
          const t = i / 6;
          segment(gx, t * 0.5, z, backX, t * 0.42, z);
        }
      }
      const netGeo = track(new THREE.BufferGeometry());
      netGeo.setAttribute("position", new THREE.Float32BufferAttribute(netPoints, 3));
      scene.add(new THREE.LineSegments(netGeo, netMat));
    }

    /* --- low-poly grandstands: concrete terraces, dark seat rows, slim canopies --- */
    const standMat = track(new THREE.MeshStandardMaterial({ color: 0xc8d1c5, roughness: 0.9, metalness: 0 }));
    const seatMat = track(new THREE.MeshStandardMaterial({ color: 0x536c5b, roughness: 0.86, metalness: 0 }));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: 0xe8ede5, roughness: 0.58, metalness: 0.08 }));
    const rimMat = track(new THREE.MeshStandardMaterial({ color: FLOOD, roughness: 0.72, metalness: 0 }));
    const boxGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const crowdPositions: number[] = [];
    const crowdColors: number[] = [];
    const crowdPalette = [new THREE.Color(0x6f8073), new THREE.Color(0xe9ede6), new THREE.Color(0x9aa89b), ICE, SIGNAL];
    const addStand = (cx: number, cz: number, length: number, rotY: number) => {
      const stand = new THREE.Group();
      for (let tier = 0; tier < 5; tier += 1) {
        const height = 0.42 + tier * 0.55;
        const width = length + tier * 0.8;
        const terrace = new THREE.Mesh(boxGeo, standMat);
        terrace.scale.set(width, height, 1.15);
        terrace.position.set(0, height / 2, tier * 0.92);
        terrace.receiveShadow = true;
        stand.add(terrace);
        const seats = new THREE.Mesh(boxGeo, seatMat);
        seats.scale.set(width - 0.35, 0.065, 0.44);
        seats.position.set(0, height + 0.035, tier * 0.92 - 0.15);
        stand.add(seats);

        const count = Math.round(length * 5);
        for (let i = 0; i < count; i += 1) {
          const x = (Math.random() - 0.5) * (width - 0.6);
          const local = new THREE.Vector3(x, height + 0.13 + Math.random() * 0.04, tier * 0.92 - 0.15 + (Math.random() - 0.5) * 0.3);
          crowdPositions.push(local.x, local.y, local.z, cx, cz, rotY);
          const color = Math.random() < 0.9 ? crowdPalette[Math.floor(Math.random() * 3)] : crowdPalette[3 + Math.floor(Math.random() * 2)];
          crowdColors.push(color.r, color.g, color.b);
        }
      }
      const roof = new THREE.Mesh(boxGeo, roofMat);
      roof.scale.set(length + 4.2, 0.12, 3.6);
      roof.position.set(0, 4.05, 3.15);
      roof.rotation.x = -0.07;
      stand.add(roof);
      const fascia = new THREE.Mesh(boxGeo, rimMat);
      fascia.scale.set(length + 4.2, 0.16, 0.08);
      fascia.position.set(0, 3.98, 1.37);
      stand.add(fascia);
      for (const x of [-length * 0.42, length * 0.42]) {
        const support = new THREE.Mesh(boxGeo, roofMat);
        support.scale.set(0.09, 3.9, 0.09);
        support.position.set(x, 1.95, 4.35);
        stand.add(support);
      }
      stand.position.set(cx, 0, cz);
      stand.rotation.y = rotY;
      scene.add(stand);
    };
    addStand(0, -7.6, 21, Math.PI);
    addStand(0, 7.6, 21, 0);
    addStand(-11.6, 0, 13, -Math.PI / 2);
    addStand(11.6, 0, 13, Math.PI / 2);
    {
      const positions = new Float32Array((crowdPositions.length / 6) * 3);
      const tmp = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      for (let i = 0, j = 0; i < crowdPositions.length; i += 6, j += 3) {
        tmp.set(crowdPositions[i], crowdPositions[i + 1], crowdPositions[i + 2]);
        tmp.applyAxisAngle(up, crowdPositions[i + 5]);
        positions[j] = tmp.x + crowdPositions[i + 3];
        positions[j + 1] = tmp.y;
        positions[j + 2] = tmp.z + crowdPositions[i + 4];
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(crowdColors, 3));
      const crowd = new THREE.Points(
        geo,
        track(new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.62, blending: THREE.NormalBlending, depthWrite: false })),
      );
      scene.add(crowd);
    }

    /* --- unlit floodlight hardware, instanced to keep the daylight scene cheap --- */
    const pylonMat = track(new THREE.MeshStandardMaterial({ color: 0x78877d, roughness: 0.68, metalness: 0.24 }));
    const lampMat = track(new THREE.MeshStandardMaterial({ color: 0xdde4df, roughness: 0.42, metalness: 0.18 }));
    const lampGeo = track(new THREE.BoxGeometry(0.32, 0.22, 0.06));
    const lampMatrix = new THREE.Matrix4();
    towers.forEach((pos) => {
      const pylon = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.14, pos.y, 8)), pylonMat);
      pylon.position.set(pos.x * 1.04, pos.y / 2, pos.z * 1.04);
      scene.add(pylon);
      const head = new THREE.Group();
      const frame = new THREE.Mesh(boxGeo, pylonMat);
      frame.scale.set(1.95, 0.86, 0.09);
      frame.position.z = 0.05;
      head.add(frame);
      const lamps = new THREE.InstancedMesh(lampGeo, lampMat, 15);
      let lampIndex = 0;
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 5; c += 1) {
          lampMatrix.makeTranslation((c - 2) * 0.38, (r - 1) * 0.28, -0.01);
          lamps.setMatrixAt(lampIndex, lampMatrix);
          lampIndex += 1;
        }
      }
      head.add(lamps);
      head.position.copy(pos);
      head.lookAt(0, 0, 0);
      scene.add(head);
    });

    const glowMap = track(glowTexture());

    /* --- players --- */
    const teamOf = (teamId: string | null): "home" | "away" | null =>
      teamId === homeTeam.team_id ? "home" : teamId === awayTeam.team_id ? "away" : null;
    const colorOf = (team: "home" | "away" | null) => (team === "home" ? ICE : team === "away" ? SIGNAL : FLOOD);

    const playerStats = new Map<string, { team: "home" | "away"; count: number; sx: number; sy: number }>();
    for (const ev of events) {
      const team = teamOf(ev.team_id);
      if (!ev.player_id || !team) continue;
      const stat = playerStats.get(ev.player_id) ?? { team, count: 0, sx: 0, sy: 0 };
      stat.count += 1;
      stat.sx += ev.location.x;
      stat.sy += ev.location.y;
      playerStats.set(ev.player_id, stat);
    }
    const perTeam = { home: 0, away: 0 };
    const roster = [...playerStats.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .filter(([, stat]) => {
        if (perTeam[stat.team] >= 11) return false;
        perTeam[stat.team] += 1;
        return true;
      });

    const bodyGeo = track(playerKitGeometry());
    const baseGeo = track(playerBaseGeometry());
    const bandGeo = track(new THREE.TorusGeometry(0.129, 0.004, 6, 32));
    const ringGeo = track(new THREE.RingGeometry(0.2, 0.245, 40));
    const glowGeo = track(new THREE.PlaneGeometry(1, 1));
    const bodyMats = {
      home: track(new THREE.MeshStandardMaterial({ color: ICE, roughness: 0.46, metalness: 0.06 })),
      away: track(new THREE.MeshStandardMaterial({ color: SIGNAL, roughness: 0.46, metalness: 0.06 })),
    };
    const baseMats = {
      home: track(new THREE.MeshStandardMaterial({ color: ICE.clone().multiplyScalar(0.72), roughness: 0.58, metalness: 0.04 })),
      away: track(new THREE.MeshStandardMaterial({ color: SIGNAL.clone().multiplyScalar(0.72), roughness: 0.58, metalness: 0.04 })),
    };
    const bandMats = {
      home: track(new THREE.MeshStandardMaterial({ color: ICE.clone().multiplyScalar(0.9), roughness: 0.5, metalness: 0.05 })),
      away: track(new THREE.MeshStandardMaterial({ color: SIGNAL.clone().multiplyScalar(0.9), roughness: 0.5, metalness: 0.05 })),
    };
    const figures = new Map<string, Figure>();
    roster.forEach(([pid, stat]) => {
      const color = colorOf(stat.team);
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMats[stat.team]);
      body.castShadow = true;
      const base = new THREE.Mesh(baseGeo, baseMats[stat.team]);
      const band = new THREE.Mesh(bandGeo, bandMats[stat.team]);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.063;
      const ring = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false })));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.012;
      const glow = new THREE.Mesh(glowGeo, track(new THREE.MeshBasicMaterial({ map: glowMap, color, transparent: true, opacity: 0.12, blending: THREE.NormalBlending, depthWrite: false })));
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.01;
      glow.scale.setScalar(0.9);
      group.add(base, body, band, ring, glow);
      const avg = toWorld(stat.sx / stat.count, stat.sy / stat.count);
      group.position.copy(avg);
      scene.add(group);
      figures.set(pid, { group, ring, glow, band, body, target: avg.clone(), team: stat.team });
    });
    const averages = new Map(roster.map(([pid, s]) => [pid, toWorld(s.sx / s.count, s.sy / s.count)]));

    /* --- ball + trail --- */
    const ball = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.07, 24, 18)),
      track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })),
    );
    ball.castShadow = true;
    scene.add(ball);
    const TRAIL = 42;
    const trailMesh = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(0.05, 10, 8)),
      track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.NormalBlending, depthWrite: false, toneMapped: false })),
      TRAIL,
    );
    trailMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(TRAIL * 3), 3);
    trailMesh.frustumCulled = false;
    scene.add(trailMesh);
    const trailHistory: THREE.Vector3[] = [];

    /* --- dynamic layers --- */
    const eventsLayer = new THREE.Group();
    const laneLayer = new THREE.Group();
    const pressureLayer = new THREE.Group();
    const breakLayer = new THREE.Group();
    scene.add(eventsLayer, laneLayer, pressureLayer, breakLayer);
    const dynamic: { dispose: () => void }[] = [];
    const dyn = <T extends { dispose: () => void }>(item: T): T => {
      dynamic.push(item);
      return item;
    };

    const heatUniforms = {
      uHeat: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
      uCount: { value: 0 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uHot: { value: SIGNAL.clone().multiplyScalar(1.3) },
      uWarm: { value: FLOOD.clone().multiplyScalar(1.6) },
    };
    const heat = new THREE.Mesh(
      track(new THREE.PlaneGeometry(18, 11)),
      track(new THREE.ShaderMaterial({ uniforms: heatUniforms, vertexShader: ribbonVertex, fragmentShader: heatFragment, transparent: true, depthWrite: false, blending: THREE.NormalBlending })),
    );
    heat.rotation.x = -Math.PI / 2;
    heat.position.y = 0.02;
    pressureLayer.add(heat);
    const pulseRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        track(new THREE.RingGeometry(0.92, 1, 64)),
        track(new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending })),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      pressureLayer.add(ring);
      pulseRings.push(ring);
    }

    const ribbonUniforms = {
      uColor: { value: ICE.clone().multiplyScalar(1.4) },
      uTime: { value: 0 },
      uProgress: { value: 1 },
      uOpacity: { value: 1 },
    };
    const ribbonMat = track(new THREE.ShaderMaterial({ uniforms: ribbonUniforms, vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide }));
    const floorUniforms = {
      uColor: { value: ICE.clone() },
      uTime: { value: 0 },
      uProgress: { value: 1 },
      uOpacity: { value: 0.5 },
    };
    const floorMat = track(new THREE.ShaderMaterial({ uniforms: floorUniforms, vertexShader: ribbonVertex, fragmentShader: laneFloorFragment, transparent: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide }));
    const sweepUniforms = { uColor: { value: FLOOD.clone().multiplyScalar(1.5) }, uOpacity: { value: 0 }, uTime: { value: 0 } };
    const sweep = new THREE.Mesh(
      track(new THREE.PlaneGeometry(11.4, 1.6)),
      track(new THREE.ShaderMaterial({ uniforms: sweepUniforms, vertexShader: ribbonVertex, fragmentShader: sweepFragment, transparent: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide })),
    );
    sweep.rotation.y = Math.PI / 2;
    sweep.position.y = 0.8;
    breakLayer.add(sweep);
    const breakLine = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.05, 11)),
      track(new THREE.MeshBasicMaterial({ color: FLOOD.clone().multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.NormalBlending })),
    );
    breakLine.rotation.x = -Math.PI / 2;
    breakLine.position.y = 0.025;
    breakLayer.add(breakLine);

    let lane: { curve: THREE.QuadraticBezierCurve3; start: THREE.Vector3; end: THREE.Vector3 } | null = null;
    let breakX = { from: 0, to: 0 };
    let activePlayer: string | null = null;
    let ballAnim = { from: new THREE.Vector3(), to: new THREE.Vector3(), curve: null as THREE.QuadraticBezierCurve3 | null, t0: 0, dur: 0.9 };
    let pressureOrigin = new THREE.Vector3();
    let pressureLevel = 0;

    const clearDynamic = () => {
      for (const group of [eventsLayer, laneLayer]) {
        for (const child of [...group.children]) group.remove(child);
      }
      dynamic.splice(0).forEach((item) => item.dispose());
    };

    const passCurve = (start: THREE.Vector3, end: THREE.Vector3, lift: number) => {
      const mid = start.clone().lerp(end, 0.5);
      mid.y += lift;
      return new THREE.QuadraticBezierCurve3(start, mid, end);
    };

    const updateMoment = (now: number) => {
      const index = cursorRef.current;
      const current = events[index];
      if (!current) return;
      clearDynamic();

      /* players: last-known positions inside a rolling window */
      const windowStart = Math.max(0, index - 90);
      const known = new Map<string, THREE.Vector3>();
      for (let i = windowStart; i <= index; i += 1) {
        const ev = events[i];
        if (ev.player_id) known.set(ev.player_id, toWorld(ev.location.x, ev.location.y));
        if (ev.recipient_id && ev.end_location) known.set(ev.recipient_id, toWorld(ev.end_location.x, ev.end_location.y));
      }
      figures.forEach((figure, pid) => {
        const pos = known.get(pid) ?? averages.get(pid)!;
        // gentle deterministic spread so stale players do not stack
        const seed = [...pid].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const jitter = known.has(pid) ? 0 : 0.35;
        figure.target.set(pos.x + Math.sin(seed) * jitter, 0, pos.z + Math.cos(seed * 1.7) * jitter);
      });
      activePlayer = current.player_id;
      if (current.player_id && figures.has(current.player_id)) {
        figures.get(current.player_id)!.target.copy(toWorld(current.location.x, current.location.y));
      }

      /* events layer: recent actions as faint arcs + glowing footprints */
      const trailEvents = events.slice(Math.max(0, index - 10), index + 1);
      trailEvents.forEach((ev, i) => {
        const isCurrent = ev.event_id === current.event_id;
        const color = colorOf(teamOf(ev.team_id));
        const fade = 0.25 + (i / trailEvents.length) * 0.75;
        const start = toWorld(ev.location.x, ev.location.y, 0.03);
        const dot = new THREE.Mesh(
          glowGeo,
          dyn(new THREE.MeshBasicMaterial({ map: glowMap, color: color.clone().multiplyScalar(isCurrent ? 2 : 1.1), transparent: true, opacity: fade, blending: THREE.NormalBlending, depthWrite: false, toneMapped: false })),
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.copy(start);
        dot.scale.setScalar(isCurrent ? 0.9 : 0.45);
        eventsLayer.add(dot);
        if (ev.end_location && !isCurrent) {
          const end = toWorld(ev.end_location.x, ev.end_location.y, 0.03);
          const curve = passCurve(start, end, Math.min(0.9, 0.15 + start.distanceTo(end) * 0.08));
          const tube = new THREE.Mesh(
            dyn(new THREE.TubeGeometry(curve, 40, 0.011, 6, false)),
            dyn(new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.4), transparent: true, opacity: fade * 0.55, blending: THREE.NormalBlending, depthWrite: false, toneMapped: false })),
          );
          eventsLayer.add(tube);
        }
      });

      /* lane: the current pass as an ice ribbon + floor corridor */
      lane = null;
      if (current.end_location) {
        const start = toWorld(current.location.x, current.location.y, 0.06);
        const end = toWorld(current.end_location.x, current.end_location.y, 0.06);
        const dist = start.distanceTo(end);
        const curve = passCurve(start, end, Math.min(1.5, 0.3 + dist * 0.16));
        lane = { curve, start, end };
        const color = teamOf(current.team_id) === "away" ? SIGNAL : ICE;
        ribbonUniforms.uColor.value.copy(color).multiplyScalar(1.4);
        floorUniforms.uColor.value.copy(color);
        laneLayer.add(new THREE.Mesh(dyn(new THREE.TubeGeometry(curve, 96, 0.035, 10, false)), ribbonMat));
        // floor corridor
        const corridor = new THREE.Mesh(dyn(new THREE.PlaneGeometry(dist, 0.9)), floorMat);
        corridor.rotation.x = -Math.PI / 2;
        corridor.rotation.z = -Math.atan2(end.z - start.z, end.x - start.x);
        corridor.position.copy(start.clone().lerp(end, 0.5)).setY(0.022);
        laneLayer.add(corridor);
        const beacon = new THREE.Mesh(
          dyn(new THREE.RingGeometry(0.22, 0.3, 48)),
          dyn(new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.2), transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })),
        );
        beacon.rotation.x = -Math.PI / 2;
        beacon.position.copy(end).setY(0.03);
        laneLayer.add(beacon);
        // line-break sweep position: from passer to just beyond the midpoint
        breakX = { from: start.x, to: start.x + (end.x - start.x) * 0.55 };
        ballAnim = { from: start, to: end, curve, t0: now, dur: Math.min(1.3, 0.45 + dist * 0.12) };
      } else {
        const p = toWorld(current.location.x, current.location.y, 0.07);
        ballAnim = { from: ball.position.clone(), to: p, curve: null, t0: now, dur: 0.5 };
      }

      /* pressure: heat field from recent pressure, pulse at the latest presser */
      const heatEvents = events
        .slice(Math.max(0, index - 14), index + 1)
        .filter((ev) => ev.type === "pressure" || ev.pressure >= 0.55)
        .slice(-16);
      heatEvents.forEach((ev, i) => {
        const w = toWorld(ev.location.x, ev.location.y);
        heatUniforms.uHeat.value[i].set(w.x, w.z, ev.pressure, 0.4 + (i / heatEvents.length) * 0.6);
      });
      heatUniforms.uCount.value = heatEvents.length;
      const presser = [...heatEvents].reverse().find((ev) => ev.type === "pressure") ?? current;
      pressureOrigin = toWorld(presser.location.x, presser.location.y, 0.03);
      pressureLevel = Math.max(presser.pressure, current.pressure);
      pulseRings.forEach((ring) => ring.position.set(pressureOrigin.x, 0.03, pressureOrigin.z));
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = (variant === "hero" ? 36 : 38) * (camera.aspect < 1 ? 1.45 : 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    /* --- pointer parallax --- */
    const pointer = new THREE.Vector2();
    const pointerSmooth = new THREE.Vector2();
    const onPointer = (event: PointerEvent) => {
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* --- camera rigs --- */
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const tmpPos = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();
    const storyKeys = () => {
      const ev = events[anchorRef.current] ?? events[cursorRef.current];
      const s = toWorld(ev.location.x, ev.location.y);
      const e = ev.end_location ? toWorld(ev.end_location.x, ev.end_location.y) : s.clone().add(new THREE.Vector3(3, 0, 0));
      const dir = e.clone().sub(s).setY(0).normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      const mid = s.clone().lerp(e, 0.5);
      return [
        { p: new THREE.Vector3(-11, 9.5, 14), l: new THREE.Vector3(0, 0, 0) },
        { p: new THREE.Vector3(mid.x - 1, 8.4, 11.5), l: new THREE.Vector3(mid.x * 0.6, 0, 0.4) },
        { p: s.clone().add(side.clone().multiplyScalar(5.2)).add(dir.clone().multiplyScalar(-2.5)).setY(3.6), l: s.clone().setY(0.2) },
        { p: s.clone().add(dir.clone().multiplyScalar(-4.4)).add(side.clone().multiplyScalar(2.2)).setY(2.5), l: e.clone().lerp(s, 0.25).setY(0.2) },
        { p: s.clone().add(dir.clone().multiplyScalar(-6.5)).add(side.clone().multiplyScalar(-1.2)).setY(4.2), l: e.clone().lerp(s, 0.1).setY(0.3) },
      ];
    };

    const rig = (elapsed: number, ballPos: THREE.Vector3) => {
      pointerSmooth.lerp(pointer, 0.04);
      if (variant === "hero") {
        const angle = -0.62 + Math.sin(elapsed * 0.05) * 0.32;
        const radius = 14.5;
        tmpPos.set(Math.sin(angle) * radius * 1.05, 6.4 + Math.sin(elapsed * 0.2) * 0.35, Math.cos(angle) * radius * 0.92);
        tmpPos.x += pointerSmooth.x * 1.2;
        tmpPos.y -= pointerSmooth.y * 0.7;
        tmpLook.set(1.2, 0, -0.6);
      } else if (variant === "story") {
        const keys = storyKeys();
        const s = Math.max(0, Math.min(4, stageRef.current));
        const i = Math.min(3, Math.floor(s));
        const t = smooth(0, 1, s - i);
        tmpPos.copy(keys[i].p).lerp(keys[i + 1].p, t);
        tmpLook.copy(keys[i].l).lerp(keys[i + 1].l, t);
        tmpPos.x += pointerSmooth.x * 0.5 + Math.sin(elapsed * 0.3) * 0.15;
        tmpPos.y -= pointerSmooth.y * 0.3;
      } else {
        const mode = variant === "broadcast" ? "broadcast" : cameraModeRef.current;
        if (mode === "tactical") {
          tmpPos.set(0, 17.5, 0.6);
          tmpLook.set(0, 0, 0);
        } else if (mode === "press") {
          tmpPos.set(ballPos.x - 3.4, 2.6, ballPos.z + 4.2);
          tmpLook.copy(ballPos).setY(0.3);
        } else {
          tmpPos.set(ballPos.x * 0.35 + Math.sin(elapsed * 0.12) * 0.4, 8.2, 11.2);
          tmpLook.set(ballPos.x * 0.45, 0, ballPos.z * 0.2);
        }
      }
    };

    /* --- loop --- */
    let animation = 0;
    let inView = true;
    let disposed = false;
    let previousCursor = -1;
    let last = performance.now();
    const started = last;
    const tmpMatrix = new THREE.Matrix4();
    const tmpColor = new THREE.Color();
    const tmpVec = new THREE.Vector3();
    let firstFrame = true;

    const animate = (time: number) => {
      animation = 0;
      if (disposed || document.hidden || !inView) return;
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const elapsed = (time - started) / 1000;
      if (previousCursor !== cursorRef.current) {
        previousCursor = cursorRef.current;
        updateMoment(elapsed);
      }

      /* layer weights per variant */
      const current = events[cursorRef.current];
      const isBreak = Boolean(current?.tags?.includes("line_break"));
      let wEvents = 1;
      let wPressure = 1;
      let wLane = 1;
      let laneProgress = 1;
      let wBreak = isBreak ? 1 : 0;
      let breakProgress = 1;
      if (variant === "hero") {
        wEvents = 0.7;
      } else if (variant === "story") {
        const s = stageRef.current;
        wEvents = smooth(0.0, 0.45, s) * (1 - 0.5 * smooth(2.5, 3.5, s));
        wPressure = smooth(1.0, 1.45, s) * (1 - 0.65 * smooth(2.6, 3.4, s));
        wLane = smooth(2.0, 2.35, s);
        laneProgress = smooth(2.0, 2.85, s);
        wBreak = smooth(3.0, 3.35, s) * (isBreak ? 1 : 0.6);
        breakProgress = smooth(3.0, 3.9, s);
      }
      eventsLayer.visible = wEvents > 0.01;
      eventsLayer.children.forEach((child) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (!mat.userData.base) mat.userData.base = mat.opacity;
        mat.opacity = mat.userData.base * wEvents;
      });

      heatUniforms.uTime.value = elapsed;
      heatUniforms.uOpacity.value = wPressure * (0.48 + 0.12 * Math.sin(elapsed * 2.4));
      pressureLayer.visible = wPressure > 0.01;
      pulseRings.forEach((ring, i) => {
        const phase = (elapsed * 0.55 + i / 3) % 1;
        const radius = 0.35 + phase * (0.9 + pressureLevel * 1.6);
        ring.scale.setScalar(radius);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.85 * wPressure * (0.4 + pressureLevel * 0.6);
      });

      ribbonUniforms.uTime.value = elapsed;
      ribbonUniforms.uOpacity.value = wLane;
      ribbonUniforms.uProgress.value = laneProgress;
      floorUniforms.uTime.value = elapsed;
      floorUniforms.uOpacity.value = 0.45 * wLane;
      floorUniforms.uProgress.value = laneProgress;
      laneLayer.visible = wLane > 0.01 && lane !== null;

      breakLayer.visible = wBreak > 0.01 && lane !== null;
      if (breakLayer.visible) {
        const x = THREE.MathUtils.lerp(breakX.from, breakX.to, breakProgress);
        sweep.position.x = x;
        breakLine.position.x = breakX.to;
        const flash = Math.sin(Math.min(1, breakProgress) * Math.PI);
        sweepUniforms.uOpacity.value = wBreak * (0.22 + flash * 0.5);
        sweepUniforms.uTime.value = elapsed;
        (breakLine.material as THREE.MeshBasicMaterial).opacity = wBreak * smooth(0.6, 1, breakProgress) * 0.8;
      }

      /* ball */
      const t = Math.min(1, (elapsed - ballAnim.t0) / ballAnim.dur);
      const eased = 1 - Math.pow(1 - t, 3);
      if (variant === "story" && ballAnim.curve) {
        // In the story, the ball follows the reveal of the lane rather than the clock.
        const p = wLane > 0.01 ? laneProgress : 0;
        ballAnim.curve.getPoint(p, tmpVec);
        ball.position.copy(tmpVec).setY(tmpVec.y + 0.04);
      } else if (ballAnim.curve) {
        ballAnim.curve.getPoint(eased, tmpVec);
        ball.position.copy(tmpVec).setY(tmpVec.y + 0.04);
      } else {
        ball.position.lerpVectors(ballAnim.from, ballAnim.to, eased);
      }
      if (firstFrame) {
        // seed the trail at the ball position so it does not streak from origin
        trailHistory.length = 0;
      }
      const lastPoint = trailHistory[0];
      if (!lastPoint || lastPoint.distanceToSquared(ball.position) > 0.0004) {
        trailHistory.unshift(ball.position.clone());
        if (trailHistory.length > TRAIL) trailHistory.pop();
      } else if (trailHistory.length > 1) {
        trailHistory.pop();
      }
      for (let i = 0; i < TRAIL; i += 1) {
        const p = trailHistory[i];
        const k = 1 - i / TRAIL;
        if (p) {
          tmpMatrix.makeScale(k * 0.9, k * 0.9, k * 0.9).setPosition(p);
          tmpColor.copy(FLOOD).multiplyScalar(k * k * 1.6);
        } else {
          tmpMatrix.makeScale(0, 0, 0);
          tmpColor.setRGB(0, 0, 0);
        }
        trailMesh.setMatrixAt(i, tmpMatrix);
        trailMesh.setColorAt(i, tmpColor);
      }
      trailMesh.instanceMatrix.needsUpdate = true;
      if (trailMesh.instanceColor) trailMesh.instanceColor.needsUpdate = true;

      /* players */
      const damp = firstFrame ? 1 : 1 - Math.exp(-dt * 3.2);
      figures.forEach((figure, pid) => {
        figure.group.position.lerp(figure.target, damp);
        const active = pid === activePlayer;
        const pulse = active ? 1.25 + Math.sin(elapsed * 5) * 0.12 : 1;
        figure.ring.scale.setScalar(pulse);
        (figure.glow.material as THREE.MeshBasicMaterial).opacity = active ? 0.38 : 0.1;
        figure.glow.scale.setScalar(active ? 1.35 : 0.9);
      });

      /* camera */
      rig(elapsed, ball.position);
      const k = firstFrame ? 1 : 1 - Math.exp(-dt * (variant === "story" ? 4 : 2.4));
      camPos.lerp(tmpPos, k);
      camLook.lerp(tmpLook, k);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      /* floating player tag */
      const tag = tagRef.current;
      if (tag) {
        const fig = activePlayer ? figures.get(activePlayer) : undefined;
        if (fig && current) {
          tmpVec.copy(fig.group.position).setY(0.85).project(camera);
          const visible = tmpVec.z < 1 && Math.abs(tmpVec.x) < 1.1 && Math.abs(tmpVec.y) < 1.1;
          const x = (tmpVec.x * 0.5 + 0.5) * container.clientWidth;
          const y = (-tmpVec.y * 0.5 + 0.5) * container.clientHeight;
          tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
          tag.style.opacity = visible ? "1" : "0";
          const playerId = current.player_id ?? "";
          const publicLabel = playerLabelsRef.current?.[playerId] ?? playerId;
          const action = current.type.replaceAll("_", " ");
          const label = variant === "focus" ? publicLabel : [publicLabel, action].filter(Boolean).join(" · ");
          if (tag.dataset.label !== label) {
            const team = teamOf(current.team_id);
            const teamColor = team === "home" ? "#167C9F" : team === "away" ? "#CF6048" : null;
            tag.dataset.label = label;
            tag.textContent = label;
            tag.dataset.team = team ?? "neutral";
            tag.style.color = "var(--text)";
            tag.style.borderColor = teamColor ?? "";
            tag.style.boxShadow = teamColor ? `inset 2px 0 0 ${teamColor}` : "none";
          }
        } else {
          tag.style.opacity = "0";
        }
      }

      renderer.render(scene, camera);
      firstFrame = false;
      animation = requestAnimationFrame(animate);
    };

    const resume = () => {
      if (!disposed && inView && !document.hidden && animation === 0) {
        last = performance.now();
        animation = requestAnimationFrame(animate);
      }
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) {
        cancelAnimationFrame(animation);
        animation = 0;
      } else {
        resume();
      }
    }, { rootMargin: "120px" });
    visibilityObserver.observe(container);
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animation);
        animation = 0;
      } else {
        resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    resume();

    return () => {
      disposed = true;
      cancelAnimationFrame(animation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointer);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      clearDynamic();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [events, homeTeam.team_id, awayTeam.team_id, reduceMotion, variant]);

  if (reduceMotion || failed) {
    return <Pitch events={events} cursor={cursor} home={homeTeam} away={awayTeam} playerLabels={playerLabels} />;
  }
  return (
    <div className={`match-scene match-scene-${variant}`} ref={mount} role="img" aria-label="Interactive three-dimensional match structure">
      <div className="scene-tag" ref={tagRef} aria-hidden="true" />
      {variant === "focus" && (
        <div className="camera-mode-bar" aria-label="3D camera angle">
          {([
            { id: "broadcast", label: "TV cam" },
            { id: "tactical", label: "Top-down" },
            { id: "press", label: "Press POV" },
          ] as const).map((cam) => (
            <button
              key={cam.id}
              type="button"
              className={cameraMode === cam.id ? "active" : ""}
              onClick={() => setCameraMode(cam.id)}
            >
              {cam.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
