import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Eyebrow, FloodBackdrop, GlassCard, SerifSpan, SubtitleBar, TopChrome } from "../components/ui";
import { AGENTS, displayPlayer, FACTS, hero } from "../lib/data";
import { easeOut, pop, tween } from "../lib/motion";
import { C, FONT, GRAD } from "../theme";

/* ==========================================================================
   SCENE 4 — VERIFIED INTELLIGENCE BEHIND THE SCENES (870..1140, 9s = 270f)
   ========================================================================== */
export const AgentsScene: React.FC = () => {
  const frame = useCurrentFrame();

  const agentColors = [C.ice, C.flood, C.violet, C.signal, C.verify];

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.violet} secondary={C.ice} />

      <TopChrome code="04" chapter="Verified Intelligence" clock="72:12" />

      {/* Header */}
      <div style={{ position: "absolute", left: 68, top: 112, right: 68, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <Eyebrow text="BEHIND THE SCENES · VERIFIED INTELLIGENCE" color={C.violet} delay={4} />
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT.sans,
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: C.text,
              opacity: tween(frame, 8, 26),
              transform: `translateY(${tween(frame, 8, 26, 22, 0)}px)`,
            }}
          >
            The intelligence stays <SerifSpan gradient="ai">behind the scenes.</SerifSpan>
          </div>
        </div>

        {/* Central Blackboard Status Pill */}
        <GlassCard
          accent={C.violet}
          delay={16}
          style={{
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.violet, letterSpacing: "0.1em" }}>
              SHARED BLACKBOARD STATE
            </div>
            <div style={{ fontFamily: FONT.sans, fontSize: 18, fontWeight: 600, color: C.text, marginTop: 2 }}>
              {hero.blackboard.narrative_title}
            </div>
          </div>
          <div
            style={{
              padding: "6px 12px",
              borderRadius: 99,
              background: "rgba(139, 124, 255, 0.16)",
              border: `1px solid ${C.violet}55`,
              fontFamily: FONT.mono,
              fontSize: 12,
              color: C.ice,
            }}
          >
            {FACTS.dedupedClaims} claims deduped
          </div>
        </GlassCard>
      </div>

      {/* Animated SVG Graph Bus Connecting Blackboard & 5 Agents */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}
      >
        <defs>
          <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.ice} stopOpacity="0.15" />
            <stop offset="50%" stopColor={C.violet} stopOpacity="0.75" />
            <stop offset="100%" stopColor={C.verify} stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {/* Horizontal Evidence Spine */}
        <line
          x1={140}
          y1={305}
          x2={140 + 1640 * tween(frame, 18, 85, 0, 1, easeOut)}
          y2={305}
          stroke="url(#busGrad)"
          strokeWidth={2}
          strokeDasharray="6 6"
        />
        {AGENTS.map((_, idx) => {
          const cx = 240 + idx * 360;
          const p = tween(frame, 20 + idx * 10, 52 + idx * 10);
          const col = agentColors[idx];
          const pulseY = 305 + ((frame * 2.4 + idx * 19) % 52);
          return (
            <g key={idx} opacity={p}>
              <circle cx={cx} cy={305} r={5} fill={col} />
              <line x1={cx} y1={305} x2={cx} y2={355} stroke={col} strokeWidth={2} strokeOpacity={0.55} />
              <circle cx={cx} cy={pulseY} r={3.5} fill={col} />
            </g>
          );
        })}
      </svg>

      {/* User outcomes, with agent infrastructure kept behind the scenes. */}
      <div
        style={{
          position: "absolute",
          top: 390,
          left: 68,
          right: 68,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          zIndex: 10,
        }}
      >
        {[
          {
            label: "UNDERSTAND",
            title: "Read the play",
            body: "Pressure, passing lanes and momentum become visible.",
            color: C.ice,
          },
          {
            label: "TRUST",
            title: "Check every claim",
            body: "Event-level evidence blocks unsupported numbers.",
            color: C.verify,
          },
          {
            label: "SHARE",
            title: "Serve every audience",
            body: "One verified moment, ready for broadcast and fans.",
            color: C.flood,
          },
        ].map((item, index) => (
          <GlassCard
            key={item.label}
            accent={item.color}
            delay={28 + index * 16}
            style={{ padding: "30px 28px", minHeight: 310 }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: item.color, letterSpacing: "0.1em" }}>
              {item.label}
            </div>
            <div
              style={{
                marginTop: 26,
                fontFamily: FONT.sans,
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: C.text,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                marginTop: 18,
                maxWidth: 300,
                fontFamily: FONT.sans,
                fontSize: 20,
                lineHeight: 1.5,
                color: C.text2,
              }}
            >
              {item.body}
            </div>
          </GlassCard>
        ))}
      </div>

      <SubtitleBar
        en="Specialist agents share one evidence trail, separating pattern discovery from the story each audience receives."
        duration={270}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 5 — BOUNDED REVISION LOOP (1140..1410, 9s = 270f)
   ========================================================================== */
export const RevisionScene: React.FC = () => {
  const frame = useCurrentFrame();

  const strike = tween(frame, 68, 108, 0, 100, easeOut);
  const loopProgress = tween(frame, 88, 138, 0, 1, easeOut);
  const chSprint = hero.blackboard.hallucination_challenges[0];
  const chCue = hero.blackboard.hallucination_challenges[1];

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.signal} secondary={C.verify} />

      <TopChrome code="05" chapter="Adversarial Fact-Check & Revision" clock="72:12" />

      {/* Header */}
      <div style={{ position: "absolute", left: 68, top: 112 }}>
        <Eyebrow text="HALLUCINATION GUARD · BOUNDED REVISION (MAX = 1)" color={C.signal} delay={4} />
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT.sans,
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            color: C.text,
            opacity: tween(frame, 8, 26),
            transform: `translateY(${tween(frame, 8, 26, 22, 0)}px)`,
          }}
        >
          No hype. <SerifSpan gradient="signal">Only proven facts.</SerifSpan>
        </div>
      </div>

      {/* 3-Column Comparison: Rejected Draft -> Bounded Checker Loop -> Verified Release */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 68,
          right: 68,
          bottom: 118,
          display: "grid",
          gridTemplateColumns: "1fr 250px 1fr",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* Left: Exaggerated AI Drafts */}
        <GlassCard
          accent={C.signal}
          delay={22}
          style={{
            padding: "32px 34px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `1px solid ${C.signal}55`,
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  background: "rgba(255, 77, 46, 0.16)",
                  border: `1px solid ${C.signal}66`,
                  fontFamily: FONT.mono,
                  fontSize: 12,
                  color: C.signal,
                }}
              >
                ✕ BLOCKED DRAFT · UNSUPPORTED CLAIMS
              </span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text3 }}>
                attempt #1
              </span>
            </div>

            {/* Trap 1: Superlative Sprint */}
            <div
              style={{
                marginTop: 26,
                padding: "20px 22px",
                borderRadius: 14,
                background: "rgba(255, 77, 46, 0.06)",
                border: `1px solid rgba(255, 77, 46, 0.22)`,
              }}
            >
              <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.signal, letterSpacing: "0.08em" }}>
                CHALLENGE 01 · {chSprint.issue.code.toUpperCase()}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: FONT.sans,
                  fontSize: 28,
                  fontWeight: 650,
                  lineHeight: 1.28,
                  color: C.text,
                }}
              >
                “At 72&apos;, {displayPlayer(FACTS.receiver)} hits 33.4 km/h —{" "}
                <span style={{ position: "relative", color: C.signal, display: "inline-block" }}>
                  the fastest sprint all night.
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "52%",
                      width: `${strike}%`,
                      height: 3.5,
                      background: C.signal,
                      boxShadow: `0 0 12px ${C.signal}`,
                    }}
                  />
                </span>
                ”
              </div>
              <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 13, color: C.text2 }}>
                Counter-proof: <span style={{ color: C.flood }}>e-000425 (31&apos;)</span> recorded{" "}
                <span style={{ color: C.flood }}>33.8 km/h</span> &gt; 33.4 km/h.
              </div>
            </div>

            {/* Trap 2: Hallucinated Cue Number */}
            <div
              style={{
                marginTop: 18,
                padding: "20px 22px",
                borderRadius: 14,
                background: "rgba(255, 77, 46, 0.06)",
                border: `1px solid rgba(255, 77, 46, 0.22)`,
              }}
            >
              <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.signal, letterSpacing: "0.08em" }}>
                CHALLENGE 02 · {chCue.issue.code.toUpperCase()}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: FONT.sans,
                  fontSize: 26,
                  fontWeight: 650,
                  lineHeight: 1.28,
                  color: C.text,
                }}
              >
                “{displayPlayer(FACTS.passer)} posts a{" "}
                <span style={{ position: "relative", color: C.signal, display: "inline-block" }}>
                  94.6% pass threat index
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "52%",
                      width: `${strike}%`,
                      height: 3.5,
                      background: C.signal,
                      boxShadow: `0 0 12px ${C.signal}`,
                    }}
                  />
                </span>{" "}
                to slice the press.”
              </div>
              <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 13, color: C.text2 }}>
                Token <span style={{ color: C.signal }}>&apos;94.6&apos;</span> is absent from verified metric_refs.
              </div>
            </div>
          </div>

          <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.signal }}>
            STATUS: SENT BACK TO STORY PRODUCER (MAX_REVISION = 1)
          </div>
        </GlassCard>

        {/* Center: Bounded Revision Loop Bridge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            opacity: tween(frame, 75, 105),
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "20px 18px",
              borderRadius: 16,
              background: "rgba(255, 255, 255, 0.9)",
              border: `1px solid ${C.violet}66`,
              textAlign: "center",
              boxShadow: `0 0 36px ${C.violet}26`,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.violet, letterSpacing: "0.1em" }}>
              FACT CHECKER + MCP
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 14, color: C.ice, marginTop: 8 }}>
              get_pressure_comparison
            </div>
            <div
              style={{
                marginTop: 14,
                height: 4,
                borderRadius: 99,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${loopProgress * 100}%`,
                  height: "100%",
                  background: GRAD.ai,
                }}
              />
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.flood, marginTop: 12 }}>
              1 BOUNDED REVISION →
            </div>
          </div>
        </div>

        {/* Right: Re-verified Broadcast Release */}
        <GlassCard
          accent={C.verify}
          delay={112}
          style={{
            padding: "32px 34px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `1px solid ${C.verify}55`,
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  background: "rgba(61, 245, 166, 0.14)",
                  border: `1px solid ${C.verify}66`,
                  fontFamily: FONT.mono,
                  fontSize: 12,
                  color: C.verify,
                }}
              >
                ✓ REVISED & DETERMINISTICALLY VERIFIED
              </span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.verify }}>
                PASS
              </span>
            </div>

            <div
              style={{
                marginTop: 28,
                fontFamily: FONT.sans,
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
                color: C.text,
              }}
            >
              “{displayPlayer(FACTS.passer)} releases {displayPlayer(FACTS.receiver)} beyond the press.”
            </div>

            <div
              style={{
                marginTop: 26,
                padding: "18px 20px",
                borderRadius: 14,
                background: "rgba(61, 245, 166, 0.06)",
                border: `1px solid ${C.verify}33`,
              }}
            >
              <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.verify, letterSpacing: "0.08em" }}>
                GROUNDED CUE PAYLOAD · cue-mo-e-000974
              </div>
              <div style={{ marginTop: 8, fontFamily: FONT.mono, fontSize: 15, color: C.text }}>
                24.6 m · 0.82 pressure · +0.174 xT
              </div>
              <div style={{ marginTop: 6, fontFamily: FONT.sans, fontSize: 15, color: C.text2 }}>
                Chance created. Shot saved.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: FONT.mono,
              fontSize: 12,
              color: C.verify,
            }}
          >
            <span>0 UNGROUNDED NUMBERS</span>
            <span>READY FOR RELEASE GATE</span>
          </div>
        </GlassCard>
      </div>

      <SubtitleBar
        en="When a claim outruns the evidence, the checker rejects it and allows one bounded correction."
        duration={270}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 6 — DETERMINISTIC EVIDENCE GATE (1410..1650, 8s = 240f)
   ========================================================================== */
export const EvidenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const claims = hero.insight.insight.claims;
  const claimSummaries = [
    `${displayPlayer(FACTS.passer)} completes the line-breaking pass.`,
    "The pass adds +0.174 xT.",
    `${displayPlayer(FACTS.receiver)} turns the escape into a shot.`,
    "Difficulty exceeds the window profile.",
    "Both teams threaten at 1–1.",
  ];
  const stamp = pop(frame, 95, 30, 14, 0.75, 150);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.verify} secondary={C.ice} />

      <TopChrome code="06" chapter="Deterministic Release Gate" clock="72:12" />

      {/* Header */}
      <div style={{ position: "absolute", left: 68, top: 112 }}>
        <Eyebrow text="VERIFY_CANDIDATE() + VERIFY_CUE() · ZERO-HALLUCINATION GATE" color={C.verify} delay={4} />
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT.sans,
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            color: C.text,
            opacity: tween(frame, 8, 26),
            transform: `translateY(${tween(frame, 8, 26, 22, 0)}px)`,
          }}
        >
          Models explain. <SerifSpan gradient="flood">The verifier decides.</SerifSpan>
        </div>
      </div>

      {/* Main Layout: 5 Verified Claims + Deterministic Gate Stamp */}
      <div
        style={{
          position: "absolute",
          top: 274,
          left: 68,
          right: 68,
          bottom: 112,
          display: "grid",
          gridTemplateColumns: "1.42fr 0.58fr",
          gap: 26,
        }}
      >
        {/* Left: Claim-by-Claim Event Proof Table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {claims.map((claim, idx) => (
            <GlassCard
              key={idx}
              accent={C.ice}
              delay={18 + idx * 11}
              style={{
                padding: "16px 22px",
                display: "grid",
                gridTemplateColumns: "56px 1fr auto",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(61, 245, 166, 0.12)",
                  border: `1px solid ${C.verify}55`,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: FONT.mono,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.verify,
                }}
              >
                C0{idx + 1}
              </div>

              <div>
                <div
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 17,
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: C.text,
                  }}
                >
                  {claimSummaries[idx]}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {claim.event_ids.map((eid) => (
                    <span
                      key={eid}
                      style={{
                        padding: "2px 9px",
                        borderRadius: 6,
                        background: "rgba(92, 200, 255, 0.12)",
                        border: `1px solid ${C.ice}44`,
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: C.ice,
                      }}
                    >
                      {eid}
                    </span>
                  ))}
                  {claim.metric_refs.map((m) => (
                    <span
                      key={m.name}
                      style={{
                        padding: "2px 9px",
                        borderRadius: 6,
                        background: "rgba(255, 227, 179, 0.10)",
                        border: `1px solid ${C.flood}44`,
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: C.flood,
                      }}
                    >
                      {m.name}: {m.value} ({m.formula_version})
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "right", fontFamily: FONT.mono }}>
                <div style={{ fontSize: 11, color: C.verify }}>VERIFIED</div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Right: Release Gate Certificate */}
        <GlassCard
          accent={C.verify}
          delay={60}
          style={{
            padding: "34px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `1px solid ${C.verify}66`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.65), 0 0 50px ${C.verify}22`,
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.verify, letterSpacing: "0.12em" }}>
              RELEASE GATE VERDICT
            </div>

            <div
              style={{
                marginTop: 22,
                padding: "24px",
                borderRadius: 18,
                background: "rgba(61, 245, 166, 0.10)",
                border: `2px solid ${C.verify}`,
                textAlign: "center",
                transform: `scale(${0.88 + stamp * 0.12})`,
                opacity: tween(frame, 85, 105),
              }}
            >
              <div
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 88,
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  lineHeight: 0.95,
                  color: C.verify,
                  textShadow: `0 0 32px ${C.verify}55`,
                }}
              >
                PASS
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 13, color: C.text, marginTop: 10 }}>
                {FACTS.checkedClaims} / {FACTS.checkedClaims} CLAIMS VERIFIED
              </div>
            </div>

            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Event ID existence", "7/7 grounded"],
                ["Numeric token parity", "100% matched"],
                ["Superlative guard", "Checked"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    borderBottom: `1px solid ${C.line}`,
                    fontFamily: FONT.mono,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: C.text2 }}>{k}</span>
                  <span style={{ color: C.verify }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text3 }}>
            ENGINE: deterministic candidate &amp; cue verifier
          </div>
        </GlassCard>
      </div>

      <SubtitleBar
        en="Only claims tied to source events and verified metrics survive the deterministic release gate."
        duration={240}
      />
    </AbsoluteFill>
  );
};

/* ==========================================================================
   SCENE 7 — DIRECTOR AIRTIME & HUMAN FINAL CALL (1650..1890, 8s = 240f)
   ========================================================================== */
export const DirectorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = hero.insight.rundown.slice(0, 6);
  const approveLock = pop(frame, 110, 30, 14, 0.7, 140);

  return (
    <AbsoluteFill style={{ background: C.ink0 }}>
      <FloodBackdrop accent={C.flood} secondary={C.signal} />

      <TopChrome code="07" chapter="Director & Airtime Control" clock="73:32" />

      {/* Header */}
      <div style={{ position: "absolute", left: 68, top: 112 }}>
        <Eyebrow text="DIRECTOR AGENT · RUNDOWN RANKING & STOPPAGE SCHEDULING" color={C.flood} delay={4} />
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT.sans,
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            color: C.text,
            opacity: tween(frame, 8, 26),
            transform: `translateY(${tween(frame, 8, 26, 22, 0)}px)`,
          }}
        >
          Not every moment <SerifSpan gradient="signal">deserves air.</SerifSpan>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 274,
          left: 68,
          right: 68,
          bottom: 112,
          display: "grid",
          gridTemplateColumns: "1.32fr 0.68fr",
          gap: 26,
        }}
      >
        {/* Left: Ranked Rundown Queue */}
        <GlassCard accent={C.flood} delay={16} style={{ padding: "26px 30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 16,
              borderBottom: `1px solid ${C.line}`,
              fontFamily: FONT.mono,
              fontSize: 12,
              color: C.text3,
              letterSpacing: "0.08em",
            }}
          >
            <span>DIRECTOR&apos;S LIVE RUNDOWN (37 CANDIDATES EVALUATED)</span>
            <span style={{ color: C.flood }}>STOPPAGE WINDOW: 73:32</span>
          </div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((entry, idx) => {
              const isHero = idx === 0;
              const a = tween(frame, 24 + idx * 10, 42 + idx * 10);
              return (
                <div
                  key={entry.moment_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "58px 170px 1fr 120px 110px",
                    alignItems: "center",
                    gap: 14,
                    padding: isHero ? "18px 20px" : "13px 20px",
                    borderRadius: 14,
                    background: isHero
                      ? "linear-gradient(90deg, rgba(255,77,46,0.18), rgba(255,227,179,0.08))"
                      : "rgba(255,255,255,0.025)",
                    border: isHero ? `1px solid ${C.signal}88` : `1px solid ${C.line}`,
                    opacity: a,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 15,
                      fontWeight: 700,
                      color: isHero ? C.flood : C.text3,
                    }}
                  >
                    #{String(entry.rank).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 15,
                      fontWeight: 600,
                      color: isHero ? C.text : C.text2,
                    }}
                  >
                    {entry.moment_id}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 15,
                      color: isHero ? C.text : C.text3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {isHero
                      ? `72:12 · ${displayPlayer(FACTS.passer)} breaks the press`
                      : "Lower priority"}
                  </span>
                  <span
                    style={{
                      justifySelf: "end",
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: isHero ? "rgba(61,245,166,0.16)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isHero ? C.verify : C.line}`,
                      fontFamily: FONT.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      color: isHero ? C.verify : C.text3,
                      textTransform: "uppercase",
                    }}
                  >
                    {entry.action}
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: FONT.mono,
                      fontSize: 14,
                      color: isHero ? C.flood : C.text3,
                    }}
                  >
                    {entry.air_at ? `${entry.air_at.minute}:${String(entry.air_at.second).padStart(2, "0")}` : "HOLD"}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Right: Human-in-the-Loop Operator Console */}
        <GlassCard
          accent={C.signal}
          delay={54}
          style={{
            padding: "30px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.signal, letterSpacing: "0.1em" }}>
              HUMAN-IN-THE-LOOP RELEASE
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: FONT.sans,
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                color: C.text,
              }}
            >
              <SerifSpan gradient="flood">A human calls air.</SerifSpan>
            </div>

            {/* Guardrails */}
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["DEDUPE WINDOW", "60 sec", C.ice],
                ["AIR DURATION", "8.0 sec", C.verify],
                ["PRIORITY SCORE", "0.80 (#1)", C.signal],
              ].map(([k, v, col]) => (
                <div
                  key={k}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.line}`,
                  }}
                >
                  <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.text3 }}>{k}</div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 22, fontWeight: 600, color: col, marginTop: 4 }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operator Action Buttons */}
          <div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.text2, marginBottom: 12 }}>
              PRODUCER OVERRIDE CONTROLS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 12 }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.verify}33, ${C.verify}14)`,
                  border: `2px solid ${C.verify}`,
                  boxShadow: `0 0 28px ${C.verify}44`,
                  textAlign: "center",
                  fontFamily: FONT.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.verify,
                  transform: `scale(${0.95 + approveLock * 0.05})`,
                }}
              >
                ✓ APPROVE ON AIR
              </div>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.line}`,
                  textAlign: "center",
                  fontFamily: FONT.mono,
                  fontSize: 14,
                  color: C.text2,
                }}
              >
                ⏸ HOLD
              </div>
              <div
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.line}`,
                  textAlign: "center",
                  fontFamily: FONT.mono,
                  fontSize: 14,
                  color: C.text3,
                }}
              >
                ✕ KILL
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <SubtitleBar
        en="The Director ranks verified moments for the next stoppage; the producer retains the final call."
        duration={240}
      />
    </AbsoluteFill>
  );
};
