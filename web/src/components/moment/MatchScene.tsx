import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Event, Team } from "../../types";
import Pitch from "../Pitch";

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

function endPosition(event: Event) {
  if (!event.end_location) return null;
  return new THREE.Vector3((event.end_location.x - 50) * 0.18, 0.2, (event.end_location.y - 50) * 0.11);
}

export default function MatchScene({ events, cursor, home, away, variant = "focus" }: MatchSceneProps) {
  const mount = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(cursor);
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  const homeTeam = home ?? FALLBACK_HOME;
  const awayTeam = away ?? FALLBACK_AWAY;

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

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
    scene.fog = new THREE.FogExp2(0x070b0b, 0.025);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const cameraBase = variant === "hero" ? new THREE.Vector3(7.8, 8.4, 10.8) : new THREE.Vector3(0, 11.8, 10.2);
    camera.position.copy(cameraBase);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xdfffea, 0x07100c, 2.4));
    const key = new THREE.DirectionalLight(0xc8ff3d, 2.8);
    key.position.set(-4, 10, 6);
    scene.add(key);

    const pitch = new THREE.Mesh(
      new THREE.BoxGeometry(18.35, 0.16, 11.35),
      new THREE.MeshStandardMaterial({ color: 0x0b1c15, roughness: 0.76, metalness: 0.12 }),
    );
    pitch.position.y = -0.11;
    scene.add(pitch);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8fb49c, transparent: true, opacity: 0.32 });
    const linePoints = [
      [-9, -5.5], [9, -5.5], [9, 5.5], [-9, 5.5], [-9, -5.5],
    ].map(([x, z]) => new THREE.Vector3(x, 0.01, z));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), lineMaterial));
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, -5.5), new THREE.Vector3(0, 0.01, 5.5)]),
      lineMaterial,
    ));
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
      new THREE.SphereGeometry(0.14, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xf0ffd4, emissive: 0xc8ff3d, emissiveIntensity: 1.4 }),
    );
    scene.add(ball);
    const ballLight = new THREE.PointLight(0xc8ff3d, 2.4, 3.2);
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
      const color = current.team_id === awayTeam.team_id ? awayTeam.color : homeTeam.color;
      ball.position.copy(position(current, 0.25));
      clearGroup(trail);
      clearGroup(pressure);
      events.slice(Math.max(0, cursorRef.current - 10), cursorRef.current + 1).forEach((event, index, trailEvents) => {
        const opacity = 0.12 + index / trailEvents.length * 0.65;
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        const start = position(event);
        const end = endPosition(event);
        if (end) trail.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), material));
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(event.event_id === current.event_id ? 0.09 : 0.045, 10, 10),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
        );
        marker.position.copy(start);
        trail.add(marker);
      });
      for (let index = 0; index < 3; index += 1) {
        const radius = 0.55 + current.pressure * (1.3 + index * 0.7);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius, radius + 0.025, 64),
          new THREE.MeshBasicMaterial({ color: current.pressure > 0.65 ? 0xff625f : 0xc8ff3d, transparent: true, opacity: 0.42 - index * 0.1, side: THREE.DoubleSide }),
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
      pressure.scale.setScalar(1 + Math.sin(elapsed * 2.8) * 0.035);
      camera.position.x = cameraBase.x + Math.sin(elapsed * 0.16) * (variant === "hero" ? 0.65 : 0.16);
      camera.lookAt(0, 0, 0);
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
  return <div className={`match-scene match-scene-${variant}`} ref={mount} role="img" aria-label="Interactive three-dimensional match structure" />;
}
