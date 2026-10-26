import * as THREE from "three";

export type CamPose = {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
  roll?: number;
};

const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const blendPose = (a: CamPose, b: CamPose, t: number): CamPose => ({
  pos: lerp3(a.pos, b.pos, t),
  target: lerp3(a.target, b.target, t),
  fov: a.fov + (b.fov - a.fov) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});

/** Orbit pose around a target. angle in radians (0 = from +z side), elevation in radians. */
export const orbit = (
  target: [number, number, number],
  radius: number,
  angle: number,
  elevation: number,
  fov = 35,
  roll = 0,
): CamPose => ({
  pos: [
    target[0] + Math.sin(angle) * Math.cos(elevation) * radius,
    target[1] + Math.sin(elevation) * radius,
    target[2] + Math.cos(angle) * Math.cos(elevation) * radius,
  ],
  target,
  fov,
  roll,
});

export const applyPose = (cam: THREE.PerspectiveCamera, pose: CamPose, aspect: number) => {
  cam.position.set(...pose.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...pose.target);
  if (pose.roll) cam.rotateZ(pose.roll);
  cam.fov = pose.fov;
  cam.aspect = aspect;
  cam.near = 0.5;
  cam.far = 1200;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};

const scratch = new THREE.PerspectiveCamera();

/** Project a world point to pixel coords for DOM labels that ride on the 3D scene. */
export const project = (pose: CamPose, width: number, height: number, p: [number, number, number]) => {
  applyPose(scratch, pose, width / height);
  const v = new THREE.Vector3(...p).project(scratch);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: v.z < 1 && v.z > -1 };
};
