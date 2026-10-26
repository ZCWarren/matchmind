import { ArrowsClockwise, Play } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { MCPToolInvocation, TraceStep, Verification } from "../types";
import AgentPipeline from "./AgentPipeline";

type AgentGraphVisualizerProps = {
  trace: TraceStep[];
  verification?: Verification;
  mcpInvocations?: MCPToolInvocation[];
  compact?: boolean;
};

const LAST_STAGE = 5;

const FRIENDLY_TOOLS = [
  { label: "Event window", desc: "Loads exact ball and player coordinates around the moment." },
  { label: "Pass chain", desc: "Measures the 24.6 m progression under pressure, event by event." },
  { label: "Speed check", desc: "Compares a sprint against the 33.8 km/h match peak before any superlative." },
  { label: "Player stats", desc: "Tracks touches, duels and top speed for the players involved." },
];

export default function AgentGraphVisualizer({ trace, verification, mcpInvocations = [] }: AgentGraphVisualizerProps) {
  const [replaying, setReplaying] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(LAST_STAGE);
  const [selectedTool, setSelectedTool] = useState<number>(0);

  useEffect(() => {
    if (!replaying) return;
    const timer = window.setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= LAST_STAGE) {
          setReplaying(false);
          return LAST_STAGE;
        }
        return prev + 1;
      });
    }, 560);
    return () => window.clearInterval(timer);
  }, [replaying]);

  return (
    <section className="agent-graph-card panel" aria-label="Five-agent graph">
      <header className="deck-head">
        <div>
          <span className="section-label">Agent graph</span>
          <h2 className="deck-title">Five roles. <em>Zero guesswork.</em></h2>
        </div>
        <button
          type="button"
          className={`btn btn-glass btn-sm graph-replay-btn ${replaying ? "running" : ""}`}
          onClick={() => {
            setActiveStage(-1);
            setReplaying(true);
          }}
        >
          {replaying ? <ArrowsClockwise size={15} className="spin" /> : <Play size={13} weight="fill" />}
          <span>{replaying ? "Running…" : "Replay Graph"}</span>
        </button>
      </header>

      <AgentPipeline trace={trace} verification={verification} activeStage={activeStage} />

      {mcpInvocations.length > 0 && (
        <div className="mcp-strip">
          <span className="mcp-title">MCP data tools</span>
          <div className="segmented mcp-pills" aria-label="Data tools">
            {FRIENDLY_TOOLS.map((tool, idx) => (
              <button key={tool.label} type="button" className={selectedTool === idx ? "active" : ""} onClick={() => setSelectedTool(idx)}>
                {tool.label}
              </button>
            ))}
          </div>
          <p className="mcp-detail">{FRIENDLY_TOOLS[selectedTool]?.desc}</p>
        </div>
      )}
    </section>
  );
}
