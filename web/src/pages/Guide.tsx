import { ArrowRight, Broadcast, CheckCircle, Database, Lightning, Robot, ShieldCheck } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";

export default function Guide() {
  return (
    <div className="about-page guide-page">
      <header className="about-header">
        <Brand />
        <nav className="about-nav">
          <Link to="/studio">Studio</Link>
          <Link to="/about">About</Link>
          <Link to="/overlay?bg=1">Overlay</Link>
          <Link to="/fan">Fan</Link>
        </nav>
      </header>

      <main className="about-main">
        <section className="about-hero">
          <div className="about-kicker">Read this once / then drive the room</div>
          <h1>Data in.<br /><em>Explanation out.</em></h1>
          <p>
            MatchMind has three layers, and they are deliberately separated:
            the event data, the deterministic football metrics, and the AI
            explanation. The verifier is the gate between an explanation and
            the broadcast.
          </p>
          <div className="about-actions">
            <Link className="btn btn-primary" to="/studio">Open Studio <ArrowRight size={12} /></Link>
            <Link className="btn btn-quiet" to="/about">System story <ArrowRight size={12} /></Link>
          </div>
        </section>

        <section className="guide-legend" aria-label="Data, explanation, and evidence">
          <article className="guide-source data">
            <div className="guide-source-head"><Database size={14} /><span>Data itself</span><b>cyan</b></div>
            <h2>What happened, and what the code measured.</h2>
            <p>
              The event feed, score, clock, coordinates, xG, xT, pressure, control,
              chaos, momentum, and speed. These are deterministic calculations over
              the synthetic event stream.
            </p>
            <ul>
              <li>1,275 events in the hero match</li>
              <li>event IDs, players, locations</li>
              <li>formula versions on every metric</li>
            </ul>
          </article>
          <article className="guide-source ai">
            <div className="guide-source-head"><Robot size={14} /><span>AI explanation</span><b>lime</b></div>
            <h2>Why it mattered, written for a human.</h2>
            <p>
              The headline, the tactical argument, the watch-next note, and the
              fan cards. Five agents turn evidence into language; they do not
              calculate the football numbers.
            </p>
            <ul>
              <li>TacticalAnalyst</li>
              <li>StoryProducer / AudienceEditor</li>
              <li>Director decides the rundown</li>
            </ul>
          </article>
          <article className="guide-source evidence">
            <div className="guide-source-head"><ShieldCheck size={14} /><span>Evidence / verifier</span><b>coral</b></div>
            <h2>Why you can trust it enough to air.</h2>
            <p>
              Every claim carries event IDs and metric references. The
              deterministic verifier is the release gate; the LLM FactChecker is
              advisory. If the gate rejects, the cue is withheld.
            </p>
            <ul>
              <li>claim-level evidence</li>
              <li>deterministic pass / reject</li>
              <li>approve / hold by the Director</li>
            </ul>
          </article>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <span><Broadcast size={13} /> How to drive Studio</span>
            <small>one loop / four decisions</small>
          </div>
          <div className="guide-steps">
            <div><span>01</span><b>Pick a moment.</b><p>Start with the headline or the key-moments list on the left. The pitch and event feed follow your cursor.</p></div>
            <div><span>02</span><b>Read the evidence.</b><p>Right side: agent rundown explains, evidence drawer shows the exact event IDs and metric calculations.</p></div>
            <div><span>03</span><b>Decide on air.</b><p>Hold keeps the cue in standby. Approve sends it to the program monitor. The Director's decision is shown, not hidden.</p></div>
            <div><span>04</span><b>Switch the surface.</b><p>L3 / STAT / MOM / SPD / MAP changes the broadcast template. Overlay exports the same verified cue at 1920x1080.</p></div>
          </div>
        </section>

        <section className="guide-notes">
          <div>
            <div className="guide-note-title"><Lightning size={12} /> Cached vs live</div>
            <p>
              The public demo is a static snapshot: five cached insights, instant,
              no API key. The local app adds live generation, MCP tool calls,
              retries, and the WebSocket replay.
            </p>
          </div>
          <div>
            <div className="guide-note-title"><CheckCircle size={12} /> What to look for</div>
            <p>
              A good run shows a specific headline, a number tied to an event,
              a verifier result, and a cue that changes with the template. A held
              run is not a failure; it is the release gate doing its job.
            </p>
          </div>
        </section>

        <section className="about-footer">
          <p>Start in Studio, then move to About for the architecture and Overlay for the broadcast surface.</p>
          <div>
            <Link to="/studio">Studio <ArrowRight size={11} /></Link>
            <Link to="/about">About <ArrowRight size={11} /></Link>
            <Link to="/overlay?bg=1">Overlay <ArrowRight size={11} /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
