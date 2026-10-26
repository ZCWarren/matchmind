import { ArrowRight, Broadcast } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import SceneLoader from "../components/moment/SceneLoader";
import { useMatchExperience } from "../hooks/useMatchExperience";
import { formatClock } from "../lib";

export default function Home() {
  const experience = useMatchExperience();
  const { events, cursor, home, away, selectedMoment, currentEvent, matchId } = experience;
  return (
    <main className="home-page">
      <AppNav matchId={matchId} />
      <section className="home-hero">
        <div className="home-copy">
          <motion.p
            className="home-kicker"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            Football has another layer
          </motion.p>
          <h1>
            <motion.span
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >See the game</motion.span>
            <motion.span
              className="accent-line"
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >beneath the game.</motion.span>
          </h1>
          <motion.p
            className="home-summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Five agents turn the pressure, movement and meaning inside every moment into evidence-backed match intelligence.
          </motion.p>
          <motion.div
            className="home-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
          >
            <Link className="action-primary" to={`/moment?match=${matchId}`}>
              Explore the moment <ArrowRight size={18} weight="bold" />
            </Link>
            <Link className="action-secondary" to={`/studio?match=${matchId}`}>
              <Broadcast size={17} weight="bold" /> Enter Studio
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="home-visual"
          initial={{ opacity: 0, scale: 0.94, rotateY: -8 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SceneLoader events={events} cursor={cursor} home={home} away={away} variant="hero" />
          <div className="hero-moment-caption">
            <span className="hero-clock">{selectedMoment ? formatClock(selectedMoment.clock) : "72:12"}</span>
            <div>
              <strong>The pass through the pressure</strong>
              <span>Nova Harbor vs Orion North</span>
            </div>
            <div className="hero-pressure">
              <b>{currentEvent?.pressure.toFixed(2) ?? "0.82"}</b>
              <span>pressure</span>
            </div>
          </div>
        </motion.div>
        <div className="home-proof" aria-label="Live product proof">
          <span><b>{events.length.toLocaleString() || "1,275"}</b> real synthetic events</span>
          <span><b>5</b> specialized agents · <b>4</b> MCP tools</span>
          <span><b>3-act</b> Blackboard story arc</span>
        </div>
      </section>
    </main>
  );
}
