import {
  ArrowRight,
  Broadcast,
  ChartLineUp,
  CheckCircle,
  GitBranch,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import AgentPipeline from "../components/AgentPipeline";
import AppNav from "../components/AppNav";
import { Eyebrow, Magnetic, Reveal, SplitWords, TiltCard, words } from "../components/fx";
import { SiteFooter } from "./Home";

const AGENTS = [
  {
    name: "TacticalAnalyst",
    tone: "violet",
    role: "Finds tactical patterns and grounds claims in MCP data.",
  },
  {
    name: "StoryProducer",
    tone: "violet",
    role: "Turns verified claims into timed broadcast cues.",
  },
  {
    name: "AudienceEditor",
    tone: "ice",
    role: "Adapts one fact for three audiences and languages.",
  },
  {
    name: "FactChecker",
    tone: "signal",
    role: "Advises on unsupported numbers and superlatives.",
  },
  {
    name: "Director",
    tone: "flood",
    role: "Ranks moments, spaces airtime and recommends approve or hold.",
  },
];

const METRICS = [
  { value: "5", label: "Synthetic fixtures" },
  { value: "6,281", label: "Logged match events" },
  { value: "5/5", label: "Deterministic pass rate" },
];

export default function About() {
  return (
    <div className="about-page editorial-page">
      <AppNav />

      <main className="editorial-main container">
        <section className="about-hero editorial-hero">
          <Reveal>
            <Eyebrow tone="violet">System architecture · Multi-agent graph</Eyebrow>
          </Reveal>
          <h1 className="display editorial-title">
            <SplitWords words={words("Five agents.")} />
            <br />
            <SplitWords delay={0.18} words={words("*One* verified call.")} />
          </h1>
          <Reveal delay={0.3}>
            <p className="editorial-lede">
              Raw events become broadcast intelligence. Models explain the play; deterministic code computes and verifies every number.
            </p>
          </Reveal>
          <Reveal delay={0.4} className="editorial-actions">
            <Magnetic>
              <Link className="btn btn-primary btn-lg" to="/studio">
                Enter Studio <ArrowRight size={17} weight="bold" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link className="btn btn-glass btn-lg" to="/overlay?bg=1&template=stat_card">
                <Broadcast size={17} weight="bold" /> See 1080p overlay
              </Link>
            </Magnetic>
          </Reveal>
        </section>

        <Reveal as="section" className="about-metrics panel" aria-label="Evaluation snapshot">
          {METRICS.map((item) => (
            <div key={item.label} className="about-metric-cell">
              <b className="mono">{item.value}</b>
              <span>{item.label}</span>
            </div>
          ))}
        </Reveal>

        <section className="editorial-section">
          <div className="editorial-section-head">
            <span className="section-label">
              <GitBranch size={14} weight="bold" /> Typed fan-out / fan-in graph
            </span>
            <small className="mono">1 bounded revision · deterministic release gate</small>
          </div>
          <div className="panel pipeline-showcase">
            <AgentPipeline eventsCount={1275} showTrace={false} />
          </div>
        </section>

        <section className="about-grid">
          <Reveal delay={0}>
            <TiltCard className="about-card panel">
              <div className="about-card-label tone-verify">
                <ShieldCheck size={16} weight="bold" /> Evidence first
              </div>
              <h2 className="display">
                The release gate is <em>deterministic.</em>
              </h2>
              <p>
                Every metric comes from the event stream. The deterministic verifier rejects unsupported claims before air.
              </p>
            </TiltCard>
          </Reveal>

          <Reveal delay={0.1}>
            <TiltCard className="about-card panel">
              <div className="about-card-label tone-ice">
                <UsersThree size={16} weight="bold" /> One moment, three audiences
              </div>
              <h2 className="display">
                Same facts. <em>Different depth.</em>
              </h2>
              <p>
                Three audiences and three languages share the same event-level evidence.
              </p>
            </TiltCard>
          </Reveal>

          <Reveal delay={0.2}>
            <TiltCard className="about-card panel">
              <div className="about-card-label tone-signal">
                <ChartLineUp size={16} weight="bold" /> Broadcast ready
              </div>
              <h2 className="display">
                Five overlay <em>templates.</em>
              </h2>
              <p>
                Five templates share one verified cue and render as a transparent 1080p source.
              </p>
            </TiltCard>
          </Reveal>
        </section>

        <section className="editorial-section">
          <div className="editorial-section-head">
            <span className="section-label">
              <CheckCircle size={14} weight="bold" /> The five agents
            </span>
            <small className="mono">shared typed blackboard · MCP tools · fallback safe</small>
          </div>
          <div className="about-team">
            {AGENTS.map((agent, index) => (
              <Reveal key={agent.name} delay={index * 0.06} className={`about-team-card panel tone-${agent.tone}`}>
                <span className="team-card-num mono">{String(index + 1).padStart(2, "0")}</span>
                <b>{agent.name}</b>
                <p>{agent.role}</p>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
