import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Event, Team } from "../../types";
import Pitch from "../Pitch";

export type CameraMode = "broadcast" | "tactical" | "press";

type MatchSceneProps = {
  events: Event[];
  cursor: number;
  home?: Team;
  away?: Team;
  variant?: "hero" | "focus";
};

const FALLBACK_HOME = { team_id: "home", name: "Home", short_name: "HOM", color: "#c8ff3d", venue: "" };
const FALLBACK_AWAY = { team_id: "away", name: "Away", short_name: "AWY", color: "#ff625f", venue: "" };

function position(event: Event, height = 0.16) {
  return new THREE.Vector3((event.location.x - 50) * 0.18, height, (event.location.y - 50) * 0.11);
}

function endPosition(event: Event, height = 0.2) {
  if (!event.end_location) return null;
  return new THREE.Vector3((event.end_location.x - 50) * 0.18, height, (event.end_location.y - 50) * 0.11);
}

export default function MatchScene({ events, cursor, home, away, variant = "focus" }: MatchSceneProps) {
  const mount = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(cursor);
  const cameraModeRef = useRef<CameraMode>("broadcast");
  const [cameraMode, setCameraMode] = useState<CameraMode>("broadcast");
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  const homeTeam = home ?? FALLBACK_HOME;
  const awayTeam = away ?? FALLBACK_AWAY;

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);

  useEffect(() => {
    if (!mount.current || events.length === 0 || reduceMotion) return;
    const container = mount.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b0b, 0.022);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const cameraBase = variant === "hero" ? new THREE.Vector3(7.8, 8.4, 10.8) : new THREE.Vector3(0, 11.8, 10.2);
    camera.position.copy(cameraBase);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xdfffea, 0x07100c, 2.5));
    const key = new THREE.DirectionalLight(0xc8ff3d, 2.9);
    key.position.set(-4, 10, 6);
    scene.add(key);

    const pitch = new THREE.Mesh(
      new THREE.BoxGeometry(18.35, 0.16, 11.35),
      new THREE.MeshStandardMaterial({ color: 0x0b1c15, roughness: 0.74, metalness: 0.14 }),
    );
    pitch.position.y = -0.11;
    scene.add(pitch);

    // Subtle xT tactical zone grid lines on pitch
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xc8ff3d, transparent: true, opacity: 0.07 });
    for (let gx = -6; gx <= 6; gx += 3) {
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(gx, 0.005, -5.5),
            new THREE.Vector3(gx, 0.005, 5.5),
          ]),
          gridMaterial,
        ),
      );
    }
    for (let gz = -2.75; gz <= 2.75; gz += 2.75) {
      if (Math.abs(gz) < 0.01) continue;
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-9, 0.005, gz),
            new THREE.Vector3(9, 0.005, gz),
          ]),
          gridMaterial,
        ),
      );
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8fb49c, transparent: true, opacity: 0.36 });
    const addPolyline = (pts: [number, number, number?][]) => {
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(
            pts.map(([x, z, y]) => new THREE.Vector3(x, y ?? 0.012, z)),
          ),
          lineMaterial,
        ),
      );
    };

    // Outer boundary & halfway line
    addPolyline([[-9, -5.5], [9, -5.5], [9, 5.5], [-9, 5.5], [-9, -5.5]]);
    addPolyline([[0, -5.5], [0, 5.5]]);

    // Left & right penalty areas + 6-yard boxes + goals
    addPolyline([[-9, -3.2], [-6.1, -3.2], [-6.1, 3.2], [-9, 3.2]]);
    addPolyline([[9, -3.2], [6.1, -3.2], [6.1, 3.2], [9, 3.2]]);
    addPolyline([[-9, -1.45], [-7.95, -1.45], [-7.95, 1.45], [-9, 1.45]]);
    addPolyline([[9, -1.45], [7.95, -1.45], [7.95, 1.45], [9, 1.45]]);
    // 3D Goal frames
    const goalMaterial = new THREE.LineBasicMaterial({ color: 0xdfffea, transparent: true, opacity: 0.55 });
    const addGoalFrame = (xSign: number) => {
      const gx = xSign * 9.0;
      const depth = xSign * 9.32;
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(gx, 0.01, -0.75),
            new THREE.Vector3(gx, 0.52, -0.75),
            new THREE.Vector3(gx, 0.52, 0.75),
            new THREE.Vector3(gx, 0.01, 0.75),
            new THREE.Vector3(depth, 0.01, 0.75),
            new THREE.Vector3(depth, 0.52, 0.75),
            new THREE.Vector3(depth, 0.52, -0.75),
            new THREE.Vector3(depth, 0.01, -0.75),
            new THREE.Vector3(gx, 0.01, -0.75),
          ]),
          goalMaterial,
        ),
      );
    };
    addGoalFrame(-1);
    addGoalFrame(1);

    const circle = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: 65 }, (_, index) => {
        const angle = index / 64 * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * 1.5, 0.015, Math.sin(angle) * 1.5);
      })),
      lineMaterial,
    );
    scene.add(circle);

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(
      events.filter((_, index) => index % 18 === 0).flatMap((event) => position(event, 0.03).toArray()), 3,
    ));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x7b9a87, size: 0.035, transparent: true, opacity: 0.42 }));
    scene.add(dust);

    const trail = new THREE.Group();
    scene.add(trail);
    const pressure = new THREE.Group();
    scene.add(pressure);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xf0ffd4, emissive: 0xc8ff3d, emissiveIntensity: 1.5 }),
    );
    scene.add(ball);
    const ballLight = new THREE.PointLight(0xc8ff3d, 2.6, 3.6);
    ball.add(ballLight);

    const clearGroup = (group: THREE.Group) => {
      for (const child of [...group.children]) {
        group.remove(child);
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          const material = child.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      }
    };

    let previousCursor = -1;
    const updateMoment = () => {
      const current = events[cursorRef.current];
      if (!current) return;
      ball.position.copy(position(current, 0.25));
      clearGroup(trail);
      clearGroup(pressure);
      events.slice(Math.max(0, cursorRef.current - 10), cursorRef.current + 1).forEach((event, index, trailEvents) => {
        const isCurrent = event.event_id === current.event_id;
        const opacity = isCurrent ? 0.96 : 0.14 + index / trailEvents.length * 0.62;
        const evColor = event.team_id === awayTeam.team_id ? awayTeam.color : homeTeam.color;
        const material = new THREE.LineBasicMaterial({ color: evColor, transparent: true, opacity });
        const start = position(event, 0.12);
        const end = endPosition(event, 0.14);
        if (end) {
          // 3D Parabolic Bezier Arc for passes/shots
          const dist = start.distanceTo(end);
          const arcHeight = isCurrent ? Math.min(1.65, 0.35 + dist * 0.18) : Math.min(0.85, 0.18 + dist * 0.09);
          const mid = start.clone().lerp(end, 0.5);
          mid.y += arcHeight;
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const curvePoints = curve.getPoints(28);
          trail.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curvePoints), material));

          // Ground shadow projection line for current pass
          if (isCurrent) {
            const shadowMat = new THREE.LineBasicMaterial({ color: evColor, transparent: true, opacity: 0.28 });
            const gStart = position(event, 0.02);
            const gEnd = endPosition(event, 0.02)!;
            trail.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([gStart, gEnd]), shadowMat));
            const targetBeacon = new THREE.Mesh(
              new THREE.RingGeometry(0.16, 0.24, 32),
              new THREE.MeshBasicMaterial({ color: evColor, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
            );
            targetBeacon.rotation.x = -Math.PI / 2;
            targetBeacon.position.copy(gEnd);
            trail.add(targetBeacon);
          }
        }
        const marker = new THREE.Mesh(
          new THREE.CylinderGeometry(isCurrent ? 0.11 : 0.055, isCurrent ? 0.14 : 0.065, isCurrent ? 0.32 : 0.16, 16),
          new THREE.MeshBasicMaterial({ color: evColor, transparent: true, opacity }),
        );
        marker.position.copy(start);
        trail.add(marker);
      });
      for (let index = 0; index < 3; index += 1) {
        const radius = 0.55 + current.pressure * (1.3 + index * 0.7);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius, radius + 0.03, 64),
          new THREE.MeshBasicMaterial({ color: current.pressure > 0.65 ? 0xff625f : 0xc8ff3d, transparent: true, opacity: 0.45 - index * 0.1, side: THREE.DoubleSide }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(position(current, 0.035));
        pressure.add(ring);
      }
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let animation = 0;
    let inView = true;
    let disposed = false;
    const started = performance.now();
    const resume = () => {
      if (!disposed && inView && !document.hidden && animation === 0) {
        animation = requestAnimationFrame(animate);
      }
    };
    const animate = (time: number) => {
      animation = 0;
      if (disposed || document.hidden || !inView) return;
      if (previousCursor !== cursorRef.current) {
        previousCursor = cursorRef.current;
        updateMoment();
      }
      const elapsed = (time - started) / 1000;
      pressure.scale.setScalar(1 + Math.sin(elapsed * 2.8) * 0.038);

      const mode = cameraModeRef.current;
      const current = events[cursorRef.current];
      const ballPos = current ? position(current, 0.15) : new THREE.Vector3(0, 0, 0);

      let targetCam = cameraBase.clone();
      let lookTarget = new THREE.Vector3(0, 0, 0);
      if (mode === "tactical") {
        targetCam = new THREE.Vector3(0, 16.5, 0.8);
      } else if (mode === "press") {
        targetCam = new THREE.Vector3(ballPos.x - 3.2, 4.6, ballPos.z + 4.8);
        lookTarget = ballPos.clone();
      } else {
        targetCam.x = cameraBase.x + Math.sin(elapsed * 0.16) * (variant === "hero" ? 0.65 : 0.18);
      }
      camera.position.lerp(targetCam, 0.08);
      camera.lookAt(lookTarget);
      renderer.render(scene, camera);
      animation = requestAnimationFrame(animate);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) {
        cancelAnimationFrame(animation);
        animation = 0;
      } else {
        resume();
      }
    });
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
      visibilityObserver.disconnect();
      observer.disconnect();
      clearGroup(trail);
      clearGroup(pressure);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose();
          const material = object.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [events, homeTeam.team_id, awayTeam.team_id, homeTeam.color, awayTeam.color, reduceMotion, variant]);

  if (reduceMotion || failed) {
    return <Pitch events={events} cursor={cursor} home={homeTeam} away={awayTeam} />;
  }
  return (
    <div className={`match-scene match-scene-${variant}`} ref={mount} role="img" aria-label="Interactive three-dimensional match structure">
      {variant === "focus" && (
        <div className="camera-mode-bar" aria-label="3D Camera Angle">
          {([
            { id: "broadcast", label: "TV Cam" },
            { id: "tactical", label: "Top-Down xT" },
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
