import {
  ArrowRight,
  Broadcast,
  CheckCircle,
  Database,
  Lightning,
  Robot,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import { Eyebrow, Magnetic, Reveal, SplitWords, TiltCard, words } from "../components/fx";
import { SiteFooter } from "./Home";

const STEPS = [
  {
    n: "01",
    title: "Pick a moment",
    body: "Start with the featured moment or select any ranked play in the Director's rundown. The 3D stadium and timeline follow your cursor.",
  },
  {
    n: "02",
    title: "Inspect the evidence",
    body: "Open the Evidence tab or the Agent Graph to see exact event IDs, MCP tool calls and metric formulas behind every claim.",
  },
  {
    n: "03",
    title: "Decide on air",
    body: "Hold keeps the cue in standby. Approve sends it live to the 16:9 program monitor. Nothing unverified can be approved.",
  },
  {
    n: "04",
    title: "Switch the surface",
    body: "Toggle L3 / STAT / MOM / SPD / MAP in Studio, open the 1080p Overlay source, or read the same play in the Fan app.",
  },
];

export default function Guide() {
  return (
    <div className="guide-page editorial-page">
      <AppNav />

      <main className="editorial-main container">
        <section className="about-hero editorial-hero">
          <Reveal>
            <Eyebrow tone="flood">Operating guide · Read once, then drive the room</Eyebrow>
          </Reveal>
          <h1 className="display editorial-title">
            <SplitWords words={words("Data in.")} />
            <br />
            <SplitWords delay={0.18} words={words("*Explanation* out.")} />
          </h1>
          <Reveal delay={0.3}>
            <p className="editorial-lede">
              MatchMind separates three layers by design: raw match events, deterministic football metrics, and AI language. The verifier sits between the explanation and the broadcast.
            </p>
          </Reveal>
          <Reveal delay={0.4} className="editorial-actions">
            <Magnetic>
              <Link className="btn btn-primary btn-lg" to="/studio">
                Open Studio <ArrowRight size={17} weight="bold" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link className="btn btn-glass btn-lg" to="/about">
                System architecture <ArrowRight size={17} weight="bold" />
              </Link>
            </Magnetic>
          </Reveal>
        </section>

        <section className="guide-legend" aria-label="Data, explanation, and evidence">
          <Reveal delay={0}>
            <TiltCard className="guide-source panel tone-ice">
              <div className="guide-source-head">
                <Database size={16} weight="bold" />
                <span>Data itself</span>
                <b className="mono">ICE BLUE</b>
              </div>
              <h2 className="display">
                What happened, and what the code <em>measured.</em>
              </h2>
              <p>
                The event feed, score, clock, coordinates, xG, xT, pressure, control, chaos, momentum and speed. These are deterministic calculations over the synthetic event stream.
              </p>
              <ul>
                <li>1,275 logged events in the hero match</li>
                <li>Exact event IDs, player IDs and pitch coordinates</li>
                <li>Formula versions attached to every metric</li>
              </ul>
            </TiltCard>
          </Reveal>

          <Reveal delay={0.1}>
            <TiltCard className="guide-source panel tone-violet">
              <div className="guide-source-head">
                <Robot size={16} weight="bold" />
                <span>AI explanation</span>
                <b className="mono">VIOLET</b>
              </div>
              <h2 className="display">
                Why it mattered, written for a <em>human.</em>
              </h2>
              <p>
                The headline, the tactical argument, the watch-next note and the fan cards. Five agents turn evidence into language; they never calculate the football numbers themselves.
              </p>
              <ul>
                <li>TacticalAnalyst grounds claims via MCP tools</li>
                <li>StoryProducer &amp; AudienceEditor adapt tone and depth</li>
                <li>Director ranks the rundown and recommends airtime</li>
              </ul>
            </TiltCard>
          </Reveal>

          <Reveal delay={0.2}>
            <TiltCard className="guide-source panel tone-verify">
              <div className="guide-source-head">
                <ShieldCheck size={16} weight="bold" />
                <span>Evidence / verifier</span>
                <b className="mono">VERIFY</b>
              </div>
              <h2 className="display">
                Why you can trust it enough to <em>air.</em>
              </h2>
              <p>
                Every claim carries event IDs and metric references. The deterministic verifier is the release gate; the LLM FactChecker is advisory. If the gate rejects, the cue is withheld.
              </p>
              <ul>
                <li>Claim-level event &amp; metric verification</li>
                <li>Deterministic pass, revise or reject</li>
                <li>Human approve / hold / kill in Studio</li>
              </ul>
            </TiltCard>
          </Reveal>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-head">
            <span className="section-label">
              <Broadcast size={14} weight="bold" /> How to drive Studio
            </span>
            <small className="mono">one loop · four decisions</small>
          </div>
          <div className="guide-steps">
            {STEPS.map((step, index) => (
              <Reveal key={step.n} delay={index * 0.06} className="guide-step-card panel">
                <span className="step-num display">{step.n}</span>
                <b>{step.title}</b>
                <p>{step.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="guide-notes">
          <Reveal className="guide-note-card panel">
            <div className="guide-note-title">
              <Lightning size={15} weight="fill" /> Cached demo vs live backend
            </div>
            <p>
              The public demo runs as a zero-setup snapshot with cached DeepSeek agent runs across all five fixtures. Running the local FastAPI backend unlocks live model generation, MCP tool execution and WebSocket match replay.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="guide-note-card panel">
            <div className="guide-note-title">
              <CheckCircle size={15} weight="fill" /> What to look for
            </div>
            <p>
              A verified run shows a specific headline, a number tied to an event ID, a green verifier stamp, and a broadcast cue that adapts across all five templates. A held cue is not an error — it is the release gate doing its job.
            </p>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
