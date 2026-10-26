import { continueRender, delayRender, staticFile } from "remotion";

const faces: [string, string, FontFaceDescriptors][] = [
  ["Instrument Serif", "fonts/instrument-serif-latin-400-normal.woff2", { style: "normal", weight: "400" }],
  ["Instrument Serif", "fonts/instrument-serif-latin-400-italic.woff2", { style: "italic", weight: "400" }],
  ["Inter Tight", "fonts/inter-tight-latin-wght-normal.woff2", { style: "normal", weight: "100 900" }],
  ["JetBrains Mono", "fonts/jetbrains-mono-latin-400-normal.woff2", { style: "normal", weight: "400" }],
  ["JetBrains Mono", "fonts/jetbrains-mono-latin-500-normal.woff2", { style: "normal", weight: "500" }],
];

let promise: Promise<void> | null = null;

export const loadFonts = () => {
  if (promise) return promise;
  const handle = delayRender("Loading Floodlight fonts");
  promise = Promise.all(
    faces.map(async ([family, file, desc]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, desc);
      await face.load();
      (document.fonts as unknown as Set<FontFace>).add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
  return promise;
};
