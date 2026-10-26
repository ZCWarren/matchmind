import { ArrowRight, CheckCircle, Compass, Sparkle, Trophy, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

type JudgeTourModalProps = {
  open: boolean;
  onClose: () => void;
  matchId?: string;
};

const STEPS = [
  {
    step: "01 / 05",
    title: "3D Tactical Pitch & Multi-Moment Blackboard",
    criterion: "UX & Innovation · Real Data-Driven 3D",
    desc: "Switch between TV Cam, Top-Down xT, and Press POV on the 3D pitch. Click Act I → Act II → Act III on the MatchBlackboard ribbon to trace the full match arc.",
    route: (m: string) => `/moment?match=${m}`,
    cta: "Open 3D Moment Focus",
  },
  {
    step: "02 / 05",
    title: "5-Agent Typed Graph & 4 MCP Analytics Tools",
    criterion: "Agentic Architecture · Parallel Fan-Out & Tool Audit",
    desc: "Inspect the live Agent Graph Visualizer. Click 'Replay Graph' to watch TacticalAnalyst call MCP tools, fan out to StoryProducer/AudienceEditor/FactChecker, and pass the release gate.",
    route: (m: string) => `/studio?match=${m}`,
    cta: "Inspect Agent Graph in Studio",
  },
  {
    step: "03 / 05",
    title: "Adversarial Hallucination Gate (33.4 vs 33.8 km/h)",
    criterion: "Trustworthy AI · Deterministic Release Gate",
    desc: "Test Trap #1 (Fastest Sprint superlative) and Trap #2 (Unverified Cue Number 94.6%). Watch FactChecker cross-check e-000419 (33.8 km/h) and block or revise before air.",
    route: (m: string) => `/studio?match=${m}#hallucination-lab`,
    cta: "Test Hallucination Lab",
  },
  {
    step: "04 / 05",
    title: "Director Rundown, Human Override & OBS Overlay",
    criterion: "Real-World Broadcast Impact",
    desc: "Select Vela vs Kepler (held by Director) and click 'Approve' to override with human control. Switch L3 / STAT / MOM / SPD / MAP templates in the 1920×1080 Program Monitor.",
    route: () => `/studio?match=ast-2026-1025-vel-kep`,
    cta: "Try Director Override",
  },
  {
    step: "05 / 05",
    title: "One Evidence Bundle, Nine Audience Readings",
    criterion: "Personalization · Analyst / Casual / Player × EN / ES / 中文",
    desc: "Switch between Analyst, Casual, and Player Follow in English, Spanish, and Chinese — all grounded on the exact same verified event IDs.",
    route: (m: string) => `/fan?match=${m}`,
    cta: "Open Fan Second Screen",
  },
];

export default function JudgeTourModal({ open, onClose, matchId = "ast-2026-1018-nhr-orn" }: JudgeTourModalProps) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="90-Second Judge Walkthrough">
      <div className="judge-tour-modal">
        <header className="modal-head">
          <div>
            <span className="section-label"><Trophy size={14} weight="fill" /> Best Multi-Agent System · 90s Interactive Walkthrough</span>
            <h2>5 High-Scoring Highlights to Inspect</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close judge guide">
            <X size={18} />
          </button>
        </header>

        <div className="tour-steps-list">
          {STEPS.map((item) => (
            <div key={item.step} className="tour-step-card">
              <div className="tour-step-num">
                <span>{item.step}</span>
                <CheckCircle size={15} weight="fill" />
              </div>
              <div className="tour-step-copy">
                <small>{item.criterion}</small>
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
            </div>
          ))}
        </div>

        <footer className="modal-foot">
          <span><Compass size={14} /> Zero API keys required on public static demo · Full DeepSeek + WebSocket live mode available locally</span>
          <button type="button" className="action-primary compact-btn" onClick={onClose}>
            <Sparkle size={14} /> Got it, explore
          </button>
        </footer>
      </div>
    </div>
  );
}
