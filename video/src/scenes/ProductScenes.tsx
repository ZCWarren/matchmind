import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  Eyebrow,
  FloodBackdrop,
  GlassCard,
  SerifSpan,
  SubtitleBar,
  TiltScreen,
  TopChrome,
} from "../components/ui";
import { cue, fanCards } from "../lib/data";
import { tween } from "../lib/motion";
import { C, FONT } from "../theme";

/* ==========================================================================
   SCENE 8 — PRODUCT CONTROL ROOM (1890..2190, 10s = 300f)
   ========================================================================== */
export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.signal} secondary={C.violet} />

      <TopChrome code="08" chapter="Broadcast Studio Workspace" clock="72:12" />

      {/* Left Editorial Column */}
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 132,
          width: 560,
          zIndex: 20,
        }}
      >
        <Eyebrow text="UNIFIED CONTROL ROOM · STUDIO + MOMENT FOCUS" color={C.signal} delay={4} />
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.sans,
            fontSize: 74,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 0.96,
            color: C.text,
            opacity: tween(frame, 8, 26),
            transform: `translateY(${tween(frame, 8, 26, 22, 0)}px)`,
          }}
        >
          From verified
          <br />
          insight to <SerifSpan gradient="signal">on air.</SerifSpan>
        </div>

        <div
          style={{
            marginTop: 22,
            fontFamily: FONT.sans,
            fontSize: 21,
            lineHeight: 1.45,
            color: C.text2,
            opacity: tween(frame, 24, 44),
          }}
        >
          One continuous workspace connects 3D tactical replay, the 5-agent trace, adversarial fact-checking, and live broadcast approval.
        </div>

        {/* Feature Callout Stack */}
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              tag: "01 · 3D TACTICAL STAGE",
              title: "Interactive Floodlight Pitch & Replay",
              sub: "Scrub pressure rings, pass corridors & event chains",
              color: C.ice,
              delay: 42,
            },
            {
              tag: "02 · BLACKBOARD & COPILOT",
              title: "Live Agent Graph & Hallucination Lab",
              sub: "Inspect every MCP tool call & bounded revision",
              color: C.violet,
              delay: 56,
            },
            {
              tag: "03 · DIRECTOR RUNDOWN",
              title: "Stoppage Scheduling & One-Click Air",
              sub: "Approve, hold or kill with deterministic proof",
              color: C.verify,
              delay: 70,
            },
          ].map((item) => (
            <GlassCard
              key={item.tag}
              accent={item.color}
              delay={item.delay}
              style={{ padding: "16px 22px" }}
            >
              <div style={{ fontFamily: FONT.mono, fontSize: 11, color: item.color, letterSpacing: "0.08em" }}>
                {item.tag}
              </div>
              <div style={{ fontFamily: FONT.sans, fontSize: 19, fontWeight: 650, color: C.text, marginTop: 4 }}>
                {item.title}
              </div>
              <div style={{ fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 2 }}>
                {item.sub}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Right 3D-Tilted Glass Screens */}
      <TiltScreen
        src="screens/studio.png"
        label="MatchMind Studio · Director Control"
        url="ruziniuuuuu.github.io/matchmind/#/studio"
        accent={C.signal}
        width={1080}
        height={640}
        rotateX={5}
        rotateY={-13}
        rotateZ={0.8}
        delay={12}
        style={{
          position: "absolute",
          right: 54,
          top: 128,
          zIndex: 10,
        }}
      />

      <TiltScreen
        src="screens/moment.png"
        label="Moment Focus · 72:12 Deep Dive"
        url="ruziniuuuuu.github.io/matchmind/#/moment"
        accent={C.ice}
        width={680}
        height={410}
        rotateX={7}
        rotateY={10}
        rotateZ={-1.2}
        delay={48}
        style={{
          position: "absolute",
          right: 430,
          bottom: 102,
          zIndex: 15,
        }}
      />

      <SubtitleBar
        en="From live replay to broadcast approval, one workspace turns verified insight into airtime."
        zh="从实时回放到播出审批，同一工作台将经过验证的洞察转化为播出内容。"
        duration={300}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 9 — MULTI-SURFACE AUDIENCES (2190..2460, 9s = 270f)
   ========================================================================== */
export const AudiencesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const enAnalyst = fanCards.find((c) => c.profile === "analyst" && c.language === "en")!;
  const esCasual = fanCards.find((c) => c.profile === "casual" && c.language === "es")!;
  const zhPlayer = fanCards.find((c) => c.profile === "player" && c.language === "zh")!;

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.ice} secondary={C.flood} />

      <TopChrome code="09" chapter="Broadcast Overlay & Fan Companion" clock="73:32" />

      {/* Top Header */}
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 110,
          right: 68,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <Eyebrow text="1 EVIDENCE BUNDLE · 2 SURFACES · 3 PERSONAS × 3 LANGUAGES" color={C.ice} delay={4} />
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT.sans,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: C.text,
              opacity: tween(frame, 8, 26),
              transform: `translateY(${tween(frame, 8, 26, 22, 0)}px)`,
            }}
          >
            Built for the broadcast. <SerifSpan gradient="flood">Understood by every fan.</SerifSpan>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            opacity: tween(frame, 20, 40),
          }}
        >
          {["ANALYST · EN", "CASUAL · ES", "PLAYER · 中文"].map((p, i) => (
            <span
              key={p}
              style={{
                padding: "7px 14px",
                borderRadius: 99,
                background: "rgba(20, 24, 38, 0.85)",
                border: `1px solid ${[C.ice, C.flood, C.violet][i]}66`,
                fontFamily: FONT.mono,
                fontSize: 12,
                color: [C.ice, C.flood, C.violet][i],
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Left: Broadcast Overlay Screen */}
      <TiltScreen
        src="screens/overlay.png"
        label="Clean Feed Broadcast Overlay · 1080p60"
        url="ruziniuuuuu.github.io/matchmind/#/overlay"
        accent={C.flood}
        width={980}
        height={575}
        rotateX={5}
        rotateY={11}
        rotateZ={-0.5}
        delay={14}
        style={{
          position: "absolute",
          left: 68,
          top: 280,
          zIndex: 10,
        }}
      />

      {/* Right: Fan Companion Screen + 3 Persona Trilingual Cards */}
      <TiltScreen
        src="screens/fan.png"
        label="Fan Companion"
        url="matchmind/#/fan"
        accent={C.violet}
        width={420}
        height={575}
        rotateX={4}
        rotateY={-12}
        rotateZ={0.6}
        delay={28}
        style={{
          position: "absolute",
          right: 430,
          top: 280,
          zIndex: 12,
        }}
      />

      {/* Far Right Stack: 3 Personas × 3 Languages Live Cards */}
      <div
        style={{
          position: "absolute",
          right: 68,
          top: 280,
          width: 340,
          height: 575,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          zIndex: 16,
        }}
      >
        {[
          {
            badge: "ANALYST · ENGLISH",
            color: C.ice,
            headline: enAnalyst.headline,
            body: enAnalyst.why_it_matters,
            delay: 44,
          },
          {
            badge: "CASUAL FAN · ESPAÑOL",
            color: C.flood,
            headline: esCasual.headline,
            body: esCasual.why_it_matters,
            delay: 58,
          },
          {
            badge: "PLAYER POV · 中文",
            color: C.violet,
            headline: zhPlayer.headline,
            body: zhPlayer.why_it_matters,
            delay: 72,
          },
        ].map((card) => (
          <GlassCard
            key={card.badge}
            accent={card.color}
            delay={card.delay}
            style={{ padding: "18px 20px", flex: 1, marginBottom: 10 }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: card.color, letterSpacing: "0.08em" }}>
              {card.badge}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: FONT.sans,
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.25,
                color: C.text,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {card.headline}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: FONT.sans,
                fontSize: 13,
                lineHeight: 1.38,
                color: C.text2,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {card.body}
            </div>
          </GlassCard>
        ))}
      </div>

      <SubtitleBar
        en="The same moment becomes a broadcast overlay and a personal story for every kind of fan."
        zh="同一时刻既能成为转播画面，也能成为每种球迷都能理解的个性故事。"
        duration={270}
      />
    </AbsoluteFill>
  );
};
