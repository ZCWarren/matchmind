import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  ChromaticAberrationEffect,
  DepthOfFieldEffect,
  Effect,
  EffectComposer,
  EffectPass,
  KernelSize,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useDelayRender, useVideoConfig } from "remotion";
import * as THREE from "three";
import { applyPose, type CamPose } from "../lib/camera";
import { Ball, EventStorm, LineBreakCurtain, PassRibbon, PressureField, SprintStreak } from "./DataLayers";
import { Players, type PlayerLook } from "./Players";
import { Boards, Bowl, CrowdFlashes, FloodEnvironment, FloodLighting, Floodlights, GroundMist, Haze, Pitch } from "./Stadium";

export type WorldLayers = {
  /** floodlight power per tower 0..1 */
  power?: number[];
  beams?: number;
  stadium?: number; // bowl glow
  crowd?: number;
  haze?: number;
  players?: PlayerLook | null;
  ball?: number;
  pressure?: number;
  ribbon?: { reveal: number; opacity: number } | null;
  curtain?: { sweep: number; opacity: number } | null;
  sprint?: number;
  storm?: { form: number; collapse: number; opacity: number; lift?: number } | null;
  hidePitch?: boolean;
};

export type WorldFx = {
  bloom?: number;
  dof?: { focus: number; range?: number; bokeh?: number } | null;
  aberration?: number;
  exposure?: number;
  post?: boolean;
};

const Rig = ({ pose, exposure }: { pose: CamPose; exposure: number }) => {
  const { camera, size, gl, scene } = useThree();
  useLayoutEffect(() => {
    applyPose(camera as THREE.PerspectiveCamera, pose, size.width / size.height);
    gl.toneMappingExposure = exposure;
    scene.fog = new THREE.FogExp2("#DFEADA", 0.0022);
    scene.background = new THREE.Color("#DFEADA");
  });
  return null;
};

/** Kills NaN / Inf pixels before they can smear through the bloom mip chain. */
class SanitizeEffect extends Effect {
  constructor() {
    super(
      "Sanitize",
      `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = inputColor.rgb;
        float r = (c.r >= 0.0 && c.r <= 24.0) ? c.r : 0.0;
        float g = (c.g >= 0.0 && c.g <= 24.0) ? c.g : 0.0;
        float b = (c.b >= 0.0 && c.b <= 24.0) ? c.b : 0.0;
        outputColor = vec4(r, g, b, 1.0);
      }`,
    );
  }
}

/**
 * Synchronous post-processing chain. Built in useMemo (not across several React commits like
 * @react-three/postprocessing) so the very first rendered frame already has bloom/DOF; rendered
 * from the last effect in the tree so it sees all committed state.
 */
const PostFX = ({ frame, fx }: { frame: number; fx: WorldFx }) => {
  const { gl, scene, camera, size } = useThree();
  const advance = useThree((s) => s.advance);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("PostFX render"));
  const chain = useMemo(() => {
    const composer = new EffectComposer(gl, { multisampling: 0, frameBufferType: THREE.HalfFloatType });
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, new SanitizeEffect()));
    const dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 40, worldFocusRange: 30, bokehScale: 3 });
    const dofPass = new EffectPass(camera, dof);
    composer.addPass(dofPass);
    const bloom = new BloomEffect({ intensity: 0.12, luminanceThreshold: 1.1, luminanceSmoothing: 0.2, mipmapBlur: false, kernelSize: KernelSize.SMALL });
    composer.addPass(new EffectPass(camera, bloom));
    const ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0, 0), radialModulation: true, modulationOffset: 0.3 });
    composer.addPass(new EffectPass(camera, ca));
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const vignette = new VignetteEffect({ offset: 0.2, darkness: 0.08 });
    composer.addPass(new EffectPass(camera, tone, vignette));
    return { composer, dof, dofPass, bloom, ca };
  }, [gl, scene, camera]);
  // Take over rendering so R3F's own gl.render is skipped.
  useFrame(() => null, 1);
  useEffect(() => {
    const { composer, dof, dofPass, bloom, ca } = chain;
    composer.setSize(size.width, size.height);
    gl.toneMapping = THREE.NoToneMapping;
    bloom.intensity = 0.12 * (fx.bloom ?? 1);
    dofPass.enabled = !!fx.dof;
    if (fx.dof) {
      dof.cocMaterial.worldFocusDistance = fx.dof.focus;
      dof.cocMaterial.worldFocusRange = fx.dof.range ?? 30;
      dof.bokehScale = fx.dof.bokeh ?? 3;
    }
    ca.offset.set(0, 0);
    if (fx.post === false) {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      advance(performance.now());
      gl.render(scene, camera);
    } else {
      composer.render(1 / 30);
    }
    continueRender(handle);
  }, [frame, chain, fx, gl, size, scene, camera, advance, continueRender, handle]);
  return null;
};

const Scene = ({ pose, t, frame, layers, fx }: { pose: CamPose; t: number; frame: number; layers: WorldLayers; fx: WorldFx }) => {
  const power = layers.power ?? [1, 1, 1, 1];
  const avg = power.reduce((a, b) => a + b, 0) / power.length;
  const bloom = fx.bloom ?? 1;
  return (
    <>
      <Rig pose={pose} exposure={fx.exposure ?? 1} />
      <FloodEnvironment />
      <FloodLighting power={power} />
      {!layers.hidePitch && <Pitch lineGlow={0.06 + 0.16 * avg} />}
      <Boards intensity={avg} scroll={frame * 0.0015} />
      <Bowl glow={layers.stadium ?? avg} />
      <Floodlights power={power} frame={frame} beam={layers.beams ?? 1} />
      <CrowdFlashes frame={frame} amount={layers.crowd ?? 0.8} />
      <Haze frame={frame} amount={layers.haze ?? 0.8} />
      <GroundMist amount={avg} />
      {layers.players && <Players t={t} look={layers.players} />}
      {(layers.ball ?? 0) > 0 && <Ball t={t} frame={frame} opacity={layers.ball} />}
      <PressureField t={t} frame={frame} amount={layers.pressure ?? 0} />
      {layers.ribbon && <PassRibbon reveal={layers.ribbon.reveal} opacity={layers.ribbon.opacity} frame={frame} />}
      {layers.curtain && <LineBreakCurtain sweep={layers.curtain.sweep} opacity={layers.curtain.opacity} frame={frame} />}
      <SprintStreak t={t} frame={frame} opacity={layers.sprint ?? 0} />
      {layers.storm && <EventStorm frame={frame} {...layers.storm} />}
      <PostFX frame={frame} fx={fx} />
      
    </>
  );
};

export const World = ({
  pose,
  t,
  frame,
  layers = {},
  fx = {},
  style,
}: {
  pose: CamPose;
  t: number;
  frame: number;
  layers?: WorldLayers;
  fx?: WorldFx;
  style?: React.CSSProperties;
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, ...style }}
      gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      shadows
      dpr={1.5}
    >
      <Scene pose={pose} t={t} frame={frame} layers={layers} fx={fx} />
    </ThreeCanvas>
  );
};
