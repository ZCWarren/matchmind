import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const LIME = "#c8ff3d";
const CYAN = "#49d7ff";
const CORAL = "#ff625f";
const TEXT = "#eef4ff";
const MUTED = "#8f9bad";
const DIM = "#5c6878";
const BG = "#070a12";
const SANS = '"IBM Plex Sans", "Segoe UI", sans-serif';
const MONO = '"IBM Plex Mono", monospace';

const mono = (size: number, color = MUTED): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color,
});

const enter = (frame: number, start: number, distance = 24) => ({
  opacity: interpolate(frame, [start, start + 18], [0, 1], { extrapolateRight: "clamp" }),
  transform: `translateY(${interpolate(frame, [start, start + 24], [distance, 0], { extrapolateRight: "clamp" })}px)`,
});

function Backdrop({ accent = LIME }: { accent?: string }) {
  return (
    <>
      <AbsoluteFill style={{ background: BG, zIndex: -1 }} />
      <AbsoluteFill
        style={{
          zIndex: -1,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 45%, black 10%, transparent 78%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: "50%",
          top: -260,
          right: -180,
          background: `radial-gradient(circle, ${accent}26, transparent 66%)`,
          zIndex: -1,
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180, background: "linear-gradient(0deg, rgba(0,0,0,.5), transparent)", zIndex: -1 }} />
    </>
  );
}

function Corner({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div style={{ position: "absolute", left: 48, right: 48, top: 32, display: "flex", justifyContent: "space-between", ...mono(10, DIM) }}>
      <span>MATCHMIND / {label}</span>
      <span>{String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
    </div>
  );
}

function Intro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: frame - 10, fps, config: { damping: 18, mass: 0.7 } });
  const line = interpolate(frame, [0, 32], [0, 520], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 86, justifyContent: "center" }}>
      <Backdrop />
      <div style={{ width: line, height: 3, background: LIME, marginBottom: 28 }} />
      <div style={{ ...mono(12, LIME), marginBottom: 22, opacity: title }}>BROADCAST INTELLIGENCE / ASTER LEAGUE</div>
      <div style={{ fontFamily: SANS, fontSize: 104, fontWeight: 600, letterSpacing: "-0.06em", lineHeight: 0.93, color: TEXT, transform: `translateY(${(1 - title) * 28}px)`, opacity: title }}>
        Every moment,<br /><span style={{ color: LIME }}>explained.</span>
      </div>
      <div style={{ marginTop: 28, maxWidth: 700, color: MUTED, fontFamily: SANS, fontSize: 24, lineHeight: 1.45, opacity: interpolate(frame, [38, 62], [0, 1], { extrapolateRight: "clamp" }) }}>
        Five agents turn football events into verified, timed match intelligence.
        The models explain. The deterministic engine decides what is true.
      </div>
      <div style={{ position: "absolute", right: 86, bottom: 68, ...mono(11, DIM), textAlign: "right" }}>
        STUDIO / OVERLAY / FAN<br />
        <span style={{ color: LIME }}>ONE VERIFIED MOMENT</span>
      </div>
    </AbsoluteFill>
  );
}

function Problem() {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [48, 150], [0, 1275], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const score = interpolate(frame, [190, 220], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
      <Backdrop accent={CORAL} />
      <Corner index={2} total={9} label="THE PROBLEM" />
      <div style={{ ...mono(12, CORAL), ...enter(frame, 10) }}>A MATCH IS NOT A HIGHLIGHT REEL</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 16, ...enter(frame, 24) }}>
        <span style={{ fontFamily: MONO, fontSize: 160, color: TEXT, letterSpacing: "-0.06em", lineHeight: 1 }}>{count.toLocaleString()}</span>
        <span style={{ fontFamily: SANS, fontSize: 30, color: MUTED }}>events.</span>
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 18, opacity: score }}>
        <span style={{ fontFamily: SANS, fontSize: 62, color: LIME, letterSpacing: "-0.04em" }}>One scoreline.</span>
        <span style={{ ...mono(13, DIM) }}>WHAT MATTERED?</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 42 }}>
        {[
          ["01", "DATA", "1,275 events, coordinates, pressure, speed"],
          ["02", "EXPLANATION", "Why this moment changed the match"],
          ["03", "EVIDENCE", "The exact rows behind every number"],
        ].map(([n, title, body], i) => (
          <div key={title} style={{ flex: 1, padding: 17, border: "1px solid rgba(255,255,255,.1)", background: "rgba(11,17,28,.82)", opacity: interpolate(frame, [230 + i * 20, 260 + i * 20], [0, 1], { extrapolateRight: "clamp" }) }}>
            <div style={{ ...mono(9, i === 1 ? LIME : i === 2 ? CORAL : CYAN), marginBottom: 14 }}>{n} / {title}</div>
            <div style={{ fontFamily: SANS, fontSize: 18, color: TEXT, lineHeight: 1.35 }}>{body}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

const metrics = [
  ["xG", "2.05 / 2.02", "shot quality", 72],
  ["xT", "20.6 / 21.9", "threat added", 86],
  ["Pressure", "0.82", "event-level", 82],
  ["Control", "0.61", "home share", 61],
  ["Chaos", "0.85", "event density", 85],
  ["Top speed", "33.8", "km/h", 94],
];

function DataScene() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
      <Backdrop accent={CYAN} />
      <Corner index={3} total={9} label="THE DATA LAYER" />
      <div style={{ ...mono(12, CYAN), ...enter(frame, 10) }}>DETERMINISTIC / EVENT-LEVEL / VERSIONED</div>
      <div style={{ fontFamily: SANS, fontSize: 58, fontWeight: 500, letterSpacing: "-0.04em", color: TEXT, marginTop: 14, ...enter(frame, 22) }}>
        The data is the source of truth.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 34 }}>
        {metrics.map(([name, value, note, width], i) => (
          <div key={name} style={{ padding: 16, border: "1px solid rgba(255,255,255,.1)", background: "rgba(11,17,28,.9)", opacity: interpolate(frame, [65 + i * 12, 85 + i * 12], [0, 1], { extrapolateRight: "clamp" }) }}>
            <div style={{ ...mono(9, DIM) }}>{name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 30, color: i === 2 ? LIME : TEXT }}>{value}</span>
              <span style={{ ...mono(8, DIM) }}>{note}</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,.08)", marginTop: 12 }}>
              <div style={{ width: `${(Number(width) * interpolate(frame, [90 + i * 12, 130 + i * 12], [0, 1], { extrapolateRight: "clamp" }))}%`, height: "100%", background: i === 2 ? LIME : CYAN }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26, ...mono(10, DIM), opacity: interpolate(frame, [250, 280], [0, 1], { extrapolateRight: "clamp" }) }}>
        EVERY METRIC CARRIES EVENT IDS + A FORMULA VERSION. NOTHING IS INVENTED.
      </div>
    </AbsoluteFill>
  );
}

function AgentNode({ label, role, color, delay, frame }: { label: string; role: string; color: string; delay: number; frame: number }) {
  return (
    <div style={{ width: 190, padding: 12, border: `1px solid ${color}55`, borderTop: `2px solid ${color}`, background: "rgba(11,17,28,.94)", opacity: interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(frame, [delay, delay + 18], [12, 0], { extrapolateRight: "clamp" })}px)` }}>
      <div style={{ ...mono(8, color) }}>{label}</div>
      <div style={{ marginTop: 9, fontFamily: SANS, fontSize: 13, color: TEXT, lineHeight: 1.25 }}>{role}</div>
    </div>
  );
}

function Arrow({ delay, frame }: { delay: number; frame: number }) {
  return <div style={{ color: DIM, fontFamily: MONO, fontSize: 20, opacity: interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: "clamp" }) }}>→</div>;
}

function Agents() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: 74, justifyContent: "center" }}>
      <Backdrop accent={LIME} />
      <Corner index={4} total={9} label="THE AGENT GRAPH" />
      <div style={{ ...mono(12, LIME), ...enter(frame, 8) }}>MICROSOFT AGENT FRAMEWORK / TYPED STATE</div>
      <div style={{ fontFamily: SANS, fontSize: 52, fontWeight: 500, letterSpacing: "-0.04em", color: TEXT, marginTop: 13, ...enter(frame, 20) }}>
        Five agents. One shared evidence graph.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28 }}>
        <AgentNode label="01 / ANALYST" role="TacticalAnalyst finds the pattern and writes claims" color={LIME} delay={52} frame={frame} />
        <Arrow delay={94} frame={frame} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <AgentNode label="02 / PRODUCER" role="StoryProducer writes the broadcast cue" color={CYAN} delay={106} frame={frame} />
          <AgentNode label="03 / EDITOR" role="AudienceEditor rewrites for three audiences" color={CYAN} delay={122} frame={frame} />
          <AgentNode label="04 / CHECKER" role="FactChecker audits claims as advisory" color={CORAL} delay={138} frame={frame} />
        </div>
        <Arrow delay={178} frame={frame} />
        <AgentNode label="FAN-IN / VERIFY" role="deterministic gate + evidence merge" color={LIME} delay={190} frame={frame} />
        <Arrow delay={222} frame={frame} />
        <AgentNode label="05 / DIRECTOR" role="approve / hold / kill the cue" color={LIME} delay={234} frame={frame} />
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 18, opacity: interpolate(frame, [280, 310], [0, 1], { extrapolateRight: "clamp" }) }}>
        {["GraphState", "event window", "metrics", "claims", "verification", "trace"].map((x) => (
          <span key={x} style={{ padding: "5px 7px", border: "1px solid rgba(200,255,61,.3)", color: LIME, fontFamily: MONO, fontSize: 9 }}>{x}</span>
        ))}
      </div>
      <div style={{ ...mono(10, DIM), marginTop: 18, opacity: interpolate(frame, [320, 350], [0, 1], { extrapolateRight: "clamp" }) }}>
        PARALLEL FAN-OUT. TYPED FAN-IN. RETRIES. DETERMINISTIC FALLBACK.
      </div>
    </AbsoluteFill>
  );
}

function Verifier() {
  const frame = useCurrentFrame();
  const stamp = spring({ frame: frame - 220, fps: 30, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
      <Backdrop accent={CORAL} />
      <Corner index={5} total={9} label="THE RELEASE GATE" />
      <div style={{ ...mono(12, CORAL), ...enter(frame, 10) }}>EVIDENCE FIRST / NO FREE-FLOATING CLAIMS</div>
      <div style={{ fontFamily: SANS, fontSize: 58, fontWeight: 500, letterSpacing: "-0.04em", color: TEXT, marginTop: 13, ...enter(frame, 22) }}>
        Claims meet evidence.
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
        <div style={{ flex: 1.25, padding: 18, border: "1px solid rgba(255,255,255,.12)", background: "rgba(11,17,28,.94)" }}>
          <div style={{ ...mono(9, LIME) }}>CLAIM / AI EXPLANATION</div>
          <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 20, color: TEXT, lineHeight: 1.35 }}>NHR-08 completed a 24.6 m line-breaking pass under 0.82 pressure.</div>
          <div style={{ display: "flex", gap: 6, marginTop: 18, flexWrap: "wrap" }}>
            {["e-000974", "event_pressure 0.82", "xt_delta +0.1736", "difficulty 8.7"].map((x) => <span key={x} style={{ padding: "5px 7px", border: "1px solid rgba(73,215,255,.28)", color: CYAN, fontFamily: MONO, fontSize: 9 }}>{x}</span>)}
          </div>
        </div>
        <div style={{ flex: 0.8, padding: 18, border: "1px solid rgba(200,255,61,.35)", background: "rgba(200,255,61,.055)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ ...mono(9, LIME) }}>DETERMINISTIC VERIFIER</div>
          <div style={{ fontFamily: SANS, fontSize: 38, color: LIME, opacity: stamp, transform: `scale(${0.85 + stamp * 0.15})` }}>PASS</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>4 claims supported by event IDs and metric refs. No unsupported superlative.</div>
        </div>
      </div>
      <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", gap: 20, ...mono(10, DIM), opacity: interpolate(frame, [300, 330], [0, 1], { extrapolateRight: "clamp" }) }}>
        <span>MODELS EXPLAIN.</span><span style={{ color: LIME }}>THE VERIFIER DECIDES.</span><span>DIRECTOR APPROVES.</span>
      </div>
    </AbsoluteFill>
  );
}

function Callout({ label, title, color, style, delay, frame }: { label: string; title: string; color: string; style: React.CSSProperties; delay: number; frame: number }) {
  return (
    <div style={{ position: "absolute", ...style, padding: 11, borderLeft: `2px solid ${color}`, background: "rgba(7,10,18,.93)", boxShadow: "0 8px 30px rgba(0,0,0,.35)", opacity: interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(frame, [delay, delay + 18], [8, 0], { extrapolateRight: "clamp" })}px)` }}>
      <div style={{ ...mono(8, color) }}>{label}</div>
      <div style={{ marginTop: 5, fontFamily: SANS, fontSize: 12, color: TEXT }}>{title}</div>
    </div>
  );
}

function StudioScene() {
  const frame = useCurrentFrame();
  const scale = 1; // keep the full Studio chrome readable in the frame
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Backdrop accent={LIME} />
      <div style={{ position: "absolute", left: 40, top: 28, ...mono(10, LIME) }}>THE CONTROL ROOM</div>
      <div style={{ position: "absolute", right: 40, top: 28, ...mono(9, DIM) }}>ONE EVIDENCE TRAIL</div>
      <div style={{ position: "absolute", left: 210, top: 94, width: 860, height: 538, border: "1px solid rgba(255,255,255,.14)", background: "#0b111c", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <Img src={staticFile("screens/studio.png")} style={{ width: "100%", transform: `scale(${scale})`, transformOrigin: "center" }} />
      </div>
      <Callout label="DATA / LEFT" title="Events, score, pitch, detected moments" color={CYAN} style={{ left: 30, top: 176, width: 160 }} delay={80} frame={frame} />
      <Callout label="DETERMINISTIC / BOTTOM" title="xG, xT, pressure, control, chaos, speed" color={CORAL} style={{ left: 30, top: 332, width: 160 }} delay={140} frame={frame} />
      <Callout label="AI / RIGHT" title="Explanation, agent trace, evidence" color={LIME} style={{ right: 30, top: 176, width: 160 }} delay={110} frame={frame} />
      <Callout label="VERIFIED CUE" title="Program monitor / approve or hold" color={LIME} style={{ right: 30, top: 344, width: 160 }} delay={170} frame={frame} />
      <div style={{ position: "absolute", left: 210, bottom: 26, fontFamily: SANS, fontSize: 20, color: TEXT }}>
        Pick a moment. Read the evidence. <span style={{ color: LIME }}>Decide what goes on air.</span>
      </div>
    </AbsoluteFill>
  );
}

const overlays = [
  ["screens/overlay.png", "LOWER THIRD", "headline + stat + evidence"],
  ["screens/overlay-stat-card.png", "STAT CARD", "xG / xT / event pressure"],
  ["screens/overlay-momentum.png", "MOMENTUM", "control share / chaos / pressure"],
  ["screens/overlay-pressure.png", "PRESSURE MAP", "pressure and pass locations"],
  ["screens/overlay-speed.png", "SPEED ALERT", "match top speed + context"],
];

function OverlayScene() {
  const frame = useCurrentFrame();
  const index = Math.min(4, Math.floor(frame / 84));
  const [src, label, note] = overlays[index];
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,10,18,.62), transparent 32%), linear-gradient(0deg, rgba(7,10,18,.18), transparent 28%)" }} />
      <div style={{ position: "absolute", left: 46, top: 42, padding: "11px 13px", background: "rgba(7,10,18,.88)", borderLeft: `2px solid ${LIME}` }}>
        <div style={{ ...mono(9, LIME) }}>BROADCAST OVERLAY / {String(index + 1).padStart(2, "0")}</div>
        <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 30, color: TEXT }}>{label}</div>
        <div style={{ marginTop: 3, fontFamily: SANS, fontSize: 13, color: MUTED }}>{note}</div>
      </div>
      <div style={{ position: "absolute", right: 46, top: 44, ...mono(9, DIM) }}>SAME VERIFIED CUE / FIVE TEMPLATES</div>
    </AbsoluteFill>
  );
}

function FanScene() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: 64, background: BG }}>
      <Backdrop accent={LIME} />
      <Corner index={8} total={9} label="THE SECOND SCREEN" />
      <div style={{ display: "flex", gap: 54, alignItems: "center", height: "100%" }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...mono(11, LIME), ...enter(frame, 12) }}>FAN / PERSONALIZED / EVIDENCE-BACKED</div>
          <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 46, lineHeight: 1, letterSpacing: "-0.04em", color: TEXT, ...enter(frame, 24) }}>
            Same fact.<br /><span style={{ color: LIME }}>Different depth.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
            {["Analyst / numbers and shape", "Casual / the story in plain language", "Player / selected player event log"].map((x, i) => (
              <div key={x} style={{ padding: "10px 12px", border: "1px solid rgba(255,255,255,.1)", color: i === 2 ? LIME : MUTED, fontFamily: SANS, fontSize: 14, opacity: interpolate(frame, [52 + i * 12, 70 + i * 12], [0, 1], { extrapolateRight: "clamp" }) }}>{x}</div>
            ))}
          </div>
          <div style={{ ...mono(9, DIM), marginTop: 18 }}>EN / ES / 中文 / PLAYER FOCUS / RECAP</div>
        </div>
        <div style={{ width: 310, height: 610, borderRadius: 34, padding: 10, background: "#101722", border: "1px solid rgba(255,255,255,.18)", boxShadow: "0 30px 80px rgba(0,0,0,.6)", transform: `translateY(${interpolate(frame, [0, 45], [16, 0], { extrapolateRight: "clamp" })}px)` }}>
          <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 26 }}>
            <Img src={staticFile("screens/fan.png")} style={{ width: "100%", transform: "translateY(0)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Outro() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
      <Backdrop accent={LIME} />
      <div style={{ ...mono(11, LIME), ...enter(frame, 8) }}>FIVE AGENTS / ONE VERIFIED CALL</div>
      <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 76, fontWeight: 500, lineHeight: 0.95, letterSpacing: "-0.05em", color: TEXT, ...enter(frame, 20) }}>
        MatchMind.
      </div>
      <div style={{ marginTop: 18, maxWidth: 720, fontFamily: SANS, fontSize: 20, color: MUTED, lineHeight: 1.45, ...enter(frame, 36) }}>
        Grounded match intelligence for the studio, the broadcast, and the fan.
      </div>
      <div style={{ marginTop: 34, display: "flex", gap: 10 }}>
        {["STUDIO", "OVERLAY", "FAN", "ABOUT"].map((x, i) => (
          <span key={x} style={{ padding: "8px 12px", border: "1px solid rgba(200,255,61,.35)", color: i === 0 ? LIME : MUTED, ...mono(9) }}>{x}</span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 54, ...mono(11, LIME) }}>RUZINIUUUUU.GITHUB.IO/MATCHMIND</div>
      <div style={{ position: "absolute", right: 80, bottom: 54, ...mono(9, DIM) }}>MATCHMIND / 2026</div>
    </AbsoluteFill>
  );
}

export const MatchMindPromo = () => {
  const frame = useCurrentFrame();
  const sceneFade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: SANS, isolation: "isolate" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.9} />
      <div style={{ position: "absolute", inset: 0, opacity: sceneFade }}>
        <Sequence from={0} durationInFrames={210}><Intro /></Sequence>
        <Sequence from={210} durationInFrames={390}><Problem /></Sequence>
        <Sequence from={600} durationInFrames={540}><DataScene /></Sequence>
        <Sequence from={1140} durationInFrames={480}><Agents /></Sequence>
        <Sequence from={1620} durationInFrames={450}><Verifier /></Sequence>
        <Sequence from={2070} durationInFrames={540}><StudioScene /></Sequence>
        <Sequence from={2610} durationInFrames={420}><OverlayScene /></Sequence>
        <Sequence from={3030} durationInFrames={360}><FanScene /></Sequence>
        <Sequence from={3390} durationInFrames={210}><Outro /></Sequence>
      </div>
    </AbsoluteFill>
  );
};
