import React from "react";
import { displayPlayer, FACTS } from "../lib/data";
import { C, FONT } from "../theme";

type Variant = "studio" | "moment" | "overlay" | "fan";

const copy: Record<Variant, { eyebrow: string; headline: string; subline: string }> = {
  studio: {
    eyebrow: "DIRECTOR RUNDOWN",
    headline: "One moment ready for air",
    subline: "Human approval remains the final gate",
  },
  moment: {
    eyebrow: "72:12 · LINE BREAK",
    headline: `${displayPlayer(FACTS.passer)} releases ${displayPlayer(FACTS.receiver)}`,
    subline: "Pressure becomes attacking space",
  },
  overlay: {
    eyebrow: "ON AIR · 72:12",
    headline: `${displayPlayer(FACTS.passer)} breaks the press`,
    subline: `${displayPlayer(FACTS.receiver)} attacks the space behind`,
  },
  fan: {
    eyebrow: "FAN COMPANION",
    headline: "Defence becomes attack",
    subline: "One verified moment for every fan",
  },
};

export const ProductPreview: React.FC<{ variant: Variant }> = ({ variant }) => {
  const item = copy[variant];
  const metrics = variant === "studio"
    ? [["5/5", "CLAIMS"], ["8.0 sec", "AIRTIME"], ["#1", "PRIORITY"]]
    : [["24.6 m", "PASS"], ["0.82", "PRESSURE"], ["+0.174", "xT ADDED"]];

  return (
    <div
      style={{
        height: "100%",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(145deg, ${C.ink1}, ${C.ink2})`,
        color: C.text,
        fontFamily: FONT.sans,
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: "0.08em", color: C.ice }}>
            {item.eyebrow}
          </span>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: variant === "overlay" ? C.signal : C.verify }} />
        </div>
        <div style={{ marginTop: 28, maxWidth: 620, fontSize: 38, fontWeight: 750, lineHeight: 1.05, letterSpacing: "-0.035em" }}>
          {item.headline}
        </div>
        <div style={{ marginTop: 12, fontSize: 17, color: C.text2 }}>{item.subline}</div>
      </div>

      {variant === "studio" && (
        <div style={{ margin: "22px 0", display: "grid", gap: 8 }}>
          {[`01  ${displayPlayer(FACTS.passer)} breaks the press`, "02  Lower priority", "03  Lower priority"].map((row, index) => (
            <div
              key={row}
              style={{
                padding: "10px 14px",
                borderRadius: 9,
                border: `1px solid ${index === 0 ? C.ice : C.line}`,
                background: index === 0 ? `${C.ice}10` : C.ink1,
                fontFamily: FONT.mono,
                fontSize: 12,
                color: index === 0 ? C.text : C.text3,
              }}
            >
              {row}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
        {metrics.map(([value, label], index) => (
          <div key={label}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.text3 }}>{label}</div>
            <div style={{ marginTop: 5, fontFamily: FONT.mono, fontSize: 20, fontWeight: 650, color: index === 1 ? C.signal : C.ice }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
