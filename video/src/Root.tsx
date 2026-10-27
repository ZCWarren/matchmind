import React from "react";
import { Composition } from "remotion";
import { MatchMindPromo, MatchMindPromoAudio, MatchMindTeaser, MatchMindTeaserAudio } from "./Promo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MatchMindPromo"
      component={MatchMindPromo}
      durationInFrames={2700}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="MatchMindTeaser"
      component={MatchMindTeaser}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition id="MatchMindPromoAudio" component={MatchMindPromoAudio} durationInFrames={2700} fps={30} width={320} height={180} />
    <Composition id="MatchMindTeaserAudio" component={MatchMindTeaserAudio} durationInFrames={450} fps={30} width={320} height={180} />
  </>
);
