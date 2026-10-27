import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Eyebrow, FloodBackdrop, GlassCard, SerifSpan, SubtitleBar, TopChrome } from "../components/ui";
import { blendPose, orbit, project } from "../lib/camera";
import { FACTS } from "../lib/data";
import {
  LINE_CROSS,
  T_PASS,
  T_RECEIVE,
  T_SPRINT_END,
  passProgress,
  playerAt,
  playerById,
} from "../lib/moment";
import { clamp01, easeInOut, easeOut, life, pop, ramp, tween } from "../lib/motion";
import { C, FONT, GRAD } from "../theme";
import { World } from "../three/World";

/* ==========================================================================
   SCENE 1 — STORM (0..240, 8s)
   ========================================================================== */
export const StormScene: React.FC = () => {
  const frame = useCurrentFrame();
  const form = tween(frame, 8, 118, 0, 1, easeInOut);
  const collapse = tween(frame, 155, 225, 0, 0.92, easeInOut);
  const pitchPower = tween(frame, 40, 130, 0.15, 0.55) * (1 - collapse * 0.65);

  const poseA = orbit([0, 8, 0], 125, -0.35 + frame * 0.0035, 0.58, 44);
  const poseB = orbit([0, 2, 0], 88, 0.25 + frame * 0.002, 0.72, 38);
  const pose = blendPose(poseA, poseB, tween(frame, 0, 210, 0, 1, easeInOut));

  const count = Math.round(tween(frame, 6, 108, 0, FACTS.events, easeOut));

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <World
        pose={pose}
        t={0}
        frame={frame}
        layers={{
          power: [pitchPower, pitchPower, pitchPower, pitchPower],
          beams: 0.55,
          stadium: 0.45,
          crowd: 0.35,
          haze: 0.9,
          storm: { form, collapse, opacity: 1, lift: (1 - form) * 6 },
        }}
        fx={{ bloom: 1.25, exposure: 1.05 }}
      />

      {/* Vignette gradient for left-side text legibility */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(244,247,241,0.88) 0%, rgba(244,247,241,0.45) 48%, rgba(244,247,241,0.18) 100%)",
          pointerEvents: "none",
        }}
      />

      <TopChrome code="01" chapter="Event Storm" clock="90:00" />

      {/* Left Hero Counter */}
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 168,
          maxWidth: 820,
        }}
      >
        <Eyebrow text="90 MINUTES · RAW EVENT STREAM" color={C.signal} delay={4} />

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "baseline",
            gap: 22,
            opacity: tween(frame, 8, 24),
            transform: `translateY(${tween(frame, 8, 26, 28, 0)}px)`,
          }}
        >
          <span
            style={{
              fontFamily: FONT.sans,
              fontSize: 176,
              fontWeight: 750,
              letterSpacing: "-0.055em",
              lineHeight: 0.92,
              fontVariantNumeric: "tabular-nums",
              color: C.text,
              textShadow: "0 20px 60px rgba(33,72,45,0.18)",
            }}
          >
            {count.toLocaleString("en-US")}
          </span>
          <span
            style={{
              fontFamily: FONT.serif,
              fontStyle: "italic",
              fontSize: 86,
              backgroundImage: GRAD.signal,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            events.
          </span>
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.sans,
            fontSize: 42,
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1.18,
            color: C.text2,
            opacity: tween(frame, 28, 48),
            transform: `translateY(${tween(frame, 28, 48, 20, 0)}px)`,
          }}
        >
          Passes, press traps, carries, sprints —<br />
          <span style={{ color: C.text }}>all collapsed into a single scoreline.</span>
        </div>

        {/* Event type breakdown pills */}
        <div
          style={{
            marginTop: 34,
            display: "flex",
            gap: 12,
            opacity: tween(frame, 52, 74),
            transform: `translateY(${tween(frame, 52, 74, 16, 0)}px)`,
          }}
        >
          {[
            { label: "PASS & PROGRESSION", color: C.ice },
            { label: "PRESSURE & TRAPS", color: C.signal },
            { label: "SHOTS & GOALS", color: C.flood },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.82)",
                border: `1px solid ${item.color}40`,
                fontFamily: FONT.mono,
                fontSize: 12,
                letterSpacing: "0.08em",
                color: C.text2,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 99,
                  background: item.color,
                  boxShadow: `0 0 8px ${item.color}`,
                }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right Contrast Card: Scoreline vs Reality */}
      <GlassCard
        accent={C.flood}
        delay={118}
        style={{
          position: "absolute",
          right: 68,
          bottom: 118,
          width: 540,
          padding: "30px 34px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: FONT.mono,
            fontSize: 12,
            letterSpacing: "0.1em",
            color: C.text3,
            textTransform: "uppercase",
          }}
        >
          <span>THE BLIND SPOT</span>
          <span style={{ color: C.signal }}>99.8% UNSEEN</span>
        </div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            paddingBottom: 18,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text2 }}>FINAL SCORE</div>
            <div
              style={{
                fontFamily: FONT.sans,
                fontSize: 54,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: C.text,
              }}
            >
              2 <span style={{ color: C.text3 }}>—</span> 1
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text2 }}>HIDDEN TURNING POINT</div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 32,
                fontWeight: 500,
                color: C.flood,
              }}
            >
              72:12 · e-000974
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.sans,
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: C.text,
          }}
        >
          Where did the game{" "}
          <SerifSpan gradient="signal">actually</SerifSpan> turn?
        </div>
      </GlassCard>

      <SubtitleBar
        en="1,275 events. One scoreline. Almost no explanation."
        duration={240}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 2 — REVEAL (240..570, 11s = 330f)
   ========================================================================== */
export const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Sequential floodlight tower ignition
  const power = [
    tween(frame, 4, 42, 0.12, 1),
    tween(frame, 18, 56, 0.12, 1),
    tween(frame, 32, 70, 0.12, 1),
    tween(frame, 46, 84, 0.12, 1),
  ];

  // Camera sweeps down from high stadium rim to tactical broadcast angle
  const highOrbit = orbit([0, 0, 0], 168, 0.32 + frame * 0.0012, 0.78, 42);
  const lowBroadcast = orbit([-5, 0.5, 0], 50, 0.78 + frame * 0.0015, 0.39, 31);
  const pose = blendPose(highOrbit, lowBroadcast, tween(frame, 0, 175, 0, 1, easeInOut));

  // Moment time gently advances to show player motion and pass corridor
  const t = ramp(frame, [0, 140, 330], [-0.4, 1.8, 2.75]);
  const pressureAmt = tween(frame, 95, 155, 0, 1);
  const ribbonReveal = tween(frame, 135, 225, 0, 1, easeOut);
  const curtainAmt = tween(frame, 170, 240, 0, 0.85, easeOut);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <World
        pose={pose}
        t={t}
        frame={frame}
        layers={{
          power,
          beams: 1.15,
          stadium: 0.95,
          crowd: 0.85,
          haze: 0.85,
          players: {
            dim: tween(frame, 30, 85, 0, 1),
            highlight: ["NHR-08", "NHR-14", "ORN-06"],
            fadeOthers: tween(frame, 140, 210, 0, 0.35),
          },
          ball: tween(frame, 60, 110, 0, 1),
          pressure: pressureAmt,
          ribbon: { reveal: ribbonReveal, opacity: tween(frame, 130, 165, 0, 1) },
          curtain: { sweep: curtainAmt, opacity: tween(frame, 170, 210, 0, 0.75) },
        }}
        fx={{ bloom: 1.15, exposure: 1.05 }}
      />

      {/* Left atmospheric gradient for editorial copy */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(244,247,241,0.86) 0%, rgba(244,247,241,0.46) 44%, transparent 78%)",
          pointerEvents: "none",
        }}
      />

      <TopChrome code="02" chapter="Daylight Engine" clock="72:12" />

      {/* Editorial Hero Title */}
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 176,
          width: 820,
        }}
      >
        <Eyebrow text="DAYLIGHT · TACTICAL & BROADCAST AI" color={C.flood} delay={12} />

        <div
          style={{
            marginTop: 22,
            fontFamily: FONT.sans,
            fontSize: 102,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 0.96,
            color: C.text,
            textShadow: "0 18px 50px rgba(33,72,45,0.18)",
          }}
        >
          <div
            style={{
              opacity: tween(frame, 18, 38),
              transform: `translateY(${tween(frame, 18, 38, 28, 0)}px)`,
            }}
          >
            See the game
          </div>
          <div
            style={{
              opacity: tween(frame, 28, 48),
              transform: `translateY(${tween(frame, 28, 48, 28, 0)}px)`,
            }}
          >
            <SerifSpan gradient="signal">beneath</SerifSpan> the game.
          </div>
        </div>

        <div
          style={{
            marginTop: 26,
            maxWidth: 620,
            fontFamily: FONT.sans,
            fontSize: 25,
            fontWeight: 450,
            lineHeight: 1.42,
            color: C.text2,
            opacity: tween(frame, 48, 70),
            transform: `translateY(${tween(frame, 48, 70, 18, 0)}px)`,
          }}
        >
          Light up the hidden layer of every match — pressure fields, passing corridors, and verified broadcast storytelling in real time.
        </div>
      </div>

      {/* Bottom-Right Floating Layer Readouts */}
      <div
        style={{
          position: "absolute",
          right: 68,
          bottom: 112,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: 470,
        }}
      >
        {[
          {
            code: "LAYER 01",
            title: "Pressure Heat Field",
            metric: "0.82 press · 84.3th pct",
            color: C.signal,
            delay: 96,
          },
          {
            code: "LAYER 02",
            title: "Line-Breaking Ribbon",
            metric: "24.6 m thread · +0.174 xT",
            color: C.ice,
            delay: 122,
          },
          {
            code: "LAYER 03",
            title: "Deterministic Proof",
            metric: "5/5 claims grounded",
            color: C.verify,
            delay: 148,
          },
        ].map((item) => (
          <GlassCard
            key={item.code}
            accent={item.color}
            delay={item.delay}
            style={{
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: item.color,
                  boxShadow: `0 0 12px ${item.color}`,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: item.color,
                  }}
                >
                  {item.code}
                </div>
                <div
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 20,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {item.title}
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 14,
                fontWeight: 500,
                color: C.text2,
              }}
            >
              {item.metric}
            </div>
          </GlassCard>
        ))}
      </div>

      <SubtitleBar
        en="See the pressure and structure beneath the score."
        duration={330}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 3 — HERO PASS (570..870, 10s = 300f)
   ========================================================================== */
export const HeroPassScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Moment time t: trap (-0.5..2.0), pass flight (2.0..2.95), sprint (2.95..5.2)
  const t = ramp(frame, [0, 65, 165, 300], [-0.4, T_PASS, T_RECEIVE, T_SPRINT_END]);

  // Camera tracks from tight press trap on NHR-08 out to sweeping pass & sprint view
  const camTrap = orbit([-11, 1.0, 1.5], 24, 1.45, 0.28, 30);
  const camPass = orbit([-2, 0.6, -1.5], 40, 0.86, 0.38, 32);
  const camSprint = orbit([8, 0.6, -2.5], 34, 0.62, 0.33, 30);

  const pose =
    frame < 150
      ? blendPose(camTrap, camPass, tween(frame, 20, 145, 0, 1, easeInOut))
      : blendPose(camPass, camSprint, tween(frame, 150, 285, 0, 1, easeInOut));

  const pProg = passProgress(t);
  const curtainOpacity = tween(frame, 80, 115, 0, 0.92);
  const curtainSweep = clamp01((pProg - LINE_CROSS * 0.4) / 0.65);

  // Project 3D positions for on-pitch player callout pills
  const p08 = playerAt(playerById("NHR-08"), t);
  const p06 = playerAt(playerById("ORN-06"), t);
  const p14 = playerAt(playerById("NHR-14"), t);

  const proj08 = project(pose, width, height, [p08.x, 2.5, p08.z]);
  const proj06 = project(pose, width, height, [p06.x, 2.5, p06.z]);
  const proj14 = project(pose, width, height, [p14.x, 2.5, p14.z]);

  const statHit = pop(frame, 75, 30, 15, 0.7, 135);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <World
        pose={pose}
        t={t}
        frame={frame}
        layers={{
          power: [1, 1, 1, 1],
          beams: 1.05,
          stadium: 0.9,
          crowd: 0.9,
          haze: 0.75,
          players: {
            dim: 1,
            highlight: ["NHR-08", "NHR-14", "ORN-06"],
            fadeOthers: 0.45,
          },
          ball: 1,
          pressure: 1,
          ribbon: { reveal: Math.max(0.08, pProg), opacity: 1 },
          curtain: { sweep: curtainSweep, opacity: curtainOpacity },
          sprint: t > T_RECEIVE ? 1 : 0,
        }}
        fx={{
          bloom: 1.2,
          exposure: 1.08,
          dof: frame < 55 ? { focus: 24, range: 22, bokeh: 2.5 } : null,
        }}
      />

      {/* 3D Tracked Player Callouts */}
      {[
        {
          id: "NHR-08",
          role: "LINE-BREAK PASSER",
          stat: "24.6 m · diff 8.7",
          color: C.ice,
          proj: proj08,
          offset: "translate(-92%, -135%)",
          vis: life(frame, 8, 250, 12, 18),
        },
        {
          id: "ORN-06",
          role: "PRESS TRAP",
          stat: "0.90 → 0.82 press",
          color: C.signal,
          proj: proj06,
          offset: "translate(8%, -85%)",
          vis: life(frame, 14, 165, 12, 18),
        },
        {
          id: "NHR-14",
          role: "SPACE RECEIVER",
          stat: "33.4 km/h sprint",
          color: C.flood,
          proj: proj14,
          offset: "translate(-50%, -105%)",
          vis: life(frame, 105, 290, 14, 14),
        },
      ].map((tag) =>
        tag.proj.visible && tag.vis > 0.02 ? (
          <div
            key={tag.id}
            style={{
              position: "absolute",
              left: tag.proj.x,
              top: tag.proj.y,
              transform: tag.offset,
              opacity: tag.vis,
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            <div
              style={{
                padding: "7px 13px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.88)",
                border: `1px solid ${tag.color}88`,
                boxShadow: `0 10px 28px rgba(0,0,0,0.65), 0 0 18px ${tag.color}33`,
                backdropFilter: "blur(10px)",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background: tag.color,
                    boxShadow: `0 0 8px ${tag.color}`,
                  }}
                />
                <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 600, color: C.text }}>
                  {tag.id}
                </span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: tag.color }}>
                  {tag.role}
                </span>
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.text2, marginTop: 2 }}>
                {tag.stat}
              </div>
            </div>
            <div
              style={{
                width: 2,
                height: 18,
                margin: "0 auto",
                background: `linear-gradient(to bottom, ${tag.color}, transparent)`,
              }}
            />
          </div>
        ) : null,
      )}

      <TopChrome code="03" chapter="72:12 · The Turning Point" clock="72:12" />

      {/* Top-Left Scene Title */}
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 118,
          maxWidth: 680,
          pointerEvents: "none",
        }}
      >
        <Eyebrow text="EVENT e-000974 · MINUTE 72:12" color={C.signal} delay={6} />
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT.sans,
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            color: C.text,
            textShadow: "0 14px 40px rgba(33,72,45,0.18)",
            opacity: tween(frame, 10, 28),
            transform: `translateY(${tween(frame, 10, 28, 22, 0)}px)`,
          }}
        >
          One pass <SerifSpan gradient="signal">breaks</SerifSpan> the press.
        </div>
      </div>

      {/* Right Telemetry Lockup */}
      <GlassCard
        accent={C.ice}
        delay={68}
        style={{
          position: "absolute",
          right: 68,
          bottom: 112,
          width: 500,
          padding: "28px 34px",
          transform: `scale(${0.92 + statHit * 0.08})`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: FONT.mono,
            fontSize: 12,
            letterSpacing: "0.1em",
            color: C.ice,
          }}
        >
          <span>NHR-08 → NHR-14 · LINE BREAK</span>
          <span style={{ color: C.flood }}>DIFFICULTY 8.7</span>
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: FONT.sans,
              fontSize: 118,
              fontWeight: 750,
              letterSpacing: "-0.055em",
              lineHeight: 0.92,
              fontVariantNumeric: "tabular-nums",
              color: C.text,
            }}
          >
            {tween(frame, 72, 118, 0, FACTS.distance ?? 0).toFixed(1)}
          </span>
          <span
            style={{
              fontFamily: FONT.sans,
              fontStyle: "normal",
              fontSize: 54,
              color: C.ice,
            }}
          >
            metres
          </span>
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: `1px solid ${C.line}`,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.text3 }}>PRESSURE</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 600, color: C.signal, marginTop: 4 }}>
              0.82
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.text3 }}>xT ADDED</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 600, color: C.ice, marginTop: 4 }}>
              +0.174
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.text3 }}>SPRINT PEAK</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 600, color: C.flood, marginTop: 4 }}>
              33.4 <span style={{ fontSize: 13 }}>km/h</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <SubtitleBar
        en="24.6 metres through 0.82 pressure."
        duration={300}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 10 — OUTRO (2460..2700, 8s = 240f)
   ========================================================================== */
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const pose = orbit(
    [0, 0, 0],
    ramp(frame, [0, 240], [92, 138]),
    0.48 + frame * 0.0018,
    ramp(frame, [0, 240], [0.52, 0.68]),
    38,
  );

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
          players: { dim: 0.85, highlight: ["NHR-08", "NHR-14", "ORN-06"], fadeOthers: 0.3 },
          ball: 1,
          pressure: 0.85,
          ribbon: { reveal: 1, opacity: 0.9 },
          curtain: { sweep: 0.85, opacity: 0.55 },
        }}
        fx={{ bloom: 1.3, exposure: 1.0 }}
      />

      {/* Radial vignette to frame the centerpiece */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(244,247,241,0.58) 0%, rgba(244,247,241,0.88) 78%)",
          pointerEvents: "none",
        }}
      />

      <TopChrome code="10" chapter="Explore MatchMind" clock="FULL TIME" />

      {/* Centerpiece Lockup */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <Eyebrow text="MATCHMIND · DAYLIGHT RELEASE" color={C.flood} delay={6} />

        <div
          style={{
            marginTop: 26,
            fontFamily: FONT.sans,
            fontSize: 112,
            fontWeight: 750,
            letterSpacing: "-0.048em",
            lineHeight: 0.95,
            color: C.text,
            textShadow: "0 20px 48px rgba(33,72,45,0.16)",
            opacity: tween(frame, 12, 34),
            transform: `translateY(${tween(frame, 12, 34, 28, 0)}px)`,
          }}
        >
          See the game
          <br />
          <SerifSpan gradient="signal">beneath</SerifSpan> the game.
        </div>

        <div
          style={{
            marginTop: 26,
            fontFamily: FONT.sans,
            fontSize: 26,
            fontWeight: 450,
            color: C.text2,
            maxWidth: 760,
            opacity: tween(frame, 30, 52),
            transform: `translateY(${tween(frame, 30, 52, 18, 0)}px)`,
          }}
        >
          Verified intelligence for live broadcast and every kind of fan.
        </div>

        {/* CTA URL Pill */}
        <div
          style={{
            marginTop: 42,
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "16px 32px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.9)",
            border: `1px solid ${C.flood}44`,
            boxShadow: "0 20px 60px rgba(33,72,45,0.16)",
            opacity: tween(frame, 46, 68),
            transform: `translateY(${tween(frame, 46, 68, 18, 0)}px)`,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 99,
              background: C.signal,
              boxShadow: `0 0 12px ${C.signal}`,
            }}
          />
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: C.text,
            }}
          >
            ruziniuuuuu.github.io/matchmind
          </span>
          <span
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              fontFamily: FONT.mono,
              fontSize: 12,
              color: C.flood,
              letterSpacing: "0.08em",
            }}
          >
            LIVE INTERACTIVE DEMO ↗
          </span>
        </div>
      </div>

      <SubtitleBar
        en="MatchMind. See the game beneath the game."
        duration={240}
      />
    </AbsoluteFill>
  );
};
