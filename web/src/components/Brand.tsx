import { useId } from "react";

/** The MatchMind mark: a centre circle lit by a signal-to-floodlight arc — an eye on the pitch. */
export function BrandMark({ size = 30 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`mm-arc-${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FF4D2E" />
          <stop offset="0.45" stopColor="#FF8A3D" />
          <stop offset="1" stopColor="#FFE3B3" />
        </linearGradient>
        <radialGradient id={`mm-core-${id}`}>
          <stop offset="0" stopColor="#FFF6E6" />
          <stop offset="1" stopColor="#FFE3B3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.4" />
      <path d="M3 16 H29" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />
      <path
        d="M5.2 23.5 A13 13 0 0 1 26.8 8.5"
        fill="none"
        stroke={`url(#mm-arc-${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="6.5" fill={`url(#mm-core-${id})`} opacity="0.55" />
      <circle cx="16" cy="16" r="2.6" fill="#FFF3DF" />
    </svg>
  );
}

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <BrandMark />
      {!compact && <span className="brand-name">MatchMind</span>}
    </span>
  );
}
