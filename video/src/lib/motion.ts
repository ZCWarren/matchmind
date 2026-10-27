import { Easing, interpolate, spring } from "remotion";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Expo-out, the brief's cubic-bezier(0.16, 1, 0.3, 1). */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** Clamped interpolate with an easing curve. */
export const tween = (
  frame: number,
  from: number,
  to: number,
  outFrom = 0,
  outTo = 1,
  ease: (t: number) => number = easeOut,
) =>
  interpolate(frame, [from, to], [outFrom, outTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** Multi-stop clamped interpolate (linear). */
export const ramp = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const pop = (frame: number, delay = 0, fps = 30, damping = 16, mass = 0.7, stiffness = 140) =>
  spring({ frame: frame - delay, fps, config: { damping, mass, stiffness } });

/** In → hold → out envelope. */
export const life = (frame: number, start: number, end: number, fadeIn = 10, fadeOut = 10) =>
  Math.min(tween(frame, start, start + fadeIn), 1 - tween(frame, end - fadeOut, end, 0, 1, easeIn));

/** Deterministic PRNG (mulberry32). */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
