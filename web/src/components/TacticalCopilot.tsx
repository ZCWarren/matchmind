import { ChatCenteredDots, Check, Compass, Crosshair, PaperPlaneRight, Sparkle } from "@phosphor-icons/react";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { formatClock } from "../lib";
import type { CopilotQA, MatchBlackboardState, Moment } from "../types";

type TacticalCopilotProps = {
  matchId: string;
  blackboard: MatchBlackboardState | null;
  moments: Moment[];
  selectedMomentId?: string;
  onSelectMoment: (moment: Moment) => void;
  onSeekEvent: (eventId: string) => void;
};

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
    if (preset.event_ids[0]) {
      onSeekEvent(preset.event_ids[0]);
    }
  };

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
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
    if (found) {
      onSelectMoment(found);
    } else {
      onSeekEvent(eventId);
    }
  };

  const SHORT_ACT_NAMES = ["01 · The Spark", "02 · Turning Point", "03 · The Climax"];

  return (
    <section className="blackboard-copilot-section" aria-label="Match Story Arc and Tactical Q&A">
      {/* 1. 3-Act Match Story */}
      <div className="story-arc-panel">
        <header className="story-arc-head">
          <div>
            <span className="section-label"><Compass size={14} /> 3-ACT MATCH STORY</span>
            <strong>{blackboard.narrative_title}</strong>
          </div>
          <div className="blackboard-badges">
            <span><b>3</b> Key Moments</span>
          </div>
        </header>

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
                <div className="arc-card-top">
                  <span className="arc-act-tag">{SHORT_ACT_NAMES[idx] ?? chapter.act_label}</span>
                  <span className="arc-clock">{formatClock(chapter.clock)}</span>
                </div>
                <strong>{chapter.headline}</strong>
                <div className="arc-card-foot">
                  <b>{chapter.key_metric_value}</b>
                  <span>View 3D →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ask MatchMind */}
      <div className="copilot-panel">
        <header className="copilot-head">
          <div>
            <span className="section-label"><Sparkle size={14} /> ASK MATCHMIND</span>
            <strong>Instant tactical answers, backed by real play</strong>
          </div>
          <div className="copilot-lang-switch">
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

        <form className="copilot-form" onSubmit={(e) => void handleAsk(e)}>
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder={
              lang === "zh"
                ? "直接提问：为什么这次逼抢被打穿？"
                : "Ask anything about this play..."
            }
            aria-label="Ask MatchMind tactical question"
          />
          <button type="submit" disabled={asking}>
            <PaperPlaneRight size={15} weight="bold" />
            <span>{asking ? "..." : lang === "zh" ? "提问" : "Ask"}</span>
          </button>
        </form>

        {activeQA && (
          <div className="copilot-answer-box">
            <div className="copilot-answer-meta">
              <span className="verified-stamp"><Check size={12} weight="bold" /> Verified</span>
            </div>
            <p className="copilot-answer-text">{lang === "zh" ? activeQA.answer_zh : activeQA.answer}</p>
            <div className="copilot-evidence-chips">
              {activeQA.event_ids.slice(0, 2).map((evId, idx) => (
                <button key={evId} type="button" className="ev-chip" onClick={() => onSeekEvent(evId)}>
                  <Crosshair size={13} /> Watch Play #{idx + 1} on Pitch
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
