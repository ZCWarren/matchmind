import React, { useEffect } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { loadFonts } from "./fonts";
import { AudiencesScene, ProductScene } from "./scenes/ProductScenes";
import { HeroPassScene, OutroScene, RevealScene, StormScene } from "./scenes/StadiumScenes";
import { AgentsScene, DirectorScene, EvidenceScene, RevisionScene } from "./scenes/SystemScenes";
import {
  TeaserGateScene,
  TeaserOutroScene,
  TeaserPassScene,
  TeaserSurfacesScene,
} from "./scenes/TeaserScenes";
import { C, FONT } from "./theme";

const SCENE_AUDIO = [
  [0, "storm"],
  [240, "reveal"],
  [570, "pass"],
  [870, "agents"],
  [1140, "revision"],
  [1410, "evidence"],
  [1650, "director"],
  [1890, "product"],
  [2190, "audiences"],
  [2460, "outro"],
] as const;

/**
 * Mix balance. The score in `public/audio/music.wav` is mastered to -19 LUFS with the
 * narration ducking baked in, so it plays at unity; the Edge TTS voice is quiet at the
 * source (about -21 LUFS) and gets a lift instead.
 */
const MUSIC_VOLUME = 1;
const VOICE_VOLUME = 1.35;

/** [start frame, file in public/audio/sfx, volume] */
type Cue = readonly [number, string, number];

/** Cut whooshes peak 0.75s (22 frames) into the file so they land exactly on the edit. */
const whooshInto = (cut: number, volume = 0.4): Cue => [cut - 22, "whoosh", volume];

const PROMO_SFX: readonly Cue[] = [
  [240, "impact", 0.7], // floodlights ignite
  whooshInto(570),
  [336, "tick-0", 0.35], [362, "tick-1", 0.35], [388, "tick-2", 0.35], // reveal layers
  [635, "impact", 0.75], // the 72:12 ball strike
  whooshInto(870),
  [898, "tick-0", 0.35], [914, "tick-1", 0.35], [930, "tick-2", 0.35], [946, "tick-3", 0.35], [962, "tick-4", 0.35], // five agents
  whooshInto(1140),
  [1208, "strike", 0.6], // the claim is struck out
  whooshInto(1410),
  [1428, "tick-0", 0.3], [1439, "tick-1", 0.3], [1450, "tick-2", 0.3], [1461, "tick-3", 0.3], [1472, "tick-4", 0.3], // claims grounded
  [1505, "verify", 0.6], // verifier stamp
  whooshInto(1650),
  [1760, "lock", 0.7], // human approval lock
  whooshInto(1890),
  [1932, "tick-0", 0.35], [1946, "tick-1", 0.35], [1960, "tick-2", 0.35], // product surfaces
  [2190, "impact", 0.65], // climax
  [2234, "tick-0", 0.35], [2248, "tick-1", 0.35], [2262, "tick-2", 0.35], // audience personas
  whooshInto(2460),
  [2520, "impact", 0.7], // final resolution
];

const TEASER_SFX: readonly Cue[] = [
  [38, "impact", 0.65],
  whooshInto(165),
  [183, "strike", 0.6],
  [209, "verify", 0.55],
  whooshInto(270),
  [276, "tick-0", 0.35], [288, "tick-1", 0.35], [296, "tick-2", 0.35],
  whooshInto(360),
  [360, "impact", 0.65],
];

const Soundtrack: React.FC<{ teaser?: boolean }> = ({ teaser = false }) => (
  <>
    <Audio src={staticFile(teaser ? "audio/teaser-music.wav" : "audio/music.wav")} volume={MUSIC_VOLUME} />
    {!teaser &&
      SCENE_AUDIO.map(([from, name]) => (
        <Sequence key={name} from={from}>
          <Audio src={staticFile(`audio/voice/${name}.mp3`)} volume={VOICE_VOLUME} />
        </Sequence>
      ))}
    {(teaser ? TEASER_SFX : PROMO_SFX).map(([from, file, volume]) => (
      <Sequence key={`${file}-${from}`} from={from}>
        <Audio src={staticFile(`audio/sfx/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </>
);

/** Soundtrack alone, for exporting the final mix and re-muxing it without re-rendering 3D frames. */
export const MatchMindPromoAudio: React.FC = () => <Soundtrack />;
export const MatchMindTeaserAudio: React.FC = () => <Soundtrack teaser />;

export const MatchMindPromo: React.FC = () => {
  useEffect(() => {
    loadFonts();
  }, []);

  return (
    <AbsoluteFill style={{ background: C.ink0, fontFamily: FONT.sans }}>
      <Soundtrack />
      <Sequence from={0} durationInFrames={240}>
        <StormScene />
      </Sequence>
      <Sequence from={240} durationInFrames={330}>
        <RevealScene />
      </Sequence>
      <Sequence from={570} durationInFrames={300}>
        <HeroPassScene />
      </Sequence>
      <Sequence from={870} durationInFrames={270}>
        <AgentsScene />
      </Sequence>
      <Sequence from={1140} durationInFrames={270}>
        <RevisionScene />
      </Sequence>
      <Sequence from={1410} durationInFrames={240}>
        <EvidenceScene />
      </Sequence>
      <Sequence from={1650} durationInFrames={240}>
        <DirectorScene />
      </Sequence>
      <Sequence from={1890} durationInFrames={300}>
        <ProductScene />
      </Sequence>
      <Sequence from={2190} durationInFrames={270}>
        <AudiencesScene />
      </Sequence>
      <Sequence from={2460} durationInFrames={240}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const MatchMindTeaser: React.FC = () => {
  useEffect(() => {
    loadFonts();
  }, []);

  return (
    <AbsoluteFill style={{ background: C.ink0, fontFamily: FONT.sans }}>
      <Soundtrack teaser />
      <Sequence from={0} durationInFrames={165}>
        <TeaserPassScene />
      </Sequence>
      <Sequence from={165} durationInFrames={105}>
        <TeaserGateScene />
      </Sequence>
      <Sequence from={270} durationInFrames={90}>
        <TeaserSurfacesScene />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <TeaserOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
