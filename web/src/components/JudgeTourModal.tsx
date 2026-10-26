import { ArrowRight, CheckCircle, Sparkle, Trophy, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

type JudgeTourModalProps = {
  open: boolean;
  onClose: () => void;
  matchId?: string;
};

const STEPS = [
  {
    step: "01",
    title: "3D Pitch & 3-Act Match Story",
    desc: "Switch 3D camera angles and jump across the 3 key moments of the match.",
    route: (m: string) => `/moment?match=${m}`,
    cta: "Open 3D Pitch",
  },
  {
    step: "02",
    title: "5 AI Roles Working Together",
    desc: "Click 'Replay Graph' to see how 5 AI roles analyze, write, and fact-check in parallel.",
    route: (m: string) => `/studio?match=${m}`,
    cta: "See AI Teamwork",
  },
  {
    step: "03",
    title: "Catching Fake AI Stats",
    desc: "Watch the Fact-Check Guard block a false 'fastest sprint' claim before it hits TV.",
    route: (m: string) => `/studio?match=${m}#hallucination-lab`,
    cta: "Try Fact-Check Test",
  },
  {
    step: "04",
    title: "Live TV Control Room & Overlay",
    desc: "Approve or hold graphics as a TV Director and preview the 1080p broadcast screen.",
    route: () => `/studio?match=ast-2026-1025-vel-kep`,
    cta: "Open TV Studio",
  },
  {
    step: "05",
    title: "One Play, Three Fan Styles",
    desc: "Switch between Analyst, Casual, and Player views in English, Spanish, and Chinese.",
    route: (m: string) => `/fan?match=${m}`,
    cta: "Open Fan App",
  },
];

export default function JudgeTourModal({ open, onClose, matchId = "ast-2026-1018-nhr-orn" }: JudgeTourModalProps) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="90-Second Quick Tour">
      <div className="judge-tour-modal">
        <header className="modal-head">
          <div>
            <span className="section-label"><Trophy size={14} weight="fill" /> 90-SECOND QUICK TOUR</span>
            <h2>5 Highlights You Can Try Right Now</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close judge guide">
            <X size={20} />
          </button>
        </header>

        <div className="tour-steps-list">
          {STEPS.map((item) => (
            <div key={item.step} className="tour-step-card">
              <div className="tour-step-num">
                <span>{item.step}</span>
                <CheckCircle size={18} weight="fill" />
              </div>
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
                <ArrowRight size={15} weight="bold" />
              </button>
            </div>
          ))}
        </div>

        <footer className="modal-foot">
          <span>Works instantly in your browser — no API keys needed</span>
          <button type="button" className="action-primary compact-btn" onClick={onClose}>
            <Sparkle size={15} /> Start Exploring
          </button>
        </footer>
      </div>
    </div>
  );
}
