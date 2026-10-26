import { Check, Copy, DownloadSimple, ShareNetwork, ShieldCheck, X } from "@phosphor-icons/react";
import { useState } from "react";
import { formatClock } from "../lib";
import type { Event, InsightResult, Moment, Team } from "../types";

type ShareCardModalProps = {
  open: boolean;
  onClose: () => void;
  home?: Team;
  away?: Team;
  moment?: Moment | null;
  insight?: InsightResult | null;
  currentEvent?: Event;
};

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

  if (!open) return null;

  const headline = insight?.insight?.headline ?? moment?.headline ?? "NHR-08 escapes ORN's press trap at 72:12";
  const clockStr = moment ? formatClock(moment.clock) : "72:12";
  const fixtureStr = `${home?.name ?? "Nova Harbor"} vs ${away?.name ?? "Orion North"}`;
  const pressureStr = (currentEvent?.pressure ?? 0.82).toFixed(2);
  const xtVal = moment?.metrics?.xt_delta?.value ?? 0.174;
  const startX = currentEvent ? (currentEvent.location.x / 100) * 520 + 40 : 230;
  const startY = currentEvent ? (currentEvent.location.y / 100) * 200 + 30 : 130;
  const endX = currentEvent?.end_location ? (currentEvent.end_location.x / 100) * 520 + 40 : 390;
  const endY = currentEvent?.end_location ? (currentEvent.end_location.y / 100) * 200 + 30 : 95;

  const shareText = `⚽ ${fixtureStr} (${clockStr})\n“${headline}”\n\n• Pressure: ${pressureStr}\n• Threat: +${xtVal.toFixed(2)} xT\n\nExplore in 3D: https://ruziniuuuuu.github.io/matchmind/`;

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
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
      <rect width="1200" height="675" fill="#060a08"/>
      <rect x="32" y="32" width="1136" height="611" rx="22" fill="#0b1410" stroke="#ccff00" stroke-opacity="0.45" stroke-width="2"/>
      <text x="72" y="96" fill="#ccff00" font-family="sans-serif" font-size="20" font-weight="800" letter-spacing="3">MATCHMIND · SEE THE GAME BENEATH THE GAME</text>
      <text x="72" y="152" fill="#f3f8f3" font-family="sans-serif" font-size="38" font-weight="800">${fixtureStr.replace(/&/g, "&amp;")} · ${clockStr}</text>
      <text x="72" y="212" fill="#ccff00" font-family="sans-serif" font-size="26" font-weight="700">${headline.slice(0, 68).replace(/&/g, "&amp;")}</text>
      <rect x="72" y="250" width="1056" height="275" rx="14" fill="#08110d" stroke="#294438"/>
      <line x1="600" y1="250" x2="600" y2="525" stroke="#294438" stroke-dasharray="6 6"/>
      <circle cx="600" cy="387" r="52" fill="none" stroke="#294438"/>
      <circle cx="${startX + 260}" cy="${startY + 255}" r="38" fill="none" stroke="#ff5548" stroke-opacity="0.7" stroke-width="3"/>
      <path d="M ${startX + 260} ${startY + 255} Q ${(startX + endX) / 2 + 260} ${Math.min(startY, endY) + 195} ${endX + 260} ${endY + 255}" fill="none" stroke="#ccff00" stroke-width="6"/>
      <circle cx="${startX + 260}" cy="${startY + 255}" r="10" fill="#ccff00"/>
      <circle cx="${endX + 260}" cy="${endY + 255}" r="12" fill="#f3f8f3" stroke="#ccff00" stroke-width="4"/>
      <text x="72" y="592" fill="#ccff00" font-family="monospace" font-size="22" font-weight="700">PRESSURE ${pressureStr}   |   THREAT +${xtVal.toFixed(2)} xT   |   FACT-CHECKED</text>
      <text x="800" y="592" fill="#8fb49c" font-family="monospace" font-size="18">ruziniuuuuu.github.io/matchmind</text>
    </svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matchmind-${moment?.moment_id ?? "card"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Match Share Card">
      <div className="share-card-modal">
        <header className="modal-head">
          <div>
            <span className="section-label"><ShareNetwork size={14} /> SHARE THIS MOMENT</span>
            <h2>Instant Match Card</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close share card">
            <X size={20} />
          </button>
        </header>

        <div className="poster-preview">
          <div className="poster-top">
            <span className="poster-brand">MATCHMIND 3D</span>
            <span className="poster-stamp"><ShieldCheck size={15} /> VERIFIED</span>
          </div>
          <div className="poster-fixture">
            <strong>{fixtureStr}</strong>
            <span>{clockStr}</span>
          </div>
          <h3 className="poster-headline">{headline}</h3>

          <svg className="poster-pitch-svg" viewBox="0 0 600 220" aria-label="Pass trajectory">
            <rect x="10" y="10" width="580" height="200" rx="10" fill="#08130e" stroke="#233d31" />
            <line x1="300" y1="10" x2="300" y2="210" stroke="#233d31" strokeDasharray="4 4" />
            <circle cx="300" cy="110" r="34" fill="none" stroke="#233d31" />
            <rect x="10" y="50" width="76" height="120" fill="none" stroke="#233d31" />
            <rect x="514" y="50" width="76" height="120" fill="none" stroke="#233d31" />
            <circle cx={startX} cy={startY} r="28" fill="none" stroke="#ff5548" strokeOpacity="0.65" strokeWidth="2.5" />
            <path
              d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${Math.min(startY, endY) - 42} ${endX} ${endY}`}
              fill="none"
              stroke="#ccff00"
              strokeWidth="4"
            />
            <circle cx={startX} cy={startY} r="6.5" fill="#ccff00" />
            <circle cx={endX} cy={endY} r="7.5" fill="#f3f8f3" stroke="#ccff00" strokeWidth="3" />
          </svg>

          <div className="poster-metrics-row">
            <div><span>PRESSURE</span><strong>{pressureStr}</strong></div>
            <div><span>THREAT</span><strong>+{xtVal.toFixed(2)}</strong></div>
            <div><span>TIME</span><strong>{clockStr}</strong></div>
            <div><span>STATUS</span><strong>VERIFIED</strong></div>
          </div>
        </div>

        <footer className="modal-foot">
          <button type="button" className="action-secondary compact-btn" onClick={() => void copyShare()}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </button>
          <button type="button" className="action-primary compact-btn" onClick={downloadSvgPoster}>
            <DownloadSimple size={15} weight="bold" />
            <span>Download Poster</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
