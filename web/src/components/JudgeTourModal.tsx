import { ArrowRight, Sparkle, X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { EASE } from "./fx";
import Modal from "./Modal";

type JudgeTourModalProps = {
  open: boolean;
  onClose: () => void;
  matchId?: string;
};

const STEPS = [
  {
    step: "01",
    tone: "ice",
    title: "The moment, in 3D",
    desc: "Switch camera angles and jump across the three acts of the match story.",
    route: (m: string) => `/moment?match=${m}`,
    cta: "Open the moment",
  },
  {
    step: "02",
    tone: "violet",
    title: "Five agents, one graph",
    desc: "Press Replay Graph to watch the analyst, producer, editor, checker and director hand off.",
    route: (m: string) => `/studio?match=${m}`,
    cta: "See the agents",
  },
  {
    step: "03",
    tone: "signal",
    title: "Catch an invented stat",
    desc: "The verifier blocks a false 'fastest sprint' claim before it can reach air.",
    route: (m: string) => `/studio?match=${m}#hallucination-lab`,
    cta: "Run the fact-check",
  },
  {
    step: "04",
    tone: "flood",
    title: "Direct the broadcast",
    desc: "Approve or hold a verified cue and preview the 1080p overlay on the program monitor.",
    route: () => `/studio?match=ast-2026-1025-vel-kep`,
    cta: "Open the studio",
  },
  {
    step: "05",
    tone: "verify",
    title: "One play, every fan",
    desc: "Analyst, casual and player readings — in English, Spanish and Chinese.",
    route: (m: string) => `/fan?match=${m}`,
    cta: "Open the fan app",
  },
];

export default function JudgeTourModal({ open, onClose, matchId = "ast-2026-1018-nhr-orn" }: JudgeTourModalProps) {
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} label="90-second tour" className="judge-tour-modal">
      <header className="modal-head">
        <div>
          <span className="modal-kicker"><Sparkle size={13} weight="fill" /> 90-second tour</span>
          <h2>Five things to try <em>right now.</em></h2>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close judge guide">
          <X size={18} />
        </button>
      </header>

      <ol className="tour-steps">
        {STEPS.map((item, index) => (
          <motion.li
            key={item.step}
            className={`tour-step tone-${item.tone}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.12 + index * 0.06 }}
          >
            <span className="tour-step-num">{item.step}</span>
            <div className="tour-step-copy">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </div>
            <button
              type="button"
              className="tour-go-btn"
              onClick={() => {
                onClose();
                navigate(item.route(matchId));
              }}
            >
              <span>{item.cta}</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </motion.li>
        ))}
      </ol>

      <footer className="modal-foot">
        <span>Runs entirely in your browser — no API keys, cached agent outputs.</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
          Start exploring <ArrowRight size={14} weight="bold" />
        </button>
      </footer>
    </Modal>
  );
}
