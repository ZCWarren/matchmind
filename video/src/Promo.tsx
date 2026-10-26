import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import MatchWorld from "./MatchWorld";
import hero from "./generated/hero.json";

const LIME = "#c8ff3d";
const CYAN = "#55d6d0";
const CORAL = "#ff6b5f";
const TEXT = "#f0f5ef";
const MUTED = "#9aa99f";
const DIM = "#6f8075";
const BG = "#060908";
const SANS = '"IBM Plex Sans", "Segoe UI", sans-serif';
const MONO = '"IBM Plex Mono", monospace';

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const enter = (frame: number, delay = 0, distance = 32) => ({
  opacity: interpolate(frame, [delay, delay + 16], [0, 1], clamp),
  transform: `translateY(${interpolate(frame, [delay, delay + 24], [distance, 0], clamp)}px)`,
});
const mono = (size: number, color = MUTED): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color,
});

function Backdrop({ accent = LIME }: { accent?: string }) {
  return (
    <>
      <AbsoluteFill style={{ background: BG }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 72% 42%, ${accent}12, transparent 46%)` }} />
      <AbsoluteFill style={{ opacity: 0.15, backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "100% 120px", maskImage: "linear-gradient(90deg, transparent, black, transparent)" }} />
    </>
  );
}

function BrandMark({ right = false }: { right?: boolean }) {
  return (
    <div style={{ position: "absolute", top: 42, [right ? "right" : "left"]: 54, display: "flex", alignItems: "center", gap: 14, ...mono(15, TEXT), fontWeight: 600 }}>
      <span style={{ display: "grid", placeItems: "center", width: 42, height: 42, border: `1px solid ${LIME}`, color: LIME, fontSize: 13 }}>MM</span>
      MATCHMIND
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", right: 100, bottom: 38, left: 100, textAlign: "center", color: TEXT, fontFamily: SANS, fontSize: 24, lineHeight: 1.35, textShadow: `0 2px 16px ${BG}` }}>
      {children}
    </div>
  );
}

function EventStorm() {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [0, 115], [0, hero.eventCount], clamp));
  return (
    <AbsoluteFill>
      <Backdrop accent={CORAL} />
      {Array.from({ length: 90 }, (_, index) => {
        const x = (index * 137 + 41) % 1920;
        const y = (index * 83 + 73) % 1080;
        const drift = interpolate(frame, [0, 240], [0, (index % 7 - 3) * 32], clamp);
        return <i key={index} style={{ position: "absolute", left: x, top: y, width: index % 5 === 0 ? 7 : 3, height: index % 5 === 0 ? 7 : 3, background: index % 4 === 0 ? CORAL : CYAN, opacity: interpolate(frame, [index % 30, 80 + index % 30], [0, 0.55], clamp), transform: `translate(${drift}px, ${-drift * 0.4}px)` }} />;
      })}
      <BrandMark />
      <div style={{ position: "absolute", left: 90, top: 260, ...enter(frame, 10) }}>
        <div style={mono(17, CORAL)}>A match is not a highlight reel</div>
        <div style={{ marginTop: 24, color: TEXT, fontFamily: MONO, fontSize: 178, letterSpacing: "-0.08em", lineHeight: 1 }}>{count.toLocaleString()}</div>
        <div style={{ color: MUTED, fontFamily: SANS, fontSize: 36 }}>events. One scoreline.</div>
      </div>
      <div style={{ position: "absolute", right: 100, bottom: 190, color: TEXT, fontFamily: SANS, fontSize: 54, fontWeight: 500, letterSpacing: "-0.04em", ...enter(frame, 105) }}>What actually changed?</div>
      <Caption>Every match hides thousands of events behind one scoreline.</Caption>
    </AbsoluteFill>
  );
}

function Reveal() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 55], [0, 1], clamp), transform: `scale(${interpolate(frame, [0, 150], [1.12, 1], clamp)})` }}>
        <MatchWorld />
      </AbsoluteFill>
      <BrandMark />
      <div style={{ position: "absolute", left: 70, top: 215, width: 720, ...enter(frame, 22) }}>
        <div style={mono(16, LIME)}>Match intelligence, made visible</div>
        <div style={{ marginTop: 22, color: TEXT, fontFamily: SANS, fontSize: 82, fontWeight: 600, letterSpacing: "-0.06em", lineHeight: 0.98 }}>See the game<br /><span style={{ color: LIME }}>beneath the game.</span></div>
      </div>
      <Caption>MatchMind reveals the pressure, movement and tactical structure underneath.</Caption>
    </AbsoluteFill>
  );
}

function HeroPass({ vertical = false }: { vertical?: boolean }) {
  const frame = useCurrentFrame();
  const hit = spring({ frame: frame - 92, fps: 30, config: { damping: 15, mass: 0.65 } });
  return (
    <AbsoluteFill>
      <Backdrop accent={CORAL} />
      <AbsoluteFill style={{ transform: vertical ? "translateY(120px)" : "translateX(180px)" }}>
        <MatchWorld vertical={vertical} passMode />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: vertical ? 150 : 110, left: vertical ? 64 : 74, ...enter(frame, 12) }}>
        <div style={mono(vertical ? 15 : 16, CORAL)}>72:12 / Nova Harbor vs Orion North</div>
        <div style={{ marginTop: 16, color: TEXT, fontFamily: SANS, fontSize: vertical ? 64 : 58, fontWeight: 550, letterSpacing: "-0.045em" }}>One pass through the press.</div>
      </div>
      <div style={{ position: "absolute", right: vertical ? 64 : 80, bottom: vertical ? 280 : 160, textAlign: "right", transform: `scale(${0.8 + hit * 0.2})`, opacity: hit }}>
        <div style={{ color: LIME, fontFamily: MONO, fontSize: vertical ? 118 : 142, letterSpacing: "-0.08em", lineHeight: 1 }}>24.6<span style={{ fontSize: 32, letterSpacing: 0 }}> m</span></div>
        <div style={{ ...mono(vertical ? 17 : 18, TEXT), marginTop: 16 }}>line-breaking pass</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 28, marginTop: 30 }}>
          <span style={{ ...mono(vertical ? 17 : 18, CORAL) }}>0.82 pressure</span>
          <span style={{ ...mono(vertical ? 17 : 18, CYAN) }}>+0.1736 xT</span>
        </div>
      </div>
      {!vertical && <Caption>NHR-08 finds 24.6 meters through 0.82 pressure. The structure becomes a story.</Caption>}
    </AbsoluteFill>
  );
}

const agentRoles = [
  ["TacticalAnalyst", "Finds the pattern", LIME],
  ["StoryProducer", "Writes for air", CYAN],
  ["AudienceEditor", "Changes the depth", CYAN],
  ["FactChecker", "Challenges the claim", CORAL],
  ["Director", "Chooses the moment", LIME],
];

function Agents() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <BrandMark />
      <div style={{ position: "absolute", top: 135, left: 70, ...enter(frame, 8) }}>
        <div style={mono(15, LIME)}>Microsoft Agent Framework / Typed shared state</div>
        <div style={{ marginTop: 14, color: TEXT, fontFamily: SANS, fontSize: 60, letterSpacing: "-0.045em" }}>Five agents. One evidence graph.</div>
      </div>
      <div style={{ position: "absolute", top: 335, right: 70, left: 70, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {agentRoles.map(([name, role, color], index) => (
          <div key={name} style={{ minHeight: 250, padding: "26px 22px", borderTop: `3px solid ${color}`, borderRight: "1px solid #223028", borderBottom: "1px solid #223028", borderLeft: "1px solid #223028", background: "#0d1310", ...enter(frame, 35 + index * 18, 55) }}>
            <span style={mono(13, color)}>{String(index + 1).padStart(2, "0")}</span>
            <div style={{ marginTop: 64, color: TEXT, fontFamily: SANS, fontSize: 23, fontWeight: 600 }}>{name}</div>
            <div style={{ marginTop: 12, color: MUTED, fontFamily: SANS, fontSize: 19, lineHeight: 1.4 }}>{role}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 70, bottom: 205, display: "flex", gap: 14, ...enter(frame, 130) }}>
        {["get_event_window()", "get_tactical_chain()", "get_pressure_comparison()", "get_player_summary()"].map((tool) => (
          <span key={tool} style={{ padding: "8px 14px", border: `1px solid ${CYAN}66`, background: "#0b1412", ...mono(13, CYAN) }}>MCP · {tool}</span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 70, bottom: 150, ...mono(16, DIM), ...enter(frame, 145) }}>Parallel fan-out / 3-Act MatchBlackboard / 4 MCP Tools / Deterministic fallback</div>
      <Caption>Each agent has one responsibility. No single prompt owns the whole decision.</Caption>
    </AbsoluteFill>
  );
}

function Revision() {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [85, 120], [0, 100], clamp);
  return (
    <AbsoluteFill>
      <Backdrop accent={CORAL} />
      <BrandMark />
      <div style={{ position: "absolute", top: 145, left: 74, ...enter(frame, 10) }}>
        <div style={mono(14, CORAL)}>Hallucination Gate Lab / Bounded recovery (max=1)</div>
        <div style={{ marginTop: 16, color: TEXT, fontFamily: SANS, fontSize: 64, letterSpacing: "-0.05em" }}>When a claim overreaches.</div>
      </div>
      <div style={{ position: "absolute", top: 340, right: 90, left: 90, display: "grid", gridTemplateColumns: "1fr 90px 1fr", alignItems: "center", gap: 22 }}>
        <div style={{ padding: 34, border: `1px solid ${CORAL}66`, background: "#120e0d", ...enter(frame, 25) }}>
          <div style={mono(13, CORAL)}>FactChecker + MCP get_pressure_comparison() / Reject & Revise</div>
          <div style={{ marginTop: 30, color: TEXT, fontFamily: SANS, fontSize: 34, lineHeight: 1.35 }}>“The <span style={{ position: "relative" }}>fastest / most dangerous<span style={{ position: "absolute", top: "55%", left: 0, width: `${strike}%`, height: 3, background: CORAL }} /></span> sequence (33.4 vs 31' 33.8 km/h).”</div>
          <div style={{ marginTop: 25, color: MUTED, fontFamily: SANS, fontSize: 18 }}>Unsupported superlative blocked against e-000419 (33.8 km/h).</div>
        </div>
        <div style={{ color: LIME, fontFamily: MONO, fontSize: 44, textAlign: "center", opacity: interpolate(frame, [105, 130], [0, 1], clamp) }}>→</div>
        <div style={{ padding: 34, border: `1px solid ${LIME}66`, background: "#0d130c", ...enter(frame, 120) }}>
          <div style={mono(13, LIME)}>StoryProducer:revise → FactChecker:recheck</div>
          <div style={{ marginTop: 30, color: TEXT, fontFamily: SANS, fontSize: 34, lineHeight: 1.35 }}>“A 24.6 m pass through 0.82 pressure (+0.174 xT).”</div>
          <div style={{ marginTop: 25, color: LIME, fontFamily: SANS, fontSize: 18 }}>One revision. Grounded on MatchBlackboard. Zero invented stats.</div>
        </div>
      </div>
      <Caption>The checker can send language back once. An unresolved error still stays off air.</Caption>
    </AbsoluteFill>
  );
}

function Evidence() {
  const frame = useCurrentFrame();
  const claim = hero.insight.insight.claims[0];
  const stamp = spring({ frame: frame - 125, fps: 30, config: { damping: 13 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <BrandMark />
      <div style={{ position: "absolute", top: 155, left: 74, ...enter(frame, 10) }}>
        <div style={mono(15, LIME)}>Deterministic release gate</div>
        <div style={{ marginTop: 15, color: TEXT, fontFamily: SANS, fontSize: 64, letterSpacing: "-0.05em" }}>Claims meet evidence.</div>
      </div>
      <div style={{ position: "absolute", top: 350, left: 80, width: 1160, padding: 36, borderLeft: `4px solid ${CYAN}`, background: "#0d1310", ...enter(frame, 30) }}>
        <div style={mono(13, CYAN)}>Claim / Event-level proof</div>
        <div style={{ marginTop: 22, color: TEXT, fontFamily: SANS, fontSize: 32, lineHeight: 1.45 }}>{claim.text}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 30 }}>
          {[...claim.event_ids, ...claim.metric_refs.map((ref) => `${ref.name} ${ref.value}`)].map((item) => <span key={item} style={{ padding: "9px 12px", border: `1px solid ${CYAN}55`, color: CYAN, fontFamily: MONO, fontSize: 14 }}>{item}</span>)}
        </div>
      </div>
      <div style={{ position: "absolute", right: 95, top: 390, width: 400, padding: 35, border: `2px solid ${LIME}`, color: LIME, opacity: stamp, transform: `scale(${1.2 - stamp * 0.2})` }}>
        <div style={mono(14, LIME)}>Verified for air</div>
        <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 88, letterSpacing: "-0.06em" }}>PASS</div>
        <div style={{ color: MUTED, fontFamily: SANS, fontSize: 18, lineHeight: 1.5 }}>{hero.insight.verification.checked_claims} claims checked. Every number traces back to an event.</div>
      </div>
      <Caption>Models explain. The deterministic verifier decides what is true.</Caption>
    </AbsoluteFill>
  );
}

const clock = (value?: { minute: number; second: number } | null) => value ? `${String(value.minute).padStart(2, "0")}:${String(value.second).padStart(2, "0")}` : "WAIT";

function Director() {
  const frame = useCurrentFrame();
  const rundown = hero.insight.rundown.slice(0, 5);
  return (
    <AbsoluteFill>
      <Backdrop />
      <BrandMark />
      <div style={{ position: "absolute", top: 145, left: 74, ...enter(frame, 10) }}>
        <div style={mono(15, LIME)}>Director / Airtime with intent</div>
        <div style={{ marginTop: 15, color: TEXT, fontFamily: SANS, fontSize: 64, letterSpacing: "-0.05em" }}>Not every moment deserves air.</div>
      </div>
      <div style={{ position: "absolute", top: 330, right: 90, left: 90, display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 40 }}>
        <div>
          {rundown.map((entry, index) => (
            <div key={entry.moment_id} style={{ display: "grid", gridTemplateColumns: "50px 1fr 120px 100px", alignItems: "center", gap: 15, padding: "22px 14px", borderTop: "1px solid #223028", background: index === 0 ? "#111a0e" : "transparent", ...enter(frame, 28 + index * 13, 18) }}>
              <span style={mono(15, index === 0 ? LIME : DIM)}>{String(entry.rank).padStart(2, "0")}</span>
              <span style={{ color: TEXT, fontFamily: SANS, fontSize: 21 }}>{entry.moment_id}</span>
              <span style={mono(14, entry.action === "approve" ? LIME : DIM)}>{entry.action}</span>
              <span style={mono(14, MUTED)}>{clock(entry.air_at)}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 30, border: `1px solid ${LIME}55`, background: "#0d1310", ...enter(frame, 90) }}>
          <div style={mono(13, LIME)}>Human has the final call</div>
          <div style={{ marginTop: 24, color: TEXT, fontFamily: SANS, fontSize: 29, lineHeight: 1.35 }}>Approve. Hold. Kill.</div>
          <div style={{ marginTop: 20, color: MUTED, fontFamily: SANS, fontSize: 18, lineHeight: 1.55 }}>60-second dedupe. 15-second airtime gap. Stoppage preferred.</div>
        </div>
      </div>
      <Caption>The Director ranks and schedules. A human keeps final control.</Caption>
    </AbsoluteFill>
  );
}

function Product() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, 300], [1.1, 1], clamp)})` }}>
        <Img src={staticFile("screens/studio.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,9,8,.94), transparent 58%), linear-gradient(0deg, rgba(6,9,8,.8), transparent 45%)" }} />
      <div style={{ position: "absolute", left: 64, top: 90, maxWidth: 660, ...enter(frame, 10) }}>
        <div style={mono(15, LIME)}>A working control room</div>
        <div style={{ marginTop: 18, color: TEXT, fontFamily: SANS, fontSize: 66, fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 1 }}>From insight<br />to on air.</div>
      </div>
      <Caption>Replay, inspect, revise, schedule and approve in one continuous workspace.</Caption>
    </AbsoluteFill>
  );
}

function Audiences() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "63%", overflow: "hidden", ...enter(frame, 5) }}>
        <Img src={staticFile("screens/overlay.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", right: 70, top: 120, width: 420, height: 800, border: "1px solid #36483c", background: BG, overflow: "hidden", transform: `translateY(${interpolate(frame, [30, 90], [60, 0], clamp)}px)`, opacity: interpolate(frame, [30, 60], [0, 1], clamp) }}>
        <Img src={staticFile("screens/fan.png")} style={{ width: "100%" }} />
      </div>
      <div style={{ position: "absolute", left: 70, top: 110, padding: 28, background: "rgba(6,9,8,.9)", ...enter(frame, 20) }}>
        <div style={mono(15, LIME)}>One verified moment</div>
        <div style={{ marginTop: 16, color: TEXT, fontFamily: SANS, fontSize: 58, letterSpacing: "-0.05em", lineHeight: 1.02 }}>Built for the broadcast.<br />Understood by every fan.</div>
      </div>
      <Caption>Analyst, casual and player views share the same evidence in three languages.</Caption>
    </AbsoluteFill>
  );
}

function Outro() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: 0.24, transform: "scale(1.25)" }}><MatchWorld /></AbsoluteFill>
      <BrandMark />
      <div style={{ position: "absolute", top: 280, right: 80, left: 80, textAlign: "center", ...enter(frame, 10) }}>
        <div style={{ color: TEXT, fontFamily: SANS, fontSize: 94, fontWeight: 600, letterSpacing: "-0.065em", lineHeight: 0.98 }}>See the game<br /><span style={{ color: LIME }}>beneath the game.</span></div>
        <div style={{ marginTop: 38, ...mono(19, TEXT) }}>MatchMind / Every moment, explained</div>
      </div>
      <div style={{ position: "absolute", right: 80, bottom: 110, left: 80, display: "flex", justifyContent: "space-between", ...mono(17, LIME) }}>
        <span>ruziniuuuuu.github.io/matchmind</span><span>Best Multi-Agent System</span>
      </div>
      <Caption>MatchMind. Evidence-backed match intelligence for the studio and the fan.</Caption>
    </AbsoluteFill>
  );
}

const sceneAudio = [
  [0, "storm"], [240, "reveal"], [570, "pass"], [870, "agents"], [1140, "revision"],
  [1410, "evidence"], [1650, "director"], [1890, "product"], [2190, "audiences"], [2460, "outro"],
] as const;

function Soundtrack({ teaser = false }: { teaser?: boolean }) {
  return (
    <>
      <Audio src={staticFile(teaser ? "audio/teaser-music.wav" : "audio/music.wav")} volume={0.32} />
      {!teaser && sceneAudio.map(([from, name]) => <Sequence key={name} from={from}><Audio src={staticFile(`audio/voice/${name}.mp3`)} /></Sequence>)}
      <Sequence from={teaser ? 90 : 570}><Audio src={staticFile("audio/impact.wav")} volume={0.75} /></Sequence>
      <Sequence from={teaser ? 180 : 1410}><Audio src={staticFile("audio/verify.wav")} volume={0.65} /></Sequence>
    </>
  );
}

export const MatchMindPromo = () => (
  <AbsoluteFill style={{ background: BG, fontFamily: SANS }}>
    <Soundtrack />
    <Sequence from={0} durationInFrames={240}><EventStorm /></Sequence>
    <Sequence from={240} durationInFrames={330}><Reveal /></Sequence>
    <Sequence from={570} durationInFrames={300}><HeroPass /></Sequence>
    <Sequence from={870} durationInFrames={270}><Agents /></Sequence>
    <Sequence from={1140} durationInFrames={270}><Revision /></Sequence>
    <Sequence from={1410} durationInFrames={240}><Evidence /></Sequence>
    <Sequence from={1650} durationInFrames={240}><Director /></Sequence>
    <Sequence from={1890} durationInFrames={300}><Product /></Sequence>
    <Sequence from={2190} durationInFrames={270}><Audiences /></Sequence>
    <Sequence from={2460} durationInFrames={240}><Outro /></Sequence>
  </AbsoluteFill>
);

function TeaserLock() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <BrandMark />
      <div style={{ position: "absolute", top: 350, left: 64, ...enter(frame, 15) }}>
        <div style={mono(15, LIME)}>Evidence locked</div>
        <div style={{ marginTop: 20, color: TEXT, fontFamily: SANS, fontSize: 70, letterSpacing: "-0.05em", lineHeight: 1.05 }}>Not just a claim.<br /><span style={{ color: LIME }}>A verified call.</span></div>
      </div>
      <div style={{ position: "absolute", right: 64, bottom: 320, left: 64, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {["event e-000974", "pressure 0.82", "xT +0.1736", "PASS"].map((item, index) => <div key={item} style={{ padding: 22, border: `1px solid ${index === 3 ? LIME : CYAN}`, color: index === 3 ? LIME : CYAN, fontFamily: MONO, fontSize: 18, ...enter(frame, 40 + index * 10) }}>{item}</div>)}
      </div>
    </AbsoluteFill>
  );
}

function TeaserOutro() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", inset: 0, opacity: 0.28 }}><MatchWorld vertical /></div>
      <div style={{ position: "absolute", top: 460, right: 55, left: 55, ...enter(frame, 10) }}>
        <div style={{ color: TEXT, fontFamily: SANS, fontSize: 76, fontWeight: 600, letterSpacing: "-0.06em", lineHeight: 1 }}>See the game<br /><span style={{ color: LIME }}>beneath<br />the game.</span></div>
        <div style={{ marginTop: 50, ...mono(24, TEXT) }}>MATCHMIND</div>
        <div style={{ marginTop: 18, ...mono(14, LIME) }}>Explore the moment</div>
      </div>
    </AbsoluteFill>
  );
}

export const MatchMindTeaser = () => (
  <AbsoluteFill style={{ background: BG, fontFamily: SANS }}>
    <Soundtrack teaser />
    <Sequence from={0} durationInFrames={180}><HeroPass vertical /></Sequence>
    <Sequence from={180} durationInFrames={90}><TeaserLock /></Sequence>
    <Sequence from={270} durationInFrames={90}><Product /></Sequence>
    <Sequence from={360} durationInFrames={90}><TeaserOutro /></Sequence>
  </AbsoluteFill>
);
