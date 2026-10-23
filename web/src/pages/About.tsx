import { ArrowRight, Broadcast, ChartLineUp, CheckCircle, GitBranch, ShieldCheck, UsersThree } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

const AGENTS = [
  { name: "TacticalAnalyst", role: "Finds the pattern and makes the evidence-backed argument." },
  { name: "StoryProducer", role: "Turns the insight into a timed broadcast lower-third." },
  { name: "AudienceEditor", role: "Rewrites the same fact for analyst, casual, and player audiences." },
  { name: "FactChecker", role: "Audits claims as an advisory second opinion." },
  { name: "Director", role: "Approves, holds, or kills the cue for air." },
];

export default function About() {
  return (
    <div className="about-page">
      <header className="about-header">
        <Brand />
        <nav className="about-nav">
          <Link to="/studio">Studio</Link>
          <Link to="/guide">Guide</Link>
          <Link to="/overlay?bg=1">Overlay</Link>
          <Link to="/fan">Fan</Link>
          <a href="https://ruziniuuuuu.github.io/matchmind-demo/promo.mp4" target="_blank" rel="noreferrer">Video</a>
        </nav>
      </header>

      <main className="about-main">
        <section className="about-hero">
          <div className="about-kicker">Best Multi-Agent System / Microsoft Agent Framework</div>
          <h1>Five agents.<br /><em>One verified call.</em></h1>
          <p>
            MatchMind turns raw football events into broadcast-ready match intelligence.
            The models explain. The deterministic engine decides what is true. The
            verifier decides what goes on air.
          </p>
          <div className="about-actions">
            <Link className="btn btn-primary" to="/studio">Enter Studio <ArrowRight size={12} /></Link>
            <Link className="btn btn-quiet" to="/overlay?bg=1&template=stat_card">See overlay <Broadcast size={12} /></Link>
          </div>
        </section>

        <section className="about-metrics" aria-label="Evaluation snapshot">
          <div><b>5</b><span>fixtures</span></div>
          <div><b>6,281</b><span>synthetic events</span></div>
          <div><b>30</b><span>evaluation labels</span></div>
          <div><b>45</b><span>fan cards</span></div>
          <div><b>5/5</b><span>deterministic pass</span></div>
          <div><b>13</b><span>model calls / insight</span></div>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <span><GitBranch size={13} /> The graph</span>
            <small>typed fan-out / fan-in</small>
          </div>
          <div className="about-flow">
            <div className="about-flow-node input"><span>1,275 events</span><b>Match input</b><small>synthetic tracking + labels</small></div>
            <div className="about-flow-node analytics"><span>Deterministic</span><b>Analytics</b><small>xG / xT / pressure / control</small></div>
            <div className="about-flow-node analyst"><span>Agent 01</span><b>TacticalAnalyst</b><small>calls MCP / writes claims</small></div>
            <div className="about-fanout">
              <div><span>02</span><b>StoryProducer</b></div>
              <div><span>03</span><b>AudienceEditor</b></div>
              <div><span>04</span><b>FactChecker</b></div>
            </div>
            <div className="about-flow-node finalize"><span>Fan-in</span><b>Finalize + verifier</b><small>deterministic gate</small></div>
            <div className="about-flow-node director"><span>Agent 05</span><b>Director</b><small>approve / hold / kill</small></div>
            <div className="about-flow-node output"><span>Output</span><b>Studio + overlay + fan</b><small>one verified moment</small></div>
          </div>
        </section>

        <section className="about-grid">
          <div className="about-card">
            <div className="about-card-label"><ShieldCheck size={12} /> Evidence first</div>
            <h2>The release gate is deterministic.</h2>
            <p>Every number comes from the event stream. The LLM FactChecker is advisory; a deterministic verifier rejects unsupported claims and withholds the cue.</p>
          </div>
          <div className="about-card">
            <div className="about-card-label"><UsersThree size={12} /> One moment, three audiences</div>
            <h2>Same facts. Different depth.</h2>
            <p>Analyst, casual, and player views are generated in parallel, in English, Spanish, and Chinese, with evidence attached to every card.</p>
          </div>
          <div className="about-card">
            <div className="about-card-label"><ChartLineUp size={12} /> Broadcast ready</div>
            <h2>Five overlay templates.</h2>
            <p>Lower-third, stat card, momentum, speed alert, and pressure map share one verified cue payload and a transparent OBS source.</p>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <span><CheckCircle size={13} /> The team</span>
            <small>shared typed state / retries / fallbacks</small>
          </div>
          <div className="about-team">
            {AGENTS.map((agent, index) => (
              <div key={agent.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{agent.name}</b>
                <small>{agent.role}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="about-footer">
          <p>Public static demo. Live model generation and the WebSocket feed run in the source application.</p>
          <div>
            <Link to="/studio">Studio <ArrowRight size={11} /></Link>
            <Link to="/fan">Fan <ArrowRight size={11} /></Link>
            <a href="https://ruziniuuuuu.github.io/matchmind-demo/promo.mp4" target="_blank" rel="noreferrer">Video <ArrowRight size={11} /></a>
          </div>
        </section>
      </main>
    </div>
  );
}
