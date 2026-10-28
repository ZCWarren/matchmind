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
    body: "Choose the featured play or any ranked moment. The stadium and timeline follow your selection.",
  },
  {
    n: "02",
    title: "Inspect the evidence",
    body: "Open Evidence or Agent Graph to inspect event IDs, tool calls and metric formulas.",
  },
  {
    n: "03",
    title: "Decide on air",
    body: "Hold keeps a cue in standby. Approve sends verified cues to the program monitor.",
  },
  {
    n: "04",
    title: "Switch the surface",
    body: "Try five Studio templates, open the 1080p Overlay, or read the same play in Fan.",
  },
];

export default function Guide() {
  return (
    <div className="guide-page editorial-page">
      <AppNav />

      <main className="editorial-main container">
        <section className="about-hero editorial-hero">
          <Reveal>
            <Eyebrow tone="flood">Operating guide · Studio in four steps</Eyebrow>
          </Reveal>
          <h1 className="display editorial-title">
            <SplitWords words={words("Data in.")} />
            <br />
            <SplitWords delay={0.18} words={words("*Explanation* out.")} />
          </h1>
          <Reveal delay={0.3}>
            <p className="editorial-lede">
              Raw events, deterministic metrics and AI language stay separate. The verifier clears every explanation for broadcast.
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
                Score, clock, coordinates and football metrics are calculated from the synthetic event stream.
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
                Agents turn evidence into headlines, tactical context and fan cards. They never calculate the metrics.
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
                Claims carry event IDs and metric references. If deterministic verification fails, the cue stays off air.
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
              The public demo uses cached runs across five fixtures. The local backend enables live generation, MCP tools and replay.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="guide-note-card panel">
            <div className="guide-note-title">
              <CheckCircle size={15} weight="fill" /> What to look for
            </div>
            <p>
              Look for a grounded headline, event-linked metrics and a green verifier stamp. A held cue means the release gate is working.
            </p>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
