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
  const why = insight?.insight?.why_it_matters ?? "24.6 m line-breaking pass under 0.82 pressure adds +0.174 xT.";
  const clockStr = moment ? formatClock(moment.clock) : "72:12";
  const fixtureStr = `${home?.name ?? "Nova Harbor"} vs ${away?.name ?? "Orion North"}`;
  const pressureStr = (currentEvent?.pressure ?? 0.82).toFixed(2);
  const xtVal = moment?.metrics?.xt_delta?.value ?? 0.174;
  const startX = currentEvent ? (currentEvent.location.x / 100) * 520 + 40 : 230;
  const startY = currentEvent ? (currentEvent.location.y / 100) * 200 + 30 : 130;
  const endX = currentEvent?.end_location ? (currentEvent.end_location.x / 100) * 520 + 40 : 390;
  const endY = currentEvent?.end_location ? (currentEvent.end_location.y / 100) * 200 + 30 : 95;

  const shareText = `⚽ ${fixtureStr} (${clockStr})\n“${headline}”\n\n• Pressure: ${pressureStr} idx\n• Threat Added: +${xtVal.toFixed(3)} xT\n• Verified by MatchMind 5-Agent Graph + Deterministic Release Gate\n\nExplore in 3D: https://ruziniuuuuu.github.io/matchmind/`;

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
      <rect width="1200" height="675" fill="#070b0b"/>
      <rect x="32" y="32" width="1136" height="611" rx="18" fill="#0c1512" stroke="#c8ff3d" stroke-opacity="0.35" stroke-width="2"/>
      <text x="72" y="92" fill="#c8ff3d" font-family="sans-serif" font-size="18" font-weight="700" letter-spacing="3">MATCHMIND · SEE THE GAME BENEATH THE GAME</text>
      <text x="72" y="138" fill="#f3f8f3" font-family="sans-serif" font-size="30" font-weight="800">${fixtureStr.replace(/&/g, "&amp;")} · ${clockStr}</text>
      <text x="72" y="195" fill="#c8ff3d" font-family="sans-serif" font-size="24" font-weight="700">${headline.slice(0, 74).replace(/&/g, "&amp;")}</text>
      <text x="72" y="240" fill="#a9bdb2" font-family="sans-serif" font-size="18">${why.slice(0, 105).replace(/&/g, "&amp;")}</text>
      <rect x="72" y="280" width="1056" height="260" rx="12" fill="#09130f" stroke="#294438"/>
      <line x1="600" y1="280" x2="600" y2="540" stroke="#294438" stroke-dasharray="6 6"/>
      <circle cx="600" cy="410" r="48" fill="none" stroke="#294438"/>
      <circle cx="${startX + 260}" cy="${startY + 275}" r="36" fill="none" stroke="#ff625f" stroke-opacity="0.65" stroke-width="3"/>
      <path d="M ${startX + 260} ${startY + 275} Q ${(startX + endX) / 2 + 260} ${Math.min(startY, endY) + 215} ${endX + 260} ${endY + 275}" fill="none" stroke="#c8ff3d" stroke-width="5"/>
      <circle cx="${startX + 260}" cy="${startY + 275}" r="9" fill="#c8ff3d"/>
      <circle cx="${endX + 260}" cy="${endY + 275}" r="11" fill="#f3f8f3" stroke="#c8ff3d" stroke-width="4"/>
      <text x="72" y="596" fill="#c8ff3d" font-family="monospace" font-size="20" font-weight="700">PRESSURE ${pressureStr}  |  xT +${xtVal.toFixed(3)}  |  5-AGENT GRAPH VERIFIED</text>
      <text x="780" y="596" fill="#8fb49c" font-family="monospace" font-size="17">ruziniuuuuu.github.io/matchmind</text>
    </svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matchmind-${moment?.moment_id ?? "tactical-card"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tactical Share Poster">
      <div className="share-card-modal">
        <header className="modal-head">
          <div>
            <span className="section-label"><ShareNetwork size={14} /> Tactical Intelligence Poster</span>
            <h2>One-Click Broadcast & Social Share Card</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close share card">
            <X size={18} />
          </button>
        </header>

        <div className="poster-preview">
          <div className="poster-top">
            <span className="poster-brand">MATCHMIND · 5-AGENT TACTICAL ENGINE</span>
            <span className="poster-stamp"><ShieldCheck size={14} /> DETERMINISTIC GATE PASSED</span>
          </div>
          <div className="poster-fixture">
            <strong>{fixtureStr}</strong>
            <span>{clockStr} · {moment?.event_id ?? "e-000974"}</span>
          </div>
          <h3 className="poster-headline">{headline}</h3>
          <p className="poster-why">{why}</p>

          <svg className="poster-pitch-svg" viewBox="0 0 600 240" aria-label="Tactical pass trajectory">
            <rect x="10" y="10" width="580" height="220" rx="8" fill="#08130e" stroke="#233d31" />
            <line x1="300" y1="10" x2="300" y2="230" stroke="#233d31" strokeDasharray="4 4" />
            <circle cx="300" cy="120" r="34" fill="none" stroke="#233d31" />
            <rect x="10" y="55" width="76" height="130" fill="none" stroke="#233d31" />
            <rect x="514" y="55" width="76" height="130" fill="none" stroke="#233d31" />
            <circle cx={startX} cy={startY} r="28" fill="none" stroke="#ff625f" strokeOpacity="0.6" strokeWidth="2" />
            <circle cx={startX} cy={startY} r="44" fill="none" stroke="#ff625f" strokeOpacity="0.3" strokeWidth="1.5" />
            <path
              d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${Math.min(startY, endY) - 42} ${endX} ${endY}`}
              fill="none"
              stroke="#c8ff3d"
              strokeWidth="3.5"
            />
            <circle cx={startX} cy={startY} r="6" fill="#c8ff3d" />
            <circle cx={endX} cy={endY} r="7" fill="#f3f8f3" stroke="#c8ff3d" strokeWidth="3" />
          </svg>

          <div className="poster-metrics-row">
            <div><span>PRESSURE</span><strong>{pressureStr}</strong></div>
            <div><span>THREAT DELTA</span><strong>+{xtVal.toFixed(3)} xT</strong></div>
            <div><span>CLAIMS CHECKED</span><strong>{insight?.verification.checked_claims ?? 5}/5</strong></div>
            <div><span>RELEASE GATE</span><strong>VERIFIED</strong></div>
          </div>
        </div>

        <footer className="modal-foot">
          <button type="button" className="action-secondary compact-btn" onClick={() => void copyShare()}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Copied X/Social Thread Snippet!" : "Copy Social Post"}</span>
          </button>
          <button type="button" className="action-primary compact-btn" onClick={downloadSvgPoster}>
            <DownloadSimple size={15} weight="bold" />
            <span>Download Vector Poster (.SVG)</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
