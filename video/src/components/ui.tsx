import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { easeOut, life, pop, tween } from "../lib/motion";
import { C, FONT, GRAD } from "../theme";

export const FloodBackdrop: React.FC<{
  accent?: string;
  secondary?: string;
  dim?: number;
}> = ({ accent = C.flood, secondary = C.ice, dim = 1 }) => (
  <AbsoluteFill style={{ background: C.ink0, pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        opacity: dim,
        background: `
          radial-gradient(60% 50% at 82% 18%, ${accent}16 0%, transparent 70%),
          radial-gradient(55% 50% at 12% 82%, ${secondary}10 0%, transparent 70%)
        `,
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.16 * dim,
        backgroundImage: `
          linear-gradient(to right, rgba(24,62,39,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(24,62,39,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "96px 96px",
        maskImage: "radial-gradient(circle at 50% 48%, black 25%, transparent 80%)",
      }}
    />
  </AbsoluteFill>
);

export const Eyebrow: React.FC<{
  text: string;
  color?: string;
  delay?: number;
  size?: number;
}> = ({ text, color = C.signal, delay = 0, size = 14 }) => {
  const frame = useCurrentFrame();
  const a = tween(frame, delay, delay + 14);
  const y = tween(frame, delay, delay + 16, 14, 0);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 14px",
        borderRadius: 999,
        background: "rgba(255, 255, 255, 0.82)",
        border: `1px solid ${color}33`,
        boxShadow: "0 12px 32px rgba(33,72,45,0.10)",
        opacity: a,
        transform: `translateY(${y}px)`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 99,
          background: color,
        }}
      />
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.text,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const SerifSpan: React.FC<{
  children: React.ReactNode;
  gradient?: "signal" | "ai" | "flood";
  color?: string;
}> = ({ children, color }) => (
  <span
    style={{
      fontFamily: FONT.sans,
      fontStyle: "normal",
      fontWeight: 650,
      letterSpacing: "-0.045em",
      color: color ?? C.verify,
    }}
  >
    {children}
  </span>
);

export const TopChrome: React.FC<{
  chapter: string;
  code?: string;
  vertical?: boolean;
  clock?: string;
}> = ({ chapter, code = "01", vertical = false, clock = "72:12" }) => {
  const frame = useCurrentFrame();
  const a = tween(frame, 0, 14);
  return (
    <div
      style={{
        position: "absolute",
        top: vertical ? 44 : 38,
        left: vertical ? 48 : 64,
        right: vertical ? 48 : 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: a,
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      {/* Left: Brand Lockup */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(30,103,66,0.22)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              transform: "rotate(45deg)",
              background: GRAD.signal,
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: FONT.sans,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: C.text,
            }}
          >
            MatchMind
          </span>
          {!vertical && (
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.text3,
                letterSpacing: "0.08em",
              }}
            >
              DAYLIGHT
            </span>
          )}
        </div>
      </div>

      {/* Center: Match Score Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "7px 16px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.84)",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(12px)",
          fontFamily: FONT.mono,
          fontSize: 13,
          color: C.text2,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.ice, fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: C.ice }} />
          NHR
        </span>
        <span style={{ color: C.text, fontWeight: 600 }}>1 : 1</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.signal, fontWeight: 500 }}>
          ORN
          <span style={{ width: 6, height: 6, borderRadius: 99, background: C.signal }} />
        </span>
        <span style={{ color: C.text3 }}>·</span>
        <span style={{ color: C.flood }}>{clock}</span>
      </div>

      {/* Right: Chapter Indicator */}
      {!vertical && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: FONT.mono,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: C.text2,
          }}
        >
          <span style={{ color: C.signal }}>{code}</span>
          <span style={{ color: C.text3 }}>/</span>
          <span>{chapter}</span>
        </div>
      )}
    </div>
  );
};

export const SubtitleBar: React.FC<{
  en: string;
  zh?: string;
  duration: number;
}> = ({ en, duration }) => {
  const frame = useCurrentFrame();
  const a = life(frame, 4, duration - 4, 10, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 32,
        display: "flex",
        justifyContent: "center",
        opacity: a,
        transform: "translateX(-50%)",
        zIndex: 40,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "11px 22px",
          borderRadius: 14,
          background: "rgba(255, 255, 255, 0.92)",
          border: "1px solid rgba(24, 62, 39, 0.14)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 14px 36px rgba(33, 72, 45, 0.14)",
        }}
      >
        <span
          style={{
            fontFamily: FONT.sans,
            fontSize: 19,
            fontWeight: 550,
            letterSpacing: "-0.015em",
            color: C.text,
            whiteSpace: "nowrap",
          }}
        >
          {en}
        </span>
      </div>
    </div>
  );
};

export const GlassCard: React.FC<{
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
  delay?: number;
}> = ({ children, accent = C.line, style, delay = 0 }) => {
  const frame = useCurrentFrame();
  const p = pop(frame, delay, 30, 16, 0.75, 130);
  const a = tween(frame, delay, delay + 14);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        background: "rgba(255, 255, 255, 0.90)",
        border: `1px solid rgba(24, 62, 39, 0.12)`,
        boxShadow: `0 24px 60px rgba(33, 72, 45, 0.14)`,
        backdropFilter: "blur(20px)",
        overflow: "hidden",
        opacity: a,
        transform: `translateY(${(1 - p) * 26}px) scale(${0.97 + p * 0.03})`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 24,
          right: 24,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.85,
        }}
      />
      {children}
    </div>
  );
};

export const TiltScreen: React.FC<{
  src: string;
  label: string;
  url?: string;
  accent?: string;
  width: number;
  height: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  delay?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  src,
  label,
  url = "matchmind.live/studio",
  accent = C.signal,
  width,
  height,
  rotateX = 6,
  rotateY = -12,
  rotateZ = 0,
  delay = 0,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = tween(frame, delay, delay + 26, 0, 1, easeOut);
  const drift = Math.sin((frame - delay) * 0.04) * 1.2;
  return (
    <div
      style={{
        width,
        height,
        perspective: 1800,
        opacity: tween(frame, delay, delay + 16),
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 22,
          background: C.ink1,
          border: `1px solid rgba(24,62,39,0.14)`,
          boxShadow: `0 36px 90px rgba(33, 72, 45, 0.20)`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transformStyle: "preserve-3d",
          transform: `
            translateY(${(1 - p) * 42}px)
            scale(${0.92 + p * 0.08})
            rotateX(${rotateX * p + drift * 0.35}deg)
            rotateY(${rotateY * p - drift * 0.45}deg)
            rotateZ(${rotateZ * p}deg)
          `,
        }}
      >
        {/* Window Top Chrome */}
        <div
          style={{
            height: 36,
            padding: "0 16px",
            background: "rgba(255, 255, 255, 0.96)",
            borderBottom: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: C.signal, opacity: 0.85 }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: C.flood, opacity: 0.65 }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: C.verify, opacity: 0.65 }} />
            <span
              style={{
                marginLeft: 10,
                fontFamily: FONT.mono,
                fontSize: 11,
                color: C.text2,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          </div>
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 99,
              background: "rgba(255,255,255,0.04)",
              fontFamily: FONT.mono,
              fontSize: 11,
              color: C.text3,
            }}
          >
            {url}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: accent }}>LIVE</span>
          </div>
        </div>

        {/* Screen Image + Optional Overlay */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden", background: C.ink0 }}>
          <Img
            src={staticFile(src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
          {/* Subtle glass reflection sheen */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.0) 38%, rgba(0,0,0,0.22) 100%)",
              pointerEvents: "none",
            }}
          />
          {children}
        </div>
      </div>
    </div>
  );
};
