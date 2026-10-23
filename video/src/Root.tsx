import { Composition } from "remotion";
import { MatchMindPromo } from "./Promo";

export const RemotionRoot = () => (
  <Composition
    id="MatchMindPromo"
    component={MatchMindPromo}
    durationInFrames={3600}
    fps={30}
    width={1280}
    height={720}
  />
);
