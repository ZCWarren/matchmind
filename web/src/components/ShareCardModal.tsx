import { Check, Copy, DownloadSimple, ShareNetwork, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { formatClock } from "../lib";
import type { Event, InsightResult, Moment, Team } from "../types";
import Modal from "./Modal";

type ShareCardModalProps = {
  open: boolean;
  onClose: () => void;
  home?: Team;
  away?: Team;
  moment?: Moment | null;
  insight?: InsightResult | null;
  currentEvent?: Event;
};

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Wrap a headline into at most `maxLines` lines of roughly `width` characters. */
function wrap(text: string, width: number, maxLines: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > width) {
      out.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) out.push(line.trim());
  if (out.length > maxLines) {
    const kept = out.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[,.;:]?$/, "")}…`;
    return kept;
  }
  return out;
}

function posterSvg(opts: {
  fixture: string;
  clock: string;
  headline: string;
  pressure: string;
  xt: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}): string {
  const { fixture, clock, headline, pressure, xt, start, end } = opts;
  // Pitch box on the poster
  const px = 640;
  const py = 150;
  const pw = 500;
  const ph = 325;
  const sx = px + (start.x / 100) * pw;
  const sy = py + (start.y / 100) * ph;
  const ex = px + (end.x / 100) * pw;
  const ey = py + (end.y / 100) * ph;
  const cx = (sx + ex) / 2;
  const cy = Math.min(sy, ey) - 60;
  const lines = wrap(headline, 24, 4);
  const stripes = Array.from({ length: 10 }, (_, i) =>
    i % 2 === 0 ? `<rect x="${px + (i * pw) / 10}" y="${py}" width="${pw / 10}" height="${ph}" fill="#ffffff" fill-opacity="0.018"/>` : "",
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <radialGradient id="glow" cx="0.78" cy="0.05" r="0.9">
      <stop offset="0" stop-color="#FFE3B3" stop-opacity="0.32"/>
      <stop offset="0.35" stop-color="#FF4D2E" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#05060A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sig" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FF4D2E"/><stop offset="0.4" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FFE3B3"/>
    </linearGradient>
    <linearGradient id="lane" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5CC8FF" stop-opacity="0.2"/><stop offset="1" stop-color="#BFEAFF"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="1200" height="675" fill="#05060A"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <text x="64" y="86" fill="#F5F3EE" font-family="Inter Tight, Inter, Helvetica, sans-serif" font-size="20" font-weight="600" letter-spacing="-0.2">MatchMind</text>
  <text x="64" y="112" fill="#A3A8B8" font-family="Inter Tight, Inter, Helvetica, sans-serif" font-size="15">See the game beneath the game.</text>
  <text x="64" y="186" fill="#A3A8B8" font-family="JetBrains Mono, monospace" font-size="16" letter-spacing="0.4">${esc(fixture)}</text>
  <text x="64" y="228" fill="url(#sig)" font-family="JetBrains Mono, monospace" font-size="30" font-weight="600">${esc(clock)}</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="64" y="${300 + i * 56}" fill="#F5F3EE" font-family="Instrument Serif, Georgia, serif" font-size="54">${esc(line)}</text>`,
    )
    .join("")}
  <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="#0A1114"/>
  ${stripes}
  <g stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.5" fill="none">
    <rect x="${px + 12}" y="${py + 12}" width="${pw - 24}" height="${ph - 24}" rx="4"/>
    <line x1="${px + pw / 2}" y1="${py + 12}" x2="${px + pw / 2}" y2="${py + ph - 12}"/>
    <circle cx="${px + pw / 2}" cy="${py + ph / 2}" r="42"/>
    <rect x="${px + 12}" y="${py + ph / 2 - 80}" width="70" height="160"/>
    <rect x="${px + pw - 82}" y="${py + ph / 2 - 80}" width="70" height="160"/>
  </g>
  <circle cx="${sx}" cy="${sy}" r="46" fill="#FF4D2E" fill-opacity="0.18" filter="url(#blur)"/>
  <circle cx="${sx}" cy="${sy}" r="34" fill="none" stroke="#FF4D2E" stroke-opacity="0.8" stroke-width="2.5"/>
  <circle cx="${sx}" cy="${sy}" r="54" fill="none" stroke="#FF4D2E" stroke-opacity="0.35" stroke-width="1.5"/>
  <path d="M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}" fill="none" stroke="#5CC8FF" stroke-opacity="0.35" stroke-width="14" filter="url(#blur)"/>
  <path d="M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}" fill="none" stroke="url(#lane)" stroke-width="5" stroke-linecap="round"/>
  <circle cx="${sx}" cy="${sy}" r="8" fill="#5CC8FF"/>
  <circle cx="${ex}" cy="${ey}" r="10" fill="#FFF3DF"/>
  <circle cx="${ex}" cy="${ey}" r="22" fill="#FFE3B3" fill-opacity="0.35" filter="url(#blur)"/>
  <g font-family="JetBrains Mono, monospace">
    <text x="640" y="540" fill="#646A7D" font-size="13" letter-spacing="1">PRESSURE</text>
    <text x="640" y="578" fill="#FF4D2E" font-size="32" font-weight="600">${esc(pressure)}</text>
    <text x="810" y="540" fill="#646A7D" font-size="13" letter-spacing="1">THREAT ADDED</text>
    <text x="810" y="578" fill="#5CC8FF" font-size="32" font-weight="600">+${xt.toFixed(3)}</text>
    <text x="1000" y="540" fill="#646A7D" font-size="13" letter-spacing="1">VERIFIED</text>
    <text x="1000" y="578" fill="#3DF5A6" font-size="32" font-weight="600">PASS</text>
  </g>
  <text x="64" y="612" fill="#646A7D" font-family="JetBrains Mono, monospace" font-size="14">ruziniuuuuu.github.io/matchmind</text>
</svg>`;
}

export default function ShareCardModal({
  open,
  onClose,
  home,
  away,
  moment,
  insight,
  currentEvent,
}: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);

  const headline = insight?.insight?.headline ?? moment?.headline ?? "NHR-08 escapes ORN's press trap at 72:12";
  const clockStr = moment ? formatClock(moment.clock) : "72'12";
  const fixtureStr = `${home?.name ?? "Nova Harbor"} vs ${away?.name ?? "Orion North"}`;
  const pressureStr = (currentEvent?.pressure ?? 0.82).toFixed(2);
  const xtVal = moment?.metrics?.xt_delta?.value ?? 0.174;
  const start = currentEvent?.location ?? { x: 38, y: 52 };
  const end = currentEvent?.end_location ?? { x: start.x + 18, y: start.y - 8 };

  const svg = useMemo(
    () => posterSvg({ fixture: fixtureStr, clock: clockStr, headline, pressure: pressureStr, xt: xtVal, start, end }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixtureStr, clockStr, headline, pressureStr, xtVal, start.x, start.y, end.x, end.y],
  );

  const shareText = `${fixtureStr} (${clockStr})\n“${headline}”\n\n• Pressure: ${pressureStr}\n• Threat: +${xtVal.toFixed(2)} xT\n\nExplore in 3D: https://ruziniuuuuu.github.io/matchmind/`;

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadSvgPoster = () => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matchmind-${moment?.moment_id ?? "card"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} label="Match share card" className="share-card-modal">
      <header className="modal-head">
        <div>
          <span className="modal-kicker"><ShareNetwork size={13} weight="bold" /> Share this moment</span>
          <h2>A poster, <em>ready to post.</em></h2>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close share card">
          <X size={18} />
        </button>
      </header>
      <div className="poster-preview" dangerouslySetInnerHTML={{ __html: svg }} />
      <footer className="modal-foot">
        <span>Every number on the poster is traced to an event ID.</span>
        <div className="modal-foot-actions">
          <button type="button" className="btn btn-glass btn-sm" onClick={() => void copyShare()}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Copied" : "Copy text"}</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={downloadSvgPoster}>
            <DownloadSimple size={15} weight="bold" />
            <span>Download poster</span>
          </button>
        </div>
      </footer>
    </Modal>
  );
}
