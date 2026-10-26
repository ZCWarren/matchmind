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

  return (
    <section className="blackboard-copilot-section" aria-label="MatchBlackboard Story Arc and Tactical Copilot">
      {/* 1. Multi-Moment Story Arc */}
      <div className="story-arc-panel">
        <header className="story-arc-head">
          <div>
            <span className="section-label"><Compass size={14} /> MatchBlackboard · Multi-Moment Narrative Arc</span>
            <strong>{blackboard.narrative_title}</strong>
            <p>{blackboard.tactical_thread}</p>
          </div>
          <div className="blackboard-badges">
            <span><b>{blackboard.story_arc.length}</b> linked acts</span>
            <span><b>{blackboard.deduped_claims_count}</b> duplicate claims suppressed</span>
          </div>
        </header>

        <div className="story-arc-grid">
          {blackboard.story_arc.map((chapter) => {
            const isSelected = selectedMomentId === chapter.moment_id;
            return (
              <button
                key={chapter.moment_id}
                type="button"
                className={`story-arc-card ${isSelected ? "active" : ""}`}
                onClick={() => handleChapterClick(chapter.moment_id, chapter.event_id)}
              >
                <div className="arc-card-top">
                  <span className="arc-act-tag">{chapter.act_label}</span>
                  <span className="arc-clock">{formatClock(chapter.clock)}</span>
                </div>
                <strong>{chapter.headline}</strong>
                <p>{chapter.causal_link}</p>
                <div className="arc-card-foot">
                  <span>{chapter.key_metric_label}: <b>{chapter.key_metric_value}</b></span>
                  <code>{chapter.event_id}</code>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ask MatchMind · Tactical Copilot */}
      <div className="copilot-panel">
        <header className="copilot-head">
          <div>
            <span className="section-label"><Sparkle size={14} /> Ask MatchMind · Grounded Tactical Copilot</span>
            <strong>Every tactical answer is locked to deterministic event IDs & formulas</strong>
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
              <ChatCenteredDots size={14} />
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
                ? "输入战术问题（例如：为什么 72 分钟逼抢失败？或 这次冲刺是全场最快吗？）"
                : "Ask a tactical question (e.g., Why did the 72' press fail? Was that the fastest sprint?)"
            }
            aria-label="Ask MatchMind tactical question"
          />
          <button type="submit" disabled={asking}>
            <PaperPlaneRight size={15} weight="bold" />
            <span>{asking ? "..." : lang === "zh" ? "追问" : "Ask"}</span>
          </button>
        </form>

        {activeQA && (
          <div className="copilot-answer-box">
            <div className="copilot-answer-meta">
              <span className="verified-stamp"><Check size={12} weight="bold" /> Deterministic Gate Verified</span>
              <span className="copilot-q-title">{lang === "zh" ? activeQA.question_zh : activeQA.question}</span>
            </div>
            <p className="copilot-answer-text">{lang === "zh" ? activeQA.answer_zh : activeQA.answer}</p>
            <div className="copilot-evidence-chips">
              {activeQA.event_ids.map((evId) => (
                <button key={evId} type="button" className="ev-chip" onClick={() => onSeekEvent(evId)}>
                  <Crosshair size={12} /> Event {evId}
                </button>
              ))}
              {activeQA.metric_refs.map((ref) => (
                <span key={ref.name} className="metric-chip">
                  {ref.name}: <b>{ref.value}</b> <em>({ref.formula_version})</em>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
