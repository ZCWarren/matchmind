import { useId } from "react";

/** The MatchMind mark: a centre circle and a passing lane across the pitch. */
export function BrandMark({ size = 30 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`mm-arc-${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1E6742" />
          <stop offset="1" stopColor="#58A56B" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(30,103,66,0.2)" strokeWidth="1.4" />
      <path d="M3 16 H29" stroke="rgba(30,103,66,0.2)" strokeWidth="1.2" />
      <path
        d="M5.2 23.5 A13 13 0 0 1 26.8 8.5"
        fill="none"
        stroke={`url(#mm-arc-${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.6" fill="#2E6D46" />
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
