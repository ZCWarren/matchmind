import { Pause, Play } from "@phosphor-icons/react";
import type { Event, Moment } from "../../types";
import { eventIndex } from "../../hooks/useMatchExperience";
import { formatClock } from "../../lib";

export default function MomentTimeline({
  events,
  moments,
  cursor,
  playing,
  onPlay,
  onSeek,
  onMoment,
}: {
  events: Event[];
  moments: Moment[];
  cursor: number;
  playing: boolean;
  onPlay: () => void;
  onSeek: (index: number) => void;
  onMoment: (moment: Moment) => void;
}) {
  const current = events[cursor];
  const momentIndexes = new Map(moments.map((moment) => [eventIndex(events, moment.event_id), moment]));
  return (
    <div className="moment-timeline">
      <button className="play-button" type="button" onClick={onPlay} aria-label={playing ? "Pause moment" : "Play moment"}>
        {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
      </button>
      <span className="timeline-clock">{current ? formatClock(current.clock) : "--:--"}</span>
      <div className="timeline-track">
        <input
          aria-label="Match event timeline"
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={cursor}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <div className="timeline-moments" aria-hidden="true">
          {[...momentIndexes.entries()].map(([index, moment]) => (
            <i key={moment.moment_id} style={{ left: `${index / Math.max(1, events.length - 1) * 100}%` }} />
          ))}
        </div>
      </div>
      <select
        aria-label="Jump to key moment"
        className="moment-jump"
        value=""
        onChange={(event) => {
          const moment = moments.find((item) => item.moment_id === event.target.value);
          if (moment) onMoment(moment);
        }}
      >
        <option value="">Jump to a moment</option>
        {moments.slice(0, 30).map((moment) => (
          <option key={moment.moment_id} value={moment.moment_id}>
            {formatClock(moment.clock)} {moment.type.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
