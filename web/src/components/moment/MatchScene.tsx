import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
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
};

const FALLBACK_HOME = { team_id: "home", name: "Home", short_name: "HOM", color: "#5CC8FF", venue: "" };
const FALLBACK_AWAY = { team_id: "away", name: "Away", short_name: "AWY", color: "#FF4D2E", venue: "" };

const ICE = new THREE.Color("#5CC8FF");
const SIGNAL = new THREE.Color("#FF4D2E");
const FLOOD = new THREE.Color("#FFE3B3");
const INK = new THREE.Color("#05060A");

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
  ctx.fillStyle = "#0b1414";
  ctx.fillRect(0, 0, W, H);
  // mowing stripes
  const stripes = 14;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#132423" : "#0f1d1c";
    ctx.fillRect(u(-9 - 0.6) + (i * (19.2 * PX)) / stripes, v(-6.1), (19.2 * PX) / stripes + 1, 12.2 * PX);
  }
  // fine grain
  const grain = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);
  // markings
  ctx.strokeStyle = "rgba(235,240,245,0.62)";
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

const beamVertex = /* glsl */ `
  varying float vH; varying vec3 vN; varying vec3 vV;
  void main() {
    vH = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }`;
const beamFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; uniform float uTime;
  varying float vH; varying vec3 vN; varying vec3 vV;
  void main() {
    float facing = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
    float along = pow(vH, 1.6);
    float shimmer = 0.85 + 0.15 * sin(uTime * 0.7 + vH * 9.0);
    float a = uOpacity * facing * (0.08 + 0.92 * along) * shimmer;
    gl_FragColor = vec4(uColor * a, a);
  }`;

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

function playerProfile(): THREE.Vector2[] {
  const pts: [number, number][] = [
    [0.0, 0.0], [0.15, 0.0], [0.165, 0.02], [0.155, 0.045], [0.1, 0.07], [0.085, 0.13],
    [0.1, 0.27], [0.125, 0.36], [0.12, 0.41], [0.085, 0.445], [0.05, 0.46], [0.0, 0.46],
  ];
  return pts.map(([r, y]) => new THREE.Vector2(r, y));
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
}: MatchSceneProps) {
  const mount = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(cursor);
  const stageRef = useRef(stage);
  const anchorRef = useRef(anchor ?? cursor);
  const cameraModeRef = useRef<CameraMode>("broadcast");
  const [cameraMode, setCameraMode] = useState<CameraMode>("broadcast");
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  const homeTeam = home ?? FALLBACK_HOME;
  const awayTeam = away ?? FALLBACK_AWAY;

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { anchorRef.current = anchor ?? cursor; }, [anchor, cursor]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);

  useEffect(() => {
    if (!mount.current || events.length === 0 || reduceMotion) return;
    const container = mount.current;
    const mobile = window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
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
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.prepend(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const scene = new THREE.Scene();
    scene.background = INK.clone();
    scene.fog = new THREE.FogExp2(INK.getHex(), variant === "hero" ? 0.03 : 0.024);
    const camera = new THREE.PerspectiveCamera(variant === "hero" ? 36 : 38, 1, 0.1, 160);

    /* --- lights --- */
    scene.add(new THREE.HemisphereLight(0x3a4a6a, 0x05060a, 0.55));
    scene.add(new THREE.AmbientLight(0x1a2030, 0.4));
    const towers: THREE.Vector3[] = [
      new THREE.Vector3(-13.5, 9.5, -10),
      new THREE.Vector3(13.5, 9.5, -10),
      new THREE.Vector3(-13.5, 9.5, 10),
      new THREE.Vector3(13.5, 9.5, 10),
    ];
    towers.forEach((pos, index) => {
      const spot = new THREE.SpotLight(0xffe7c4, 70, 0, 0.62, 0.75, 1.5);
      spot.position.copy(pos);
      spot.target.position.set(pos.x * 0.18, 0, pos.z * 0.12);
      scene.add(spot, spot.target);
      if (index < 2 && renderer.shadowMap.enabled) {
        spot.castShadow = true;
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.bias = -0.0004;
        spot.shadow.radius = 4;
        spot.shadow.camera.near = 4;
        spot.shadow.camera.far = 40;
      }
    });

    /* --- ground, pitch --- */
    const ground = new THREE.Mesh(
      track(new THREE.PlaneGeometry(160, 160)),
      track(new THREE.MeshStandardMaterial({ color: 0x07090e, roughness: 0.95, metalness: 0 })),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    const pitchMap = track(pitchTexture());
    const pitch = new THREE.Mesh(
      track(new THREE.PlaneGeometry(20, 13)),
      track(new THREE.MeshPhysicalMaterial({
        map: pitchMap,
        roughness: 0.48,
        metalness: 0.0,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
      })),
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    scene.add(pitch);

    /* --- goals --- */
    const goalMat = track(new THREE.MeshStandardMaterial({ color: 0xf2f4f8, emissive: 0x9aa4b8, emissiveIntensity: 0.35, roughness: 0.3 }));
    const postGeo = track(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 10));
    const barGeo = track(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 10));
    const netMat = track(new THREE.MeshBasicMaterial({ color: 0xcfd6e6, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
    for (const side of [-1, 1]) {
      const gx = side * 9;
      for (const z of [-0.6, 0.6]) {
        const post = new THREE.Mesh(postGeo, goalMat);
        post.position.set(gx, 0.25, z);
        post.castShadow = true;
        scene.add(post);
      }
      const bar = new THREE.Mesh(barGeo, goalMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(gx, 0.5, 0);
      scene.add(bar);
      const net = new THREE.Mesh(track(new THREE.BoxGeometry(0.45, 0.5, 1.2)), netMat);
      net.position.set(gx + side * 0.23, 0.25, 0);
      scene.add(net);
    }

    /* --- stands --- */
    const standMat = track(new THREE.MeshStandardMaterial({ color: 0x0b0e16, roughness: 0.85, metalness: 0.1 }));
    const rimMat = track(new THREE.MeshBasicMaterial({ color: FLOOD.clone().multiplyScalar(1.6), toneMapped: false }));
    const crowdPositions: number[] = [];
    const crowdColors: number[] = [];
    const crowdPalette = [new THREE.Color(0xffe3b3), new THREE.Color(0xffffff), ICE, SIGNAL, new THREE.Color(0x8b7cff)];
    const addStand = (cx: number, cz: number, length: number, rotY: number) => {
      const stand = new THREE.Group();
      for (let tier = 0; tier < 4; tier += 1) {
        const box = new THREE.Mesh(track(new THREE.BoxGeometry(length + tier * 1.4, 0.7 + tier * 0.9, 1.4)), standMat);
        box.position.set(0, (0.7 + tier * 0.9) / 2, tier * 1.25);
        box.receiveShadow = true;
        stand.add(box);
        // crowd lights on each step
        const count = Math.round(length * 9);
        for (let i = 0; i < count; i += 1) {
          const x = (Math.random() - 0.5) * (length + tier * 1.4 - 0.4);
          const local = new THREE.Vector3(x, 0.72 + tier * 0.9 + Math.random() * 0.05, tier * 1.25 + (Math.random() - 0.5) * 1.1);
          crowdPositions.push(local.x, local.y, local.z, cx, cz, rotY);
          const color = Math.random() < 0.82 ? crowdPalette[Math.random() < 0.6 ? 0 : 1] : crowdPalette[2 + Math.floor(Math.random() * 3)];
          crowdColors.push(color.r, color.g, color.b);
        }
      }
      const rim = new THREE.Mesh(track(new THREE.BoxGeometry(length + 4.2, 0.06, 0.06)), rimMat);
      rim.position.set(0, 3.6, 4.4);
      stand.add(rim);
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
      for (let i = 0, j = 0; i < crowdPositions.length; i += 6, j += 3) {
        tmp.set(crowdPositions[i], crowdPositions[i + 1], crowdPositions[i + 2]);
        tmp.applyAxisAngle(new THREE.Vector3(0, 1, 0), crowdPositions[i + 5]);
        positions[j] = tmp.x + crowdPositions[i + 3];
        positions[j + 1] = tmp.y;
        positions[j + 2] = tmp.z + crowdPositions[i + 4];
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(crowdColors, 3));
      const crowd = new THREE.Points(
        geo,
        track(new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      scene.add(crowd);
    }

    /* --- floodlight towers + volumetric beams --- */
    const pylonMat = track(new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.6, metalness: 0.6 }));
    const lampMat = track(new THREE.MeshBasicMaterial({ color: FLOOD.clone().multiplyScalar(5), toneMapped: false }));
    const lampGeo = track(new THREE.BoxGeometry(0.32, 0.22, 0.06));
    const beamMaterials: THREE.ShaderMaterial[] = [];
    towers.forEach((pos) => {
      const pylon = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.14, pos.y, 8)), pylonMat);
      pylon.position.set(pos.x * 1.04, pos.y / 2, pos.z * 1.04);
      scene.add(pylon);
      const head = new THREE.Group();
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 5; c += 1) {
          const lamp = new THREE.Mesh(lampGeo, lampMat);
          lamp.position.set((c - 2) * 0.38, (r - 1) * 0.28, 0);
          head.add(lamp);
        }
      }
      head.position.copy(pos);
      head.lookAt(0, 0, 0);
      scene.add(head);
      // beam cone from the head down to the pitch
      const target = new THREE.Vector3(pos.x * 0.2, 0, pos.z * 0.15);
      const dir = pos.clone().sub(target);
      const length = dir.length();
      const beamMat = track(new THREE.ShaderMaterial({
        uniforms: { uColor: { value: FLOOD.clone() }, uOpacity: { value: 0.16 }, uTime: { value: 0 } },
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }));
      beamMaterials.push(beamMat);
      const beam = new THREE.Mesh(track(new THREE.ConeGeometry(5.2, length, 48, 1, true)), beamMat);
      beam.position.copy(target.clone().add(pos).multiplyScalar(0.5));
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      scene.add(beam);
    });

    /* --- haze particles in the light --- */
    const glowMap = track(glowTexture());
    {
      const count = mobile ? 260 : 620;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 28;
        positions[i * 3 + 1] = Math.random() * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const dust = new THREE.Points(
        geo,
        track(new THREE.PointsMaterial({ size: 0.09, map: glowMap, color: 0xffe9c8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      dust.name = "dust";
      scene.add(dust);
    }

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

    const bodyGeo = track(new THREE.LatheGeometry(playerProfile(), 28));
    const headGeo = track(new THREE.SphereGeometry(0.068, 20, 16));
    const bandGeo = track(new THREE.TorusGeometry(0.112, 0.014, 8, 32));
    const ringGeo = track(new THREE.RingGeometry(0.2, 0.245, 48));
    const glowGeo = track(new THREE.PlaneGeometry(1, 1));
    const bodyMats = {
      home: track(new THREE.MeshPhysicalMaterial({ color: 0x1a2232, roughness: 0.32, metalness: 0.25, clearcoat: 0.8, emissive: ICE, emissiveIntensity: 0.06 })),
      away: track(new THREE.MeshPhysicalMaterial({ color: 0x2a1a1c, roughness: 0.32, metalness: 0.25, clearcoat: 0.8, emissive: SIGNAL, emissiveIntensity: 0.06 })),
    };
    const figures = new Map<string, Figure>();
    roster.forEach(([pid, stat]) => {
      const color = colorOf(stat.team);
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMats[stat.team]);
      body.castShadow = true;
      const headMesh = new THREE.Mesh(headGeo, bodyMats[stat.team]);
      headMesh.position.y = 0.53;
      headMesh.castShadow = true;
      const band = new THREE.Mesh(bandGeo, track(new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.6), toneMapped: false })));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.33;
      const ring = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.2), toneMapped: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.012;
      const glow = new THREE.Mesh(glowGeo, track(new THREE.MeshBasicMaterial({ map: glowMap, color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.01;
      glow.scale.setScalar(0.9);
      group.add(body, headMesh, band, ring, glow);
      const avg = toWorld(stat.sx / stat.count, stat.sy / stat.count);
      group.position.copy(avg);
      scene.add(group);
      figures.set(pid, { group, ring, glow, band, body, target: avg.clone(), team: stat.team });
    });
    const averages = new Map(roster.map(([pid, s]) => [pid, toWorld(s.sx / s.count, s.sy / s.count)]));

    /* --- ball + trail --- */
    const ball = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.07, 24, 18)),
      track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff6e6).multiplyScalar(3), toneMapped: false })),
    );
    ball.castShadow = true;
    scene.add(ball);
    const ballLight = new THREE.PointLight(0xffe3b3, 1.1, 2.2, 2);
    ball.add(ballLight);
    const TRAIL = 42;
    const trailMesh = new THREE.InstancedMesh(
      track(new THREE.SphereGeometry(0.05, 10, 8)),
      track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })),
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
      track(new THREE.ShaderMaterial({ uniforms: heatUniforms, vertexShader: ribbonVertex, fragmentShader: heatFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })),
    );
    heat.rotation.x = -Math.PI / 2;
    heat.position.y = 0.02;
    pressureLayer.add(heat);
    const pulseRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        track(new THREE.RingGeometry(0.92, 1, 64)),
        track(new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })),
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
    const ribbonMat = track(new THREE.ShaderMaterial({ uniforms: ribbonUniforms, vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const floorUniforms = {
      uColor: { value: ICE.clone() },
      uTime: { value: 0 },
      uProgress: { value: 1 },
      uOpacity: { value: 0.5 },
    };
    const floorMat = track(new THREE.ShaderMaterial({ uniforms: floorUniforms, vertexShader: ribbonVertex, fragmentShader: laneFloorFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const sweepUniforms = { uColor: { value: FLOOD.clone().multiplyScalar(1.5) }, uOpacity: { value: 0 }, uTime: { value: 0 } };
    const sweep = new THREE.Mesh(
      track(new THREE.PlaneGeometry(11.4, 1.6)),
      track(new THREE.ShaderMaterial({ uniforms: sweepUniforms, vertexShader: ribbonVertex, fragmentShader: sweepFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })),
    );
    sweep.rotation.y = Math.PI / 2;
    sweep.position.y = 0.8;
    breakLayer.add(sweep);
    const breakLine = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.05, 11)),
      track(new THREE.MeshBasicMaterial({ color: FLOOD.clone().multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })),
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
          dyn(new THREE.MeshBasicMaterial({ map: glowMap, color: color.clone().multiplyScalar(isCurrent ? 2 : 1.1), transparent: true, opacity: fade, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })),
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
            dyn(new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.4), transparent: true, opacity: fade * 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })),
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

    /* --- post-processing --- */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.5, 0.9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloom.resolution.set(width / 2, height / 2);
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
        (figure.glow.material as THREE.MeshBasicMaterial).opacity = active ? 0.85 : 0.3;
        figure.glow.scale.setScalar(active ? 1.5 : 0.9);
      });

      /* atmosphere */
      beamMaterials.forEach((mat, i) => {
        mat.uniforms.uTime.value = elapsed + i * 1.7;
      });
      const dust = scene.getObjectByName("dust");
      if (dust) dust.rotation.y = elapsed * 0.01;

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
          const label = `${current.player_id ?? ""} · ${current.type.replaceAll("_", " ")}`;
          if (tag.dataset.label !== label) {
            tag.dataset.label = label;
            tag.textContent = label;
            tag.dataset.team = teamOf(current.team_id) ?? "neutral";
          }
        } else {
          tag.style.opacity = "0";
        }
      }

      composer.render(dt);
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
      composer.dispose();
      bloom.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [events, homeTeam.team_id, awayTeam.team_id, reduceMotion, variant]);

  if (reduceMotion || failed) {
    return <Pitch events={events} cursor={cursor} home={homeTeam} away={awayTeam} />;
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
