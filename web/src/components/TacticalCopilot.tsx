import { ArrowUpRight, ChatCenteredDots, Check, Crosshair, PaperPlaneRight, Sparkle } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { type FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { formatClock } from "../lib";
import type { CopilotQA, MatchBlackboardState, Moment } from "../types";
import { EASE } from "./fx";

type TacticalCopilotProps = {
  matchId: string;
  blackboard: MatchBlackboardState | null;
  moments: Moment[];
  selectedMomentId?: string;
  onSelectMoment: (moment: Moment) => void;
  onSeekEvent: (eventId: string) => void;
};

const ACTS = ["The spark", "The turning point", "The climax"];

export default function TacticalCopilot({
  matchId,
  blackboard,
  moments,
  selectedMomentId,
  onSelectMoment,
  onSeekEvent,
}: TacticalCopilotProps) {
  const [activeQA, setActiveQA] = useState<CopilotQA | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setActiveQA(blackboard?.copilot_presets?.[0] ?? null);
  }, [blackboard]);

  if (!blackboard) return null;

  const handlePresetClick = (preset: CopilotQA) => {
    setActiveQA(preset);
    if (preset.event_ids[0]) onSeekEvent(preset.event_ids[0]);
  };

  const handleAsk = async (event: FormEvent) => {
    event.preventDefault();
    if (!customQuery.trim()) return;
    setAsking(true);
    try {
      const res = await api.copilot(matchId, customQuery.trim());
      setActiveQA(res);
      if (res.event_ids[0]) onSeekEvent(res.event_ids[0]);
    } finally {
      setAsking(false);
    }
  };

  const handleChapterClick = (momentId: string, eventId: string) => {
    const found = moments.find((m) => m.moment_id === momentId);
    if (found) onSelectMoment(found);
    else onSeekEvent(eventId);
  };

  return (
    <section className="copilot-deck" aria-label="Match story arc and tactical Q&A">
      <div className="story-arc-panel panel">
        <header className="deck-head">
          <div>
            <span className="section-label">Three-act match story</span>
            <h2 className="deck-title">{blackboard.narrative_title}</h2>
          </div>
        </header>
        <p className="arc-thread">{blackboard.tactical_thread}</p>
        <div className="story-arc-grid">
          {blackboard.story_arc.map((chapter, idx) => {
            const isSelected = selectedMomentId === chapter.moment_id;
            return (
              <button
                key={chapter.moment_id}
                type="button"
                className={`story-arc-card ${isSelected ? "active" : ""}`}
                onClick={() => handleChapterClick(chapter.moment_id, chapter.event_id)}
              >
                <span className="arc-top">
                  <span className="arc-act">Act {["I", "II", "III"][idx] ?? chapter.act} · {ACTS[idx] ?? chapter.act_label}</span>
                  <span className="arc-clock mono">{formatClock(chapter.clock)}</span>
                </span>
                <strong>{chapter.headline}</strong>
                <span className="arc-foot">
                  <b className="mono">{chapter.key_metric_value}</b>
                  <span>View in 3D <ArrowUpRight size={12} weight="bold" /></span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="copilot-panel panel">
        <header className="deck-head">
          <div>
            <span className="section-label"><Sparkle size={14} weight="fill" /> Ask MatchMind</span>
            <h2 className="deck-title">Tactical answers, <em>grounded in play.</em></h2>
          </div>
          <div className="segmented copilot-lang-switch">
            <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button type="button" className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
          </div>
        </header>

        <div className="copilot-presets">
          {blackboard.copilot_presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`copilot-pill ${activeQA?.id === preset.id ? "active" : ""}`}
              onClick={() => handlePresetClick(preset)}
            >
              <ChatCenteredDots size={15} />
              <span>{lang === "zh" ? preset.question_zh : preset.question}</span>
            </button>
          ))}
        </div>

        <form className="copilot-form" onSubmit={(event) => void handleAsk(event)}>
          <input
            className="text-input"
            type="text"
            value={customQuery}
            onChange={(event) => setCustomQuery(event.target.value)}
            placeholder={lang === "zh" ? "直接提问：为什么这次逼抢被打穿？" : "Ask anything about this play…"}
            aria-label="Ask MatchMind tactical question"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={asking}>
            <PaperPlaneRight size={14} weight="bold" />
            <span>{asking ? "…" : lang === "zh" ? "提问" : "Ask"}</span>
          </button>
        </form>

        {activeQA && (
          <motion.div
            key={`${activeQA.id}-${lang}`}
            className="copilot-answer-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <span className="verified-stamp"><Check size={12} weight="bold" /> Verified against events</span>
            <p className="copilot-answer-text">{lang === "zh" ? activeQA.answer_zh : activeQA.answer}</p>
            <div className="copilot-evidence">
              {activeQA.event_ids.slice(0, 2).map((evId, idx) => (
                <button key={evId} type="button" className="ev-chip" onClick={() => onSeekEvent(evId)}>
                  <Crosshair size={13} /> Watch play {idx + 1} <code>{evId}</code>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
