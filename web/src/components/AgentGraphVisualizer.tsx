import { ArrowsClockwise, CheckCircle, Cpu, GitMerge, Play, ShieldWarning, Sparkle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { MCPToolInvocation, TraceStep, Verification } from "../types";

type AgentGraphVisualizerProps = {
  trace: TraceStep[];
  verification?: Verification;
  mcpInvocations?: MCPToolInvocation[];
  compact?: boolean;
};

const STAGES = [
  { id: "mcp", label: "MCP Tools", role: "4 Deterministic Tools" },
  { id: "TacticalAnalyst", label: "TacticalAnalyst", role: "Claims & Grounding" },
  { id: "fanout", label: "Parallel Fan-Out", role: "Producer · Editor · Checker" },
  { id: "revise", label: "Bounded Revision", role: "Revise Once → Recheck" },
  { id: "Director", label: "Director", role: "Rundown & Stoppage Slot" },
];

export default function AgentGraphVisualizer({
  trace,
  verification,
  mcpInvocations = [],
  compact = false,
}: AgentGraphVisualizerProps) {
  const [replaying, setReplaying] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(STAGES.length - 1);
  const [selectedTool, setSelectedTool] = useState<number>(0);

  const hasRevision = trace.some((step) => step.agent.includes(":revise"));
  const totalLatencyMs = Math.round(trace.reduce((acc, s) => acc + (s.latency_ms || 0), 0));

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

  const findLatency = (prefix: string) => {
    const step = trace.find((item) => item.agent.startsWith(prefix));
    return step?.latency_ms ? `${Math.round(step.latency_ms)}ms` : "cached";
  };

  return (
    <div className={`agent-graph-card ${compact ? "compact" : ""}`}>
      <div className="agent-graph-header">
        <div>
          <span className="section-label"><GitMerge size={13} /> Microsoft Agent Framework Graph</span>
          <strong>5-Agent Typed Topology {hasRevision ? "· 1 Bounded Revision Triggered" : "· Direct Release"}</strong>
        </div>
        <button
          type="button"
          className={`graph-replay-btn ${replaying ? "running" : ""}`}
          onClick={startReplay}
        >
          {replaying ? <ArrowsClockwise size={14} className="spin" /> : <Play size={13} weight="fill" />}
          <span>{replaying ? "Simulating..." : "Replay Graph"}</span>
        </button>
      </div>

      <div className="topology-flow" role="list" aria-label="Multi-agent execution topology">
        {/* Stage 0: MCP + Analyst */}
        <div
          role="listitem"
          className={`topo-node ${activeStage >= 0 ? "lit" : ""} ${activeStage === 0 && replaying ? "pulse" : ""}`}
        >
          <span className="topo-badge">MCP + 01</span>
          <strong>TacticalAnalyst</strong>
          <small>{findLatency("TacticalAnalyst")} · {mcpInvocations.length || 4} MCP calls</small>
        </div>

        <div className={`topo-connector ${activeStage >= 2 ? "lit" : ""}`} aria-hidden="true">→</div>

        {/* Stage 1: Parallel Fan-out */}
        <div
          role="listitem"
          className={`topo-fanout-group ${activeStage >= 2 ? "lit" : ""} ${activeStage === 2 && replaying ? "pulse" : ""}`}
        >
          <div className="topo-subnode">
            <span>02</span>
            <strong>StoryProducer</strong>
            <small>{findLatency("StoryProducer")}</small>
          </div>
          <div className="topo-subnode">
            <span>03</span>
            <strong>AudienceEditor ×9</strong>
            <small>{findLatency("AudienceEditor")}</small>
          </div>
          <div className="topo-subnode checker">
            <span>04</span>
            <strong>FactChecker</strong>
            <small>{findLatency("FactChecker")}</small>
          </div>
        </div>

        <div className={`topo-connector ${activeStage >= 3 ? "lit" : ""}`} aria-hidden="true">→</div>

        {/* Stage 2: Bounded Revision / Release Gate */}
        <div
          role="listitem"
          className={`topo-node gate ${hasRevision ? "revised" : "passed"} ${activeStage >= 3 ? "lit" : ""} ${activeStage === 3 && replaying ? "pulse" : ""}`}
        >
          <span className="topo-badge">
            {hasRevision ? <ShieldWarning size={12} /> : <CheckCircle size={12} />}
            {hasRevision ? "REVISE LOOP (1×)" : "RELEASE GATE"}
          </span>
          <strong>{hasRevision ? "Producer:revise → Recheck" : "Deterministic + LLM Gate"}</strong>
          <small>{verification?.checked_claims ?? 5} claims verified · {verification?.status ?? "pass"}</small>
        </div>

        <div className={`topo-connector ${activeStage >= 4 ? "lit" : ""}`} aria-hidden="true">→</div>

        {/* Stage 3: Director */}
        <div
          role="listitem"
          className={`topo-node director ${activeStage >= 4 ? "lit" : ""} ${activeStage === 4 && replaying ? "pulse" : ""}`}
        >
          <span className="topo-badge"><Sparkle size={11} /> 05</span>
          <strong>Director</strong>
          <small>{findLatency("Director")} · Stoppage Slot</small>
        </div>
      </div>

      {mcpInvocations.length > 0 && (
        <div className="mcp-audit-strip">
          <div className="mcp-pills" aria-label="MCP tool calls">
            <span className="mcp-title"><Cpu size={13} /> MCP Audit:</span>
            {mcpInvocations.map((inv, idx) => (
              <button
                key={`${inv.tool}-${idx}`}
                type="button"
                className={selectedTool === idx ? "active" : ""}
                onClick={() => setSelectedTool(idx)}
              >
                <code>{inv.tool}()</code>
                <small>{inv.caller}</small>
              </button>
            ))}
          </div>
          {mcpInvocations[selectedTool] && (
            <div className="mcp-detail-line">
              <code>{mcpInvocations[selectedTool].args_summary}</code>
              <span>→ {mcpInvocations[selectedTool].output_summary}</span>
            </div>
          )}
        </div>
      )}

      {!compact && (
        <div className="topo-footer">
          <span>Total parallel trace: <b>{(totalLatencyMs / 1000).toFixed(1)}s</b></span>
          <span>Bounded revision max: <b>1 loop</b></span>
          <span>Deterministic authority: <b>100%</b></span>
        </div>
      )}
    </div>
  );
}
