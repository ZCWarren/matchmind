import { Pause, Play } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { eventIndex } from "../../hooks/useMatchExperience";
import { formatClock } from "../../lib";
import type { Event, Moment } from "../../types";

export default function MomentTimeline({
  events,
  moments,
  cursor,
  playing,
  onPlay,
  onSeek,
  onMoment,
  selectedMomentId,
}: {
  events: Event[];
  moments: Moment[];
  cursor: number;
  playing: boolean;
  onPlay: () => void;
  onSeek: (index: number) => void;
  onMoment: (moment: Moment) => void;
  selectedMomentId?: string;
}) {
  const current = events[cursor];
  const max = Math.max(1, events.length - 1);
  const momentIndexes = moments.map((moment) => [eventIndex(events, moment.event_id), moment] as const);
  const fill = `${(cursor / max) * 100}%`;
  return (
    <div className="moment-timeline">
      <button className="play-button" type="button" onClick={onPlay} aria-label={playing ? "Pause moment" : "Play moment"}>
        {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
      </button>
      <div className="timeline-clock">
        <span className="mono">{current ? formatClock(current.clock) : "--'--"}</span>
        <small>{current?.type.replaceAll("_", " ") ?? "loading"}</small>
      </div>
      <div className="timeline-track" style={{ ["--fill" as string]: fill } as CSSProperties}>
        <div className="timeline-moments" aria-hidden="true">
          {momentIndexes.map(([index, moment]) => (
            <i
              key={moment.moment_id}
              className={moment.moment_id === selectedMomentId ? "selected" : moment.importance >= 0.75 ? "major" : ""}
              style={{ left: `${(index / max) * 100}%` }}
            />
          ))}
        </div>
        <input
          aria-label="Match event timeline"
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={cursor}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div className="timeline-scale" aria-hidden="true">
          <span>0'</span><span>45'</span><span>90'</span>
        </div>
      </div>
      <select
        aria-label="Jump to key moment"
        className="field-select moment-jump"
        value=""
        onChange={(event) => {
          const moment = moments.find((item) => item.moment_id === event.target.value);
          if (moment) onMoment(moment);
        }}
      >
        <option value="">Jump to a moment</option>
        {moments.slice(0, 30).map((moment) => (
          <option key={moment.moment_id} value={moment.moment_id}>
            {formatClock(moment.clock)} · {moment.type.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
