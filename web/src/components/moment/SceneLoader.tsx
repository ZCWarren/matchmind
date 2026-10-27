import { lazy, Suspense } from "react";
import type { Event, Team } from "../../types";
import type { SceneVariant } from "./MatchScene";

const MatchScene = lazy(() => import("./MatchScene"));

export default function SceneLoader(props: {
  events: Event[];
  cursor: number;
  home?: Team;
  away?: Team;
  variant?: SceneVariant;
  stage?: number;
  anchor?: number;
  playerLabels?: Record<string, string>;
}) {
  return (
    <Suspense
      fallback={
        <div className={`match-scene match-scene-${props.variant ?? "focus"} is-loading`} aria-label="Loading three-dimensional match structure">
          <span className="scene-loading-glow" />
        </div>
      }
    >
      <MatchScene {...props} />
    </Suspense>
  );
}
