/**
 * "Floodlight" design tokens — shared with the web redesign.
 * Night stadium, light that reveals the hidden layer of the game.
 */
export const C = {
  ink0: "#05060A",
  ink1: "#0B0D14",
  ink2: "#141826",
  line: "rgba(255,255,255,0.08)",
  text: "#F5F3EE",
  text2: "#A3A8B8",
  text3: "#646A7D",
  signal: "#FF4D2E",
  signal2: "#FF8A3D",
  flood: "#FFE3B3",
  ice: "#5CC8FF",
  violet: "#8B7CFF",
  verify: "#3DF5A6",
} as const;

export const GRAD = {
  signal: `linear-gradient(120deg, ${C.signal} 0%, ${C.signal2} 40%, ${C.flood} 100%)`,
  ai: `linear-gradient(120deg, ${C.violet} 0%, ${C.ice} 100%)`,
};

export const FONT = {
  serif: '"Instrument Serif", "Noto Serif CJK SC", serif',
  sans: '"Inter Tight", "Noto Sans CJK SC", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const FPS = 30;
/** Music runs at 120 BPM: one beat = 15 frames, one bar = 60 frames. */
export const BEAT = 15;
export const BAR = 60;
export const beats = (n: number) => Math.round(n * BEAT);
export const bars = (n: number) => Math.round(n * BAR);
