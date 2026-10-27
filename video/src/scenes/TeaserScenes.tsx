import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Eyebrow,
  FloodBackdrop,
  GlassCard,
  SerifSpan,
  TiltScreen,
  TopChrome,
} from "../components/ui";
import { blendPose, orbit, project } from "../lib/camera";
import { AGENTS, cue } from "../lib/data";
import {
  LINE_CROSS,
  T_PASS,
  T_RECEIVE,
  T_SPRINT_END,
  passProgress,
  playerAt,
  playerById,
} from "../lib/moment";
import { clamp01, easeInOut, easeOut, pop, ramp, tween } from "../lib/motion";
import { C, FONT } from "../theme";
import { World } from "../three/World";

/* ==========================================================================
   TEASER CUT 1 — VERTICAL 72:12 HERO PASS (0..165, 5.5s)
   ========================================================================== */
export const TeaserPassScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const t = ramp(frame, [0, 38, 102, 165], [0.2, T_PASS, T_RECEIVE, T_SPRINT_END]);
  const poseA = orbit([-8, 0.8, 1], 36, 1.25, 0.36, 42);
  const poseB = orbit([2, 0.5, -1], 48, 0.78, 0.44, 42);
  const pose = blendPose(poseA, poseB, tween(frame, 10, 145, 0, 1, easeInOut));

  const pProg = passProgress(t);
  const p08 = playerAt(playerById("NHR-08"), t);
  const p14 = playerAt(playerById("NHR-14"), t);
  const proj08 = project(pose, width, height, [p08.x, 2.5, p08.z]);
  const proj14 = project(pose, width, height, [p14.x, 2.5, p14.z]);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <World
        pose={pose}
        t={t}
        frame={frame}
        layers={{
          power: [1, 1, 1, 1],
          beams: 1.15,
          stadium: 0.95,
          crowd: 0.9,
          haze: 0.8,
          players: { dim: 1, highlight: ["NHR-08", "NHR-14", "ORN-06"], fadeOthers: 0.4 },
          ball: 1,
          pressure: 1,
          ribbon: { reveal: Math.max(0.1, pProg), opacity: 1 },
          curtain: {
            sweep: clamp01((pProg - LINE_CROSS * 0.35) / 0.65),
            opacity: tween(frame, 35, 65, 0, 0.9),
          },
          sprint: t > T_RECEIVE ? 1 : 0,
        }}
        fx={{ bloom: 1.2, exposure: 1.06 }}
      />

      {/* Top/Bottom vertical gradients for mobile readability */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(244,247,241,0.88) 0%, transparent 32%, transparent 62%, rgba(244,247,241,0.92) 100%)",
          pointerEvents: "none",
        }}
      />

      <TopChrome vertical chapter="Teaser" clock="72:12" />

      {/* 3D Pinned Player Pills */}
      {[
        { id: "NHR-08", sub: "0.82 PRESS", color: C.ice, proj: proj08 },
        { id: "NHR-14", sub: "33.4 km/h", color: C.flood, proj: proj14 },
      ].map((tag) =>
        tag.proj.visible ? (
          <div
            key={tag.id}
            style={{
              position: "absolute",
              left: tag.proj.x,
              top: tag.proj.y,
              transform: "translate(-50%, -100%)",
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.88)",
              border: `1px solid ${tag.color}88`,
              fontFamily: FONT.mono,
              fontSize: 13,
              color: C.text,
              pointerEvents: "none",
            }}
          >
            <span style={{ color: tag.color, fontWeight: 600 }}>{tag.id}</span> · {tag.sub}
          </div>
        ) : null,
      )}

      {/* Top Vertical Headline */}
      <div style={{ position: "absolute", left: 54, right: 54, top: 136 }}>
        <Eyebrow text="72:12 · THE TURNING POINT" color={C.signal} delay={4} />
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.sans,
            fontSize: 82,
            fontWeight: 750,
            letterSpacing: "-0.045em",
            lineHeight: 0.96,
            color: C.text,
            opacity: tween(frame, 6, 22),
            transform: `translateY(${tween(frame, 6, 22, 24, 0)}px)`,
          }}
        >
          One pass <SerifSpan gradient="signal">breaks</SerifSpan> the press.
        </div>
      </div>

      {/* Bottom Vertical Telemetry Card */}
      <GlassCard
        accent={C.ice}
        delay={28}
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 78,
          padding: "32px 36px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 13, color: C.ice, letterSpacing: "0.1em" }}>
              LINE-BREAKING PASS · e-000974
            </div>
            <div
              style={{
                fontFamily: FONT.sans,
                fontSize: 128,
                fontWeight: 800,
                letterSpacing: "-0.055em",
                lineHeight: 0.92,
                color: C.text,
                marginTop: 6,
              }}
            >
              24.6 <span style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 58, color: C.ice }}>m</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 13, color: C.flood }}>DIFFICULTY</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 48, fontWeight: 700, color: C.flood }}>8.7</div>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${C.line}`,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text3 }}>PRESSURE</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: C.signal, marginTop: 4 }}>
              0.82
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text3 }}>xT ADDED</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: C.ice, marginTop: 4 }}>
              +0.174
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text3 }}>SPRINT</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: C.flood, marginTop: 4 }}>
              33.4 <span style={{ fontSize: 14 }}>km/h</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};

/* ==========================================================================
   TEASER CUT 2 — VERTICAL 5-AGENT & RELEASE GATE (165..270, 3.5s = 105f)
   ========================================================================== */
export const TeaserGateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = tween(frame, 18, 42, 0, 100, easeOut);
  const stamp = pop(frame, 44, 30, 14, 0.7, 150);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.violet} secondary={C.verify} />
      <TopChrome vertical chapter="Release Gate" clock="72:12" />

      <div style={{ position: "absolute", left: 54, right: 54, top: 136 }}>
        <Eyebrow text="5 AI AGENTS · DETERMINISTIC RELEASE GATE" color={C.violet} delay={2} />
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.sans,
            fontSize: 78,
            fontWeight: 750,
            letterSpacing: "-0.045em",
            lineHeight: 0.96,
            color: C.text,
          }}
        >
          Not just a claim.
          <br />
          <SerifSpan gradient="flood">A verified call.</SerifSpan>
        </div>
      </div>

      {/* 5 Agent Pills Row */}
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 420,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 10,
        }}
      >
        {AGENTS.map((a, i) => {
          const col = [C.ice, C.flood, C.violet, C.signal, C.verify][i];
          return (
            <GlassCard key={a.id} accent={col} delay={6 + i * 4} style={{ padding: "16px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 11, color: col }}>0{i + 1}</div>
              <div style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: 700, color: C.text, marginTop: 6 }}>
                {a.short}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Hallucination Strike Card */}
      <GlassCard
        accent={C.signal}
        delay={14}
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 560,
          padding: "28px 32px",
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.signal, letterSpacing: "0.08em" }}>
          ✕ ADVERSARIAL SUPERLATIVE BLOCKED BY FACTCHECKER
        </div>
        <div style={{ marginTop: 12, fontFamily: FONT.sans, fontSize: 32, fontWeight: 650, color: C.text }}>
          “33.4 km/h —{" "}
          <span style={{ position: "relative", color: C.signal, display: "inline-block" }}>
            fastest sprint all night
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "52%",
                width: `${strike}%`,
                height: 4,
                background: C.signal,
              }}
            />
          </span>
          ”
        </div>
        <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 14, color: C.text2 }}>
          Counter-proof: <span style={{ color: C.flood }}>e-000425 (31&apos;)</span> hit 33.8 km/h → Sent back for 1 bounded revision.
        </div>
      </GlassCard>

      {/* Bounded Revision Verified Output Card */}
      <GlassCard
        accent={C.ice}
        delay={24}
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 850,
          padding: "30px 32px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.ice, letterSpacing: "0.08em" }}>
            ✓ REVISED BY STORYPRODUCER · GROUNDED TO EVENT PROOF
          </span>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.verify }}>MAX_LOOP = 1</span>
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT.sans,
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.25,
            color: C.text,
          }}
        >
          “NHR-08 escapes ORN&apos;s press trap at <span style={{ color: C.flood }}>72:12</span> — threading a{" "}
          <span style={{ color: C.ice }}>24.6 m</span> pass under{" "}
          <span style={{ color: C.signal }}>0.82 pressure</span> for{" "}
          <span style={{ color: C.verify }}>+0.1736 xT</span>.”
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          {[
            ["e-000973", C.signal],
            ["e-000974", C.ice],
            ["e-000975", C.flood],
            ["pressure-v1: 0.82", C.signal],
            ["xt-grid-v1: +0.1736", C.verify],
          ].map(([label, col]) => (
            <span
              key={label}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: `${col}14`,
                border: `1px solid ${col}55`,
                fontFamily: FONT.mono,
                fontSize: 13,
                color: col,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </GlassCard>

      {/* Deterministic Gate Stamp Card */}
      <GlassCard
        accent={C.verify}
        delay={34}
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 84,
          padding: "36px",
          border: `2px solid ${C.verify}`,
          transform: `scale(${0.92 + stamp * 0.08})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 13, color: C.verify, letterSpacing: "0.1em" }}>
              DETERMINISTIC VERIFIER
            </div>
            <div
              style={{
                fontFamily: FONT.sans,
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.95,
                color: C.verify,
                marginTop: 6,
              }}
            >
              PASS
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: FONT.mono }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>5 / 5 CLAIMS</div>
            <div style={{ fontSize: 14, color: C.ice, marginTop: 6 }}>e-000973 → e-000977</div>
            <div style={{ fontSize: 14, color: C.flood, marginTop: 4 }}>AIR AT 73:32 STOPPAGE</div>
          </div>
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};

/* ==========================================================================
   TEASER CUT 3 — VERTICAL MULTI-SURFACE SHOWCASE (270..360, 3.0s = 90f)
   ========================================================================== */
export const TeaserSurfacesScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.signal} secondary={C.ice} />
      <TopChrome vertical chapter="Surfaces" clock="73:32" />

      <div style={{ position: "absolute", left: 54, right: 54, top: 136 }}>
        <Eyebrow text="STUDIO · OVERLAY · FAN COMPANION" color={C.ice} delay={2} />
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT.sans,
            fontSize: 74,
            fontWeight: 750,
            letterSpacing: "-0.045em",
            lineHeight: 0.96,
            color: C.text,
          }}
        >
          One workspace.
          <br />
          <SerifSpan gradient="signal">Every audience.</SerifSpan>
        </div>
      </div>

      <TiltScreen
        src="screens/studio.png"
        label="MatchMind Studio · Control Room"
        url="matchmind/#/studio"
        accent={C.signal}
        width={972}
        height={580}
        rotateX={5}
        rotateY={-8}
        delay={6}
        style={{
          position: "absolute",
          left: 54,
          top: 410,
          zIndex: 10,
        }}
      />

      <TiltScreen
        src="screens/overlay.png"
        label="Broadcast Lower-Third Cue"
        url="matchmind/#/overlay"
        accent={C.flood}
        width={972}
        height={540}
        rotateX={5}
        rotateY={8}
        delay={18}
        style={{
          position: "absolute",
          left: 54,
          bottom: 250,
          zIndex: 15,
        }}
      />

      {/* Bottom Live Cue Strip */}
      <GlassCard
        accent={C.verify}
        delay={26}
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          bottom: 74,
          padding: "22px 28px",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.verify }}>
            ● ON AIR · ANALYST / CASUAL / PLAYER · EN / ES / ZH
          </span>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.flood }}>73:32</span>
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: 24, fontWeight: 700, color: C.text, marginTop: 6 }}>
          {cue.headline}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};

/* ==========================================================================
   TEASER CUT 4 — VERTICAL OUTRO (360..450, 3.0s = 90f)
   ========================================================================== */
export const TeaserOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pose = orbit([0, 0, 0], ramp(frame, [0, 90], [98, 128]), 0.52 + frame * 0.003, 0.58, 44);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <World
        pose={pose}
        t={2.7}
        frame={frame}
        layers={{
          power: [1, 1, 1, 1],
          beams: 1.25,
          stadium: 1,
          crowd: 0.9,
          haze: 0.9,
          players: { dim: 0.9, highlight: ["NHR-08", "NHR-14", "ORN-06"], fadeOthers: 0.3 },
          ball: 1,
          pressure: 0.9,
          ribbon: { reveal: 1, opacity: 0.95 },
        }}
        fx={{ bloom: 1.3, exposure: 1.0 }}
      />

      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 48%, rgba(244,247,241,0.55) 0%, rgba(244,247,241,0.92) 80%)",
          pointerEvents: "none",
        }}
      />

      <TopChrome vertical chapter="MatchMind" clock="FULL TIME" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 64px",
        }}
      >
        <Eyebrow text="MATCHMIND · DAYLIGHT" color={C.flood} delay={4} />

        <div
          style={{
            marginTop: 28,
            fontFamily: FONT.sans,
            fontSize: 108,
            fontWeight: 750,
            letterSpacing: "-0.048em",
            lineHeight: 0.94,
            color: C.text,
            opacity: tween(frame, 6, 22),
            transform: `translateY(${tween(frame, 6, 22, 24, 0)}px)`,
          }}
        >
          See the game
          <br />
          <SerifSpan gradient="signal">beneath</SerifSpan>
          <br />
          the game.
        </div>

        <div
          style={{
            marginTop: 44,
            padding: "18px 34px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.9)",
            border: `1px solid ${C.flood}44`,
            boxShadow: "0 20px 60px rgba(33,72,45,0.16)",
            fontFamily: FONT.mono,
            fontSize: 22,
            color: C.text,
            opacity: tween(frame, 16, 34),
          }}
        >
          ruziniuuuuu.github.io/matchmind
        </div>
      </div>
    </AbsoluteFill>
  );
};
