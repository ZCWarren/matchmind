import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import hero from "./generated/hero.json";

type MatchEvent = (typeof hero.events)[number];

const point = (event: MatchEvent, end = false) => {
  const location = end ? event.end_location : event.location;
  const fallback = event.location;
  return new THREE.Vector3(
    ((location?.x ?? fallback.x) - 50) * 0.18,
    0.16,
    ((location?.y ?? fallback.y) - 50) * 0.11,
  );
};

function PitchLine({ points, color = "#739984", opacity = 0.4 }: { points: THREE.Vector3[]; color?: string; opacity?: number }) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  return <primitive object={line} />;
}

function World({ vertical, passMode }: { vertical: boolean; passMode: boolean }) {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const reveal = interpolate(frame, [0, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pass = interpolate(frame, passMode ? [45, 115] : [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const heroEvent = hero.events.find((event) => event.event_id === "e-000974")!;
  const ballPosition = point(heroEvent).lerp(point(heroEvent, true), pass);
  const scale = vertical ? 0.74 : 1;
  camera.position.set(
    (7.8 - reveal * 3.8) * scale,
    (10.5 - reveal * 2.2) * scale,
    (12 - reveal * 2.5) * scale,
  );
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  return (
    <group scale={scale} rotation={[0, -0.18 + reveal * 0.18, 0]}>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[18.35, 0.2, 11.35]} />
        <meshStandardMaterial color="#0c1d14" roughness={0.72} metalness={0.14} />
      </mesh>
      <PitchLine points={[[-9, 0.01, -5.5], [9, 0.01, -5.5], [9, 0.01, 5.5], [-9, 0.01, 5.5], [-9, 0.01, -5.5]].map(([x, y, z]) => new THREE.Vector3(x, y, z))} />
      <PitchLine points={[new THREE.Vector3(0, 0.01, -5.5), new THREE.Vector3(0, 0.01, 5.5)]} />
      {hero.events.slice(0, -1).map((event, index) => {
        const start = point(event);
        const end = event.end_location ? point(event, true) : null;
        return (
          <group key={event.event_id}>
            <mesh position={start.toArray()}>
              <sphereGeometry args={[0.065 + index * 0.003, 12, 12]} />
              <meshBasicMaterial color={event.team_id === "orn" ? "#ff6b5f" : "#55d6d0"} transparent opacity={0.2 + index * 0.055} />
            </mesh>
            {end && <PitchLine points={[start, end]} color="#55d6d0" opacity={0.15 + index * 0.05} />}
          </group>
        );
      })}
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={point(heroEvent, false).setY(0.025).toArray()} rotation={[-Math.PI / 2, 0, 0]} scale={1 + Math.sin(frame / 10 + index) * 0.04}>
          <ringGeometry args={[0.8 + index * 0.65, 0.83 + index * 0.65, 64]} />
          <meshBasicMaterial color="#ff6b5f" transparent opacity={(0.55 - index * 0.13) * reveal} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {pass > 0 && <PitchLine points={[point(heroEvent), point(heroEvent, true)]} color="#c8ff3d" opacity={0.95} />}
      <mesh position={ballPosition.toArray()}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color="#f1ffd8" emissive="#c8ff3d" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={ballPosition.toArray()} color="#c8ff3d" intensity={4} distance={4} />
      <ambientLight intensity={2.1} />
      <directionalLight position={[-4, 10, 6]} color="#d9ffc6" intensity={2.4} />
    </group>
  );
}

export default function MatchWorld({ vertical = false, passMode = false }: { vertical?: boolean; passMode?: boolean }) {
  const { width, height } = { width: vertical ? 1080 : 1920, height: vertical ? 1920 : 1080 };
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [7, 9, 12], fov: 38 }} style={{ background: "transparent" }}>
      <World vertical={vertical} passMode={passMode} />
    </ThreeCanvas>
  );
}
