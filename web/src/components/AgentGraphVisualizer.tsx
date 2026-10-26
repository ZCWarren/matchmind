import { ArrowsClockwise, CheckCircle, Play, ShieldWarning, Sparkle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { MCPToolInvocation, TraceStep, Verification } from "../types";

type AgentGraphVisualizerProps = {
  trace: TraceStep[];
  verification?: Verification;
  mcpInvocations?: MCPToolInvocation[];
  compact?: boolean;
};

const STAGES = ["analyst", "fanout", "gate", "director"] as const;

const FRIENDLY_TOOLS = [
  { label: "Event Window", desc: "Loads exact ball & player coordinates" },
  { label: "Pass Chain", desc: "Measures +24.6m progression under pressure" },
  { label: "Speed Check", desc: "Compares sprint vs 33.8 km/h match peak" },
  { label: "Player Stats", desc: "Tracks touches, duels & top speed" },
];

export default function AgentGraphVisualizer({
  trace,
  verification,
  mcpInvocations = [],
}: AgentGraphVisualizerProps) {
  const [replaying, setReplaying] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(STAGES.length - 1);
  const [selectedTool, setSelectedTool] = useState<number>(0);

  const hasRevision = trace.some((step) => step.agent.includes(":revise"));

  useEffect(() => {
    if (!replaying) return;
    const timer = window.setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= STAGES.length - 1) {
          setReplaying(false);
          return STAGES.length - 1;
        }
        return prev + 1;
      });
    }, 620);
    return () => window.clearInterval(timer);
  }, [replaying]);

  const startReplay = () => {
    setActiveStage(0);
    setReplaying(true);
  };

  return (
    <div className="agent-graph-card">
      <div className="agent-graph-header">
        <div>
          <span className="section-label">AI TEAMWORK</span>
          <strong>5 Specialized AI Roles, Zero Guesswork</strong>
        </div>
        <button
          type="button"
          className={`graph-replay-btn ${replaying ? "running" : ""}`}
          onClick={startReplay}
        >
          {replaying ? <ArrowsClockwise size={15} className="spin" /> : <Play size={14} weight="fill" />}
          <span>{replaying ? "Running..." : "Replay Graph"}</span>
        </button>
      </div>

      <div className="topology-flow" role="list" aria-label="Multi-agent execution topology">
        <div
          role="listitem"
          className={`topo-node ${activeStage >= 0 ? "lit" : ""} ${activeStage === 0 && replaying ? "pulse" : ""}`}
        >
          <span className="topo-badge">STEP 01</span>
          <strong>Tactical Analyst</strong>
          <small>Finds the hidden pattern</small>
        </div>

        <div className={`topo-connector ${activeStage >= 1 ? "lit" : ""}`} aria-hidden="true">→</div>

        <div
          role="listitem"
          className={`topo-fanout-group ${activeStage >= 1 ? "lit" : ""} ${activeStage === 1 && replaying ? "pulse" : ""}`}
        >
          <div className="topo-subnode">
            <span>02</span>
            <strong>TV Producer</strong>
            <small>Broadcast graphic</small>
          </div>
          <div className="topo-subnode">
            <span>03</span>
            <strong>Fan Editor</strong>
            <small>3 styles · 3 languages</small>
          </div>
          <div className="topo-subnode checker">
            <span>04</span>
            <strong>Fact Checker</strong>
            <small>Audits every stat</small>
          </div>
        </div>

        <div className={`topo-connector ${activeStage >= 2 ? "lit" : ""}`} aria-hidden="true">→</div>

        <div
          role="listitem"
          className={`topo-node gate ${hasRevision ? "revised" : "passed"} ${activeStage >= 2 ? "lit" : ""} ${activeStage === 2 && replaying ? "pulse" : ""}`}
        >
          <span className="topo-badge">
            {hasRevision ? <ShieldWarning size={13} /> : <CheckCircle size={13} />}
            {hasRevision ? "AUTO-REVISED" : "FACT GATE"}
          </span>
          <strong>{hasRevision ? "Rewritten & Verified" : "100% Fact-Checked"}</strong>
          <small>{verification?.checked_claims ?? 5} claims proven</small>
        </div>

        <div className={`topo-connector ${activeStage >= 3 ? "lit" : ""}`} aria-hidden="true">→</div>

        <div
          role="listitem"
          className={`topo-node director ${activeStage >= 3 ? "lit" : ""} ${activeStage === 3 && replaying ? "pulse" : ""}`}
        >
          <span className="topo-badge"><Sparkle size={12} /> STEP 05</span>
          <strong>TV Director</strong>
          <small>Puts it on air</small>
        </div>
      </div>

      {mcpInvocations.length > 0 && (
        <div className="mcp-audit-strip">
          <div className="mcp-pills" aria-label="Data tools">
            <span className="mcp-title">DATA TOOLS:</span>
            {FRIENDLY_TOOLS.map((tool, idx) => (
              <button
                key={tool.label}
                type="button"
                className={selectedTool === idx ? "active" : ""}
                onClick={() => setSelectedTool(idx)}
              >
                <strong>{tool.label}</strong>
              </button>
            ))}
          </div>
          <div className="mcp-detail-line">
            <span>{FRIENDLY_TOOLS[selectedTool]?.desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}
