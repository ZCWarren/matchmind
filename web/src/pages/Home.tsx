import { ArrowRight, ArrowUpRight, Broadcast, DeviceMobile, GithubLogo, Play, ShieldCheck } from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AgentPipeline from "../components/AgentPipeline";
import AppNav from "../components/AppNav";
import Brand from "../components/Brand";
import { CountUp, CursorGlow, EASE, Eyebrow, Magnetic, Reveal, SplitWords, TiltCard, words } from "../components/fx";
import SceneLoader from "../components/moment/SceneLoader";
import PlayerText from "../components/PlayerText";
import { eventIndex, useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock } from "../lib";
import { momentPlayerLabels } from "../lib/playerDisplay";
import type { Event, InsightResult, Moment, Team } from "../types";

type Experience = ReturnType<typeof useMatchExperience>;

/* ============================================================ hero */

function Hero({ exp, momentIndex }: { exp: Experience; momentIndex: number }) {
  const { events, home, away, selectedMoment, matchId, insight } = exp;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "38%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  // Loop the build-up to the hero moment so the stadium always feels live.
  const [heroCursor, setHeroCursor] = useState(momentIndex);
  useEffect(() => {
    setHeroCursor(momentIndex);
    if (!events.length) return;
    const start = Math.max(0, momentIndex - 6);
    let step = 0;
    const timer = window.setInterval(() => {
      step = (step + 1) % 10;
      setHeroCursor(Math.min(momentIndex, start + step));
    }, 1600);
    return () => window.clearInterval(timer);
  }, [momentIndex, events.length]);

  const moment = selectedMoment;
  const score = events[momentIndex]?.score;
  const headline = insight?.cue?.payload.headline ?? moment?.headline ?? "Line break under pressure";
  const playerLabels = useMemo(
    () => momentPlayerLabels(events, selectedMoment, headline),
    [events, selectedMoment, headline],
  );
  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero-stage" style={{ scale: stageScale }}>
        <SceneLoader events={events} cursor={heroCursor} home={home} away={away} variant="hero" />
      </motion.div>
      <div className="hero-vignette" aria-hidden="true" />
      <motion.div className="hero-content" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}>
          <Eyebrow tone="flood">Match intelligence for broadcasters &amp; fans</Eyebrow>
        </motion.div>
        <h1 className="display hero-title">
          <SplitWords words={words("See the game *beneath* the game.")} delay={0.25} stagger={0.07} />
        </h1>
        <motion.p
          className="hero-lede"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
        >
          Pressure, passing lanes and verified context for every moment.
        </motion.p>
        <motion.div
          className="hero-ctas"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}
        >
          <Magnetic>
            <Link className="btn btn-primary btn-lg" to={`/moment?match=${matchId}`}>
              Explore the moment <ArrowRight size={18} weight="bold" />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link className="btn btn-glass btn-lg" to={`/studio?match=${matchId}`}>
              <Broadcast size={18} weight="bold" /> Enter Studio
            </Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      <motion.aside
        className="hero-live glass"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 1.1 }}
        aria-label="Featured moment"
      >
        <div className="hero-live-top">
          <span className="live-dot" /> Featured moment
          <span className="mono">{moment ? formatClock(moment.clock) : "72'12"}</span>
        </div>
        <div className="hero-live-score">
          <span>{home?.name ?? "Nova Harbor"}</span>
          <b className="mono">{score ? `${score.home}–${score.away}` : "1–1"}</b>
          <span>{away?.name ?? "Orion North"}</span>
        </div>
        <p><PlayerText text={headline} labels={playerLabels} home={home} away={away} /></p>
        <div className="hero-live-metrics">
          <div><span>Pressure</span><b className="mono tone-signal">{moment?.metrics.event_pressure?.value.toFixed(2) ?? "0.82"}</b></div>
          <div><span>Threat added</span><b className="mono tone-ice">+{moment?.metrics.xt_delta?.value.toFixed(3) ?? "0.174"}</b></div>
          <div><span>Verifier</span><b className="mono tone-verify">{insight?.verification.status ?? "pass"}</b></div>
        </div>
      </motion.aside>

    </section>
  );
}

/* ============================================================ problem */

function EventField({ events, momentIndex }: { events: Event[]; momentIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    ref.current?.style.setProperty("--p", value.toFixed(4));
  });
  const moment = events[momentIndex];
  const total = Math.max(1, events.length);
  return (
    <div className="event-field" ref={ref} style={{ ["--p" as string]: 0 }}>
      <svg viewBox="0 0 100 64" aria-label={`${events.length} match events plotted on the pitch`} role="img">
        <g stroke="rgba(255,255,255,0.09)" strokeWidth="0.18" fill="none">
          <rect x="1" y="1" width="98" height="62" rx="1" />
          <line x1="50" y1="1" x2="50" y2="63" />
          <circle cx="50" cy="32" r="8" />
          <rect x="1" y="15" width="15" height="34" />
          <rect x="84" y="15" width="15" height="34" />
        </g>
        {events.map((event, index) => (
          <circle
            key={event.event_id}
            className={`ef-dot ${event.team_id === events[0]?.team_id ? "a" : "b"}`}
            cx={event.location.x}
            cy={event.location.y * 0.64}
            r={event.type === "shot" || event.type === "goal" ? 0.55 : 0.32}
            style={{ ["--i" as string]: (index / total).toFixed(4) }}
          />
        ))}
        {moment && (
          <g className="ef-moment">
            <circle cx={moment.location.x} cy={moment.location.y * 0.64} r="3.2" className="ef-pulse" />
            <circle cx={moment.location.x} cy={moment.location.y * 0.64} r="1" className="ef-core" />
          </g>
        )}
      </svg>
      {moment && (
        <div
          className={`ef-label ${moment.location.x > 72 ? "align-end" : ""}`}
          style={{ left: `${moment.location.x}%`, top: `${moment.location.y}%` }}
        >
          <span className="mono">{formatClock(moment.clock)}</span> the decisive moment
        </div>
      )}
    </div>
  );
}

function Problem({ exp, momentIndex }: { exp: Experience; momentIndex: number }) {
  const { events, match } = exp;
  const final = match?.final_score ?? { home: 2, away: 1 };
  return (
    <section className="section problem" id="problem">
      <div className="container">
        <div className="problem-head">
          <Reveal><Eyebrow>The problem</Eyebrow></Reveal>
          <h2 className="display section-title">
            <SplitWords inView words={words("A thousand *decisions.*")} />
            <br />
            <SplitWords inView delay={0.25} className="dim" words={words("One score hides the rest.")} />
          </h2>
        </div>
        <div className="problem-grid">
          <Reveal className="problem-stat">
            <CountUp className="stat-num mono" to={events.length || 1275} duration={2.2} />
            <span>events logged — every pass, press and carry, positioned and measured.</span>
          </Reveal>
          <Reveal className="problem-vs" delay={0.1}><span>vs</span></Reveal>
          <Reveal className="problem-stat score" delay={0.2}>
            <span className="stat-num mono">{final.home}<i>–</i>{final.away}</span>
            <span>the final score. Who won, not why.</span>
          </Reveal>
        </div>
        <EventField events={events} momentIndex={momentIndex} />
        <Reveal className="problem-kicker">
          <p className="display">
            One pass changes everything. <em>MatchMind finds it and proves it.</em>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ moment story */

type StoryStep = { n: string; label: string; title: string; body: string; metric: string; metricLabel: string; tone: string };

function buildSteps(events: Event[], momentIndex: number, moment: Moment | null, home?: Team, away?: Team): StoryStep[] {
  const ev = events[momentIndex];
  const windowEvents = events.slice(Math.max(0, momentIndex - 8), momentIndex + 1);
  const seconds = windowEvents.length > 1
    ? Math.abs((windowEvents.at(-1)!.clock.minute * 60 + windowEvents.at(-1)!.clock.second) - (windowEvents[0].clock.minute * 60 + windowEvents[0].clock.second))
    : 40;
  const presser = [...events.slice(Math.max(0, momentIndex - 6), momentIndex + 1)].reverse().find((item) => item.type === "pressure");
  const xt = moment?.metrics.xt_delta?.value ?? 0.1736;
  const awayName = away?.short_name ?? "Orion";
  return [
    {
      n: "01",
      label: "Events",
      title: "Every touch, logged.",
      body: `${windowEvents.length} events in ${seconds} seconds. Position, player and pressure are attached to each.`,
      metric: `${windowEvents.length}`,
      metricLabel: `events · ${seconds}s`,
      tone: "flood",
    },
    {
      n: "02",
      label: "Pressure",
      title: "The trap is set.",
      body: `${awayName} closes the passing lanes. Pressure shows where the trap will spring.`,
      metric: (presser?.pressure ?? 0.9).toFixed(2),
      metricLabel: "pressure on the ball",
      tone: "signal",
    },
    {
      n: "03",
      label: "Passing lane",
      title: "One lane stays open.",
      body: `${ev?.player_id ?? "p1"} finds a ${ev?.distance_m?.toFixed(1) ?? "24.6"} m gap at difficulty ${ev?.difficulty?.toFixed(1) ?? "8.7"}, under ${ev?.pressure.toFixed(2) ?? "0.82"} pressure.`,
      metric: `${ev?.distance_m?.toFixed(1) ?? "24.6"}m`,
      metricLabel: "through the press",
      tone: "ice",
    },
    {
      n: "04",
      label: "Line break",
      title: "The line breaks.",
      body: `${home?.short_name ?? "Nova"} break through. One action adds +${xt.toFixed(3)} expected threat; the scoreboard misses it.`,
      metric: `+${xt.toFixed(3)}`,
      metricLabel: "expected threat added",
      tone: "verify",
    },
  ];
}

function MomentStory({ exp, momentIndex }: { exp: Experience; momentIndex: number }) {
  const { events, home, away, selectedMoment } = exp;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setStage(Math.max(0, Math.min(4, (value - 0.04) / 0.84 * 4)));
  });
  const steps = useMemo(() => buildSteps(events, momentIndex, selectedMoment, home, away), [events, momentIndex, selectedMoment, home, away]);
  const playerLabels = useMemo(
    () => momentPlayerLabels(events, selectedMoment, steps.map((item) => item.body).join(" ")),
    [events, selectedMoment, steps],
  );
  const active = Math.min(3, Math.floor(stage));
  const presserIndex = useMemo(() => {
    for (let i = momentIndex; i >= Math.max(0, momentIndex - 6); i -= 1) if (events[i]?.type === "pressure") return i;
    return Math.max(0, momentIndex - 1);
  }, [events, momentIndex]);
  const storyCursor = stage < 1
    ? Math.max(0, momentIndex - 8) + Math.min(Math.max(0, presserIndex - (momentIndex - 8)), Math.floor(stage * 8))
    : stage < 2 ? presserIndex : momentIndex;
  const ev = events[momentIndex];
  const step = steps[active];
  return (
    <section className="story" ref={ref} aria-label="The moment, layer by layer">
      <div className="story-sticky">
        <div className="story-stage">
          <SceneLoader events={events} cursor={storyCursor} home={home} away={away} variant="story" stage={stage} anchor={momentIndex} />
        </div>
        <div className="story-vignette" aria-hidden="true" />
        <div className="story-top">
          <Eyebrow tone="flood">The moment · layer by layer</Eyebrow>
          <div className="story-clock">
            <span className="mono">{events[storyCursor] ? formatClock(events[storyCursor].clock) : "72'12"}</span>
            <span>{home?.short_name ?? "Nova"} {ev ? `${ev.score.home}–${ev.score.away}` : "1–1"} {away?.short_name ?? "Orion"}</span>
          </div>
        </div>
        <div className="story-copy">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className={`story-step tone-${step.tone}`}
              initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span className="story-n mono">{step.n} — {step.label}</span>
              <h3 className="display">{step.title}</h3>
              <p><PlayerText text={step.body} labels={playerLabels} home={home} away={away} /></p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="story-readout glass">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <b className={`mono tone-${step.tone}`}>{step.metric}</b>
              <span>{step.metricLabel}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <ol className="story-progress" aria-hidden="true">
          {steps.map((item, index) => {
            const fill = Math.max(0, Math.min(1, stage - index));
            return (
              <li key={item.n} className={index === active ? "active" : index < active ? "done" : ""}>
                <span className="mono">{item.n}</span>
                <em>{item.label}</em>
                <i><b style={{ transform: `scaleX(${fill})` }} /></i>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ============================================================ pipeline */

function Pipeline({ insight, eventsCount }: { insight: InsightResult | null; eventsCount: number }) {
  return (
    <section className="section pipeline" id="agents">
      <div className="container">
        <div className="section-head center">
          <Reveal><Eyebrow tone="violet">Five agents · one evidence graph</Eyebrow></Reveal>
          <h2 className="display section-title">
            <SplitWords inView words={words("Five agents argue.")} />
            <br />
            <SplitWords inView delay={0.2} words={words("*Evidence* decides.")} />
          </h2>
          <Reveal delay={0.2}>
            <p className="section-lede">
              Deterministic metrics ground every claim. Agents explain the play; the verifier clears it for air.
            </p>
          </Reveal>
        </div>
        <Reveal>
          <AgentPipeline trace={insight?.trace} verification={insight?.verification} eventsCount={eventsCount} />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================ surfaces */

function Surfaces({ exp }: { exp: Experience }) {
  const { insight, matchId, home, away, events, selectedMoment, moments } = exp;
  const cue = insight?.cue?.payload;
  const fan = insight?.fan_cards.find((card) => card.profile === "casual" && card.language === "en") ?? insight?.fan_cards[0];
  const clock = selectedMoment ? formatClock(selectedMoment.clock) : "72'12";
  const playerLabels = useMemo(
    () => momentPlayerLabels(events, selectedMoment, [cue?.headline, fan?.headline, fan?.why_it_matters].filter(Boolean).join(" ")),
    [events, selectedMoment, cue?.headline, fan?.headline, fan?.why_it_matters],
  );
  return (
    <section className="section surfaces" id="surfaces">
      <div className="container">
        <div className="section-head">
          <Reveal><Eyebrow tone="ice">One moment · every screen</Eyebrow></Reveal>
          <h2 className="display section-title">
            <SplitWords inView words={words("Same truth.")} />
            <br />
            <SplitWords inView delay={0.2} words={words("*Every* audience.")} />
          </h2>
        </div>
        <div className="surface-grid">
          <Reveal delay={0}>
            <TiltCard className="surface-card studio">
              <div className="surface-visual">
                <div className="mini-monitor">
                  <div className="mini-feed" />
                  <div className="mini-l3">
                    <span className="mono">{clock}</span>
                    <b><PlayerText text={cue?.headline ?? "p1 escapes the press trap"} labels={playerLabels} home={home} away={away} /></b>
                  </div>
                  <span className="mini-onair">On air</span>
                </div>
                <ul className="mini-rundown">
                  {moments.slice(0, 3).map((moment, index) => (
                    <li key={moment.moment_id}>
                      <span className="mono">{String(index + 1).padStart(2, "0")}</span>
                      <span><PlayerText text={moment.headline} labels={playerLabels} home={home} away={away} /></span>
                      <em className={index === 0 ? "ok" : ""}>{index === 0 ? "approve" : "hold"}</em>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="surface-copy">
                <span className="surface-kicker"><Broadcast size={15} weight="bold" /> Studio</span>
                <h3>The control room</h3>
                <p>Rank the rundown, review the evidence and approve each cue before it airs.</p>
                <Link to={`/studio?match=${matchId}`} className="surface-link">Open Studio <ArrowUpRight size={14} weight="bold" /></Link>
              </div>
            </TiltCard>
          </Reveal>
          <Reveal delay={0.1}>
            <TiltCard className="surface-card overlay">
              <div className="surface-visual">
                <div className="mini-broadcast">
                  <div className="mini-bug">
                    <b>{home?.team_id ?? "NHR"}</b><span className="mono">1–1</span><b>{away?.team_id ?? "ORN"}</b><em className="mono">{clock}</em>
                  </div>
                  <div className="mini-lower">
                    <i />
                    <div>
                      <span>{cue?.eyebrow ?? "NHR vs ORN · 72:12"}</span>
                      <b><PlayerText text={cue?.headline ?? "Line break under pressure"} labels={playerLabels} home={home} away={away} /></b>
                      <em className="mono">{cue?.stat ?? "+0.1736 xT · 24.6 m pass under 0.82 pressure"}</em>
                    </div>
                  </div>
                </div>
              </div>
              <div className="surface-copy">
                <span className="surface-kicker"><Play size={15} weight="fill" /> Overlay</span>
                <h3>The broadcast graphic</h3>
                <p>Five verified templates, ready as a transparent 1080p source for OBS or vMix.</p>
                <Link to={`/overlay?bg=1&match=${matchId}`} className="surface-link">Preview overlay <ArrowUpRight size={14} weight="bold" /></Link>
              </div>
            </TiltCard>
          </Reveal>
          <Reveal delay={0.2}>
            <TiltCard className="surface-card fan">
              <div className="surface-visual">
                <div className="mini-phone">
                  <div className="mini-phone-notch" />
                  <span className="mini-chip">Casual · English</span>
                  <b className="display"><PlayerText text={fan?.headline ?? "p1 slips out of the trap"} labels={playerLabels} home={home} away={away} /></b>
                  <p><PlayerText text={fan?.why_it_matters ?? "Breaking that trap flipped defence into attack in seconds."} labels={playerLabels} home={home} away={away} /></p>
                  <div className="mini-langs"><span className="on">EN</span><span>ES</span><span>中文</span></div>
                </div>
              </div>
              <div className="surface-copy">
                <span className="surface-kicker"><DeviceMobile size={15} weight="bold" /> Fan</span>
                <h3>The second screen</h3>
                <p>Three reading levels and three languages, grounded in the same evidence.</p>
                <Link to={`/fan?match=${matchId}`} className="surface-link">Open the fan app <ArrowUpRight size={14} weight="bold" /></Link>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ film */

function Film() {
  const base = import.meta.env.BASE_URL;
  const [playing, setPlaying] = useState(false);
  return (
    <section className="section film" id="film">
      <div className="container">
        <div className="section-head center">
          <Reveal><Eyebrow tone="flood">The film</Eyebrow></Reveal>
          <h2 className="display section-title"><SplitWords inView words={words("Watch it *move.*")} /></h2>
        </div>
        <Reveal className="film-frame">
          {playing ? (
            <video src={`${base}promo.mp4?v=english-v3`} controls autoPlay playsInline>
              <track kind="subtitles" src={`${base}promo.en.srt`} srcLang="en" label="English" />
            </video>
          ) : (
            <button type="button" className="film-cover" onClick={() => setPlaying(true)} aria-label="Play the MatchMind film">
              <span className="film-beams" aria-hidden="true" />
              <span className="film-play"><Play size={28} weight="fill" /></span>
              <span className="film-caption">
                <b className="display">MatchMind — <em>the film</em></b>
                <span>Product story · 90 seconds</span>
              </span>
            </button>
          )}
        </Reveal>
        <div className="film-links">
          <a href={`${base}teaser.mp4?v=english-v3`} target="_blank" rel="noreferrer" className="btn btn-glass btn-sm"><Play size={13} weight="fill" /> 15-second cut</a>
          <a href={`${base}promo.mp4?v=english-v3`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open full film <ArrowUpRight size={13} /></a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ cta + footer */

function FinalCta({ matchId }: { matchId: string }) {
  return (
    <section className="final-cta">
      <div className="final-beams" aria-hidden="true"><i /><i /><i /></div>
      <div className="container">
        <h2 className="display final-title">
          <SplitWords inView words={words("Step under")} />
          <br />
          <SplitWords inView delay={0.15} words={words("*the lights.*")} />
        </h2>
        <Reveal delay={0.25}>
          <p className="section-lede">Five fixtures and cached agent runs. No setup; everything runs in your browser.</p>
        </Reveal>
        <Reveal delay={0.35} className="final-actions">
          <Magnetic>
            <Link className="btn btn-primary btn-lg" to={`/moment?match=${matchId}`}>Open the moment <ArrowRight size={18} weight="bold" /></Link>
          </Magnetic>
          <Magnetic>
            <Link className="btn btn-glass btn-lg" to={`/studio?match=${matchId}`}><Broadcast size={18} weight="bold" /> Open Studio</Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Brand />
          <p>See the game beneath the game.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/moment">Moment</Link>
          <Link to="/studio">Studio</Link>
          <Link to="/fan">Fan</Link>
          <Link to="/overlay?bg=1">Overlay</Link>
          <Link to="/about">About</Link>
          <Link to="/guide">Guide</Link>
          <a href="https://github.com/ruziniuuuuu/matchmind" target="_blank" rel="noreferrer"><GithubLogo size={15} /> GitHub</a>
        </nav>
        <p className="footer-note">
          <ShieldCheck size={14} /> Synthetic data · cached agent runs · deterministic release gate.
        </p>
      </div>
    </footer>
  );
}

/* ============================================================ page */

export default function Home() {
  const exp = useMatchExperience();
  const { events, selectedMoment, matchId, insight } = exp;
  const momentIndex = events.length ? eventIndex(events, selectedMoment?.event_id) : 0;
  return (
    <main className="home-page">
      <AppNav matchId={matchId} />
      <CursorGlow />
      <Hero exp={exp} momentIndex={momentIndex} />
      <Problem exp={exp} momentIndex={momentIndex} />
      <MomentStory exp={exp} momentIndex={momentIndex} />
      <Pipeline insight={insight} eventsCount={events.length} />
      <Surfaces exp={exp} />
      <Film />
      <FinalCta matchId={matchId} />
      <SiteFooter />
    </main>
  );
}
