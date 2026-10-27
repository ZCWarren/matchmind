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

const Soundtrack: React.FC<{ teaser?: boolean }> = ({ teaser = false }) => (
  <>
    <Audio src={staticFile(teaser ? "audio/teaser-music.wav" : "audio/music.wav")} volume={0.32} />
    {!teaser &&
      SCENE_AUDIO.map(([from, name]) => (
        <Sequence key={name} from={from}>
          <Audio src={staticFile(`audio/voice/${name}.mp3`)} />
        </Sequence>
      ))}
    <Sequence from={teaser ? 38 : 635}>
      <Audio src={staticFile("audio/impact.wav")} volume={0.75} />
    </Sequence>
    <Sequence from={teaser ? 210 : 1500}>
      <Audio src={staticFile("audio/verify.wav")} volume={0.65} />
    </Sequence>
  </>
);

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
