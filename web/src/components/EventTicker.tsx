import { ListDashes } from "@phosphor-icons/react";
import { eventLabel, formatClock } from "../lib";
import type { Event } from "../types";

export default function EventTicker({
  events,
  cursor,
  onSelect,
}: {
  events: Event[];
  cursor: number;
  onSelect: (index: number) => void;
}) {
  const visible = events.slice(Math.max(0, cursor - 7), cursor + 1).reverse();
  return (
    <section className="panel event-panel">
      <header className="panel-head">
        <span className="panel-title">
          <ListDashes size={13} /> Event feed
        </span>
        <span className="mono dim" style={{ fontSize: 8 }}>
          {events.length.toLocaleString()} EVENTS
        </span>
      </header>
      <div className="panel-body event-list">
        {visible.map((event) => {
          const index = events.indexOf(event);
          return (
            <button
              type="button"
              key={event.event_id}
              className={`event-row ${index === cursor ? "current" : ""}`}
              onClick={() => onSelect(index)}
            >
              <span className="event-min">{formatClock(event.clock)}</span>
              <span className="event-label">{eventLabel(event.type, event.player_id)}</span>
              <span className="event-type">{event.outcome ?? event.team_id ?? "match"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
