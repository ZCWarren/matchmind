import { lazy, Suspense } from "react";
import type { Event, Team } from "../../types";

const MatchScene = lazy(() => import("./MatchScene"));

export default function SceneLoader(props: {
  events: Event[];
  cursor: number;
  home?: Team;
  away?: Team;
  variant?: "hero" | "focus";
}) {
  return (
    <Suspense fallback={<div className="match-scene" aria-label="Loading three-dimensional match structure" />}>
      <MatchScene {...props} />
    </Suspense>
  );
}
