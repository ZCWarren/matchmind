/** Daylight tokens shared with the web product. */
export const C = {
  ink0: "#F4F7F1",
  ink1: "#FFFFFF",
  ink2: "#EAF0E6",
  line: "rgba(24,62,39,0.12)",
  text: "#14251B",
  text2: "#53645A",
  text3: "#78867C",
  signal: "#CF6048",
  signal2: "#DF8A65",
  flood: "#2E6D46",
  ice: "#167C9F",
  violet: "#6C6392",
  verify: "#187A50",
} as const;

export const GRAD = {
  signal: `linear-gradient(120deg, #1E6742 0%, #58A56B 100%)`,
  ai: `linear-gradient(120deg, #1E6742 0%, #4C9562 100%)`,
};

export const FONT = {
  serif: '"Inter Tight", "Noto Sans CJK SC", system-ui, sans-serif',
  sans: '"Inter Tight", "Noto Sans CJK SC", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const FPS = 30;
/** Music runs at 120 BPM: one beat = 15 frames, one bar = 60 frames. */
export const BEAT = 15;
export const BAR = 60;
export const beats = (n: number) => Math.round(n * BEAT);
export const bars = (n: number) => Math.round(n * BAR);
