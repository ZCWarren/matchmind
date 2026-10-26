import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { TraceStep, Verification } from "../types";

type Tone = "ice" | "violet" | "verify" | "flood" | "signal";
type Node = { id: string; x: number; y: number; label: string; sub: string; tone: Tone; stage: number; kind?: "gate" | "out" };

const W = 150;
const H = 62;

function nodes(eventsCount: number, checked: number): Node[] {
  return [
    { id: "events", x: 95, y: 220, label: "Match events", sub: `${eventsCount ? eventsCount.toLocaleString() : "1,275"} events`, tone: "ice", stage: 0 },
    { id: "analytics", x: 268, y: 220, label: "Analytics", sub: "xG · xT · pressure", tone: "ice", stage: 0 },
    { id: "analyst", x: 450, y: 220, label: "TacticalAnalyst", sub: "grounded claims", tone: "violet", stage: 1 },
    { id: "producer", x: 650, y: 96, label: "StoryProducer", sub: "broadcast cue", tone: "violet", stage: 2 },
    { id: "audience", x: 650, y: 220, label: "AudienceEditor", sub: "3 profiles × 3 langs", tone: "violet", stage: 2 },
    { id: "checker", x: 650, y: 344, label: "FactChecker", sub: "challenges claims", tone: "violet", stage: 2 },
    { id: "verifier", x: 846, y: 220, label: "Verifier", sub: `${checked} claims · gate`, tone: "verify", stage: 3, kind: "gate" },
    { id: "director", x: 1012, y: 220, label: "Director", sub: "approve · hold", tone: "flood", stage: 4 },
    { id: "studio", x: 1150, y: 140, label: "Studio", sub: "", tone: "flood", stage: 5, kind: "out" },
    { id: "overlay", x: 1150, y: 220, label: "Overlay", sub: "", tone: "flood", stage: 5, kind: "out" },
    { id: "fan", x: 1150, y: 300, label: "Fan", sub: "", tone: "flood", stage: 5, kind: "out" },
  ];
}

const EDGES: [string, string, number][] = [
  ["events", "analytics", 0],
  ["analytics", "analyst", 1],
  ["analyst", "producer", 2],
  ["analyst", "audience", 2],
  ["analyst", "checker", 2],
  ["producer", "verifier", 3],
  ["audience", "verifier", 3],
  ["checker", "verifier", 3],
  ["verifier", "director", 4],
  ["director", "studio", 5],
  ["director", "overlay", 5],
  ["director", "fan", 5],
];

function anchor(node: Node, side: "in" | "out") {
  const half = node.kind === "gate" ? 44 : node.kind === "out" ? 40 : W / 2;
  return { x: node.x + (side === "out" ? half : -half), y: node.y };
}

function edgePath(a: Node, b: Node) {
  const s = anchor(a, "out");
  const e = anchor(b, "in");
  const dx = (e.x - s.x) * 0.5;
  return `M ${s.x} ${s.y} C ${s.x + dx} ${s.y}, ${e.x - dx} ${e.y}, ${e.x} ${e.y}`;
}

const AGENT_TONE: Record<string, Tone> = {
  TacticalAnalyst: "violet",
  StoryProducer: "violet",
  AudienceEditor: "violet",
  FactChecker: "signal",
  Director: "flood",
};

export default function AgentPipeline({
  trace,
  verification,
  eventsCount = 0,
  activeStage,
  showTrace = true,
}: {
  trace?: TraceStep[];
  verification?: Verification;
  eventsCount?: number;
  /** When provided, the graph is driven externally (e.g. Replay Graph). Otherwise it auto-plays in view. */
  activeStage?: number;
  showTrace?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -15% 0px" });
  const [autoStage, setAutoStage] = useState(5);
  useEffect(() => {
    if (activeStage !== undefined || !inView) return;
    let stage = 5;
    setAutoStage(5);
    const timer = window.setInterval(() => {
      stage = stage >= 9 ? 0 : stage + 1;
      setAutoStage(Math.min(5, stage));
    }, 650);
    return () => window.clearInterval(timer);
  }, [activeStage, inView]);
  const stage = activeStage ?? autoStage;
  const checked = verification?.checked_claims ?? 5;
  const list = nodes(eventsCount, checked);
  const byId = new Map(list.map((node) => [node.id, node]));
  const revised = Boolean(trace?.some((step) => step.agent.includes(":revise")));
  const status = verification?.status ?? "pass";

  return (
    <div className="agent-pipeline" ref={ref}>
      <svg className="pipeline-svg" viewBox="0 0 1200 440" role="img" aria-label="Five-agent pipeline: analytics, analyst, fan-out to producer, audience editor and fact checker, deterministic verifier, director, then studio, overlay and fan.">
        <defs>
          <linearGradient id="pl-lit" x1="0" x2="1">
            <stop offset="0" stopColor="#8B7CFF" />
            <stop offset="1" stopColor="#5CC8FF" />
          </linearGradient>
          <filter id="pl-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {EDGES.map(([from, to, edgeStage]) => {
          const a = byId.get(from)!;
          const b = byId.get(to)!;
          const d = edgePath(a, b);
          const lit = stage >= edgeStage;
          return (
            <g key={`${from}-${to}`}>
              <path d={d} className="pl-edge" />
              <motion.path
                d={d}
                className="pl-edge-lit"
                initial={false}
                animate={{ pathLength: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
              {lit && (
                <circle r="3.5" className="pl-packet" filter="url(#pl-glow)" style={{ pointerEvents: "none" }}>
                  <animateMotion dur="1.8s" repeatCount="indefinite" path={d} begin={`${(edgeStage * 0.17) % 1}s`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* bounded revision loop: checker → producer, once */}
        <g className={`pl-revise ${stage >= 3 ? "lit" : ""} ${revised ? "used" : ""}`}>
          <path d="M 846 172 C 846 40, 760 30, 727 80" className="pl-revise-path" />
          <text x="806" y="46" className="pl-revise-label">revise × 1</text>
        </g>

        {list.map((node) => {
          const lit = stage >= node.stage;
          if (node.kind === "gate") {
            return (
              <g key={node.id} className={`pl-node gate tone-${node.tone} ${lit ? "lit" : ""}`}>
                <circle cx={node.x} cy={node.y} r="58" className="pl-gate-halo" />
                <circle cx={node.x} cy={node.y} r="44" className="pl-gate" />
                <path d={`M ${node.x} ${node.y - 17} l 13 5 v 9 c 0 9 -6 15 -13 18 c -7 -3 -13 -9 -13 -18 v -9 z`} className="pl-shield" />
                <path d={`M ${node.x - 5} ${node.y + 1} l 4 4 l 7 -8`} className="pl-check" />
                <text x={node.x} y={node.y + 76} className="pl-label" textAnchor="middle">{node.label}</text>
                <text x={node.x} y={node.y + 94} className="pl-sub" textAnchor="middle">{status === "pass" ? `${checked} claims · pass` : status}</text>
              </g>
            );
          }
          if (node.kind === "out") {
            return (
              <g key={node.id} className={`pl-node out tone-${node.tone} ${lit ? "lit" : ""}`}>
                <rect x={node.x - 40} y={node.y - 18} width="80" height="36" rx="18" className="pl-box" />
                <text x={node.x} y={node.y + 5} className="pl-label small" textAnchor="middle">{node.label}</text>
              </g>
            );
          }
          return (
            <g key={node.id} className={`pl-node tone-${node.tone} ${lit ? "lit" : ""}`}>
              <rect x={node.x - W / 2} y={node.y - H / 2} width={W} height={H} rx="16" className="pl-box" />
              <circle cx={node.x - W / 2 + 18} cy={node.y - 8} r="3.5" className="pl-dot" />
              <text x={node.x - W / 2 + 30} y={node.y - 4} className="pl-label">{node.label}</text>
              <text x={node.x - W / 2 + 18} y={node.y + 16} className="pl-sub">{node.sub}</text>
            </g>
          );
        })}
      </svg>

      <ol className="pipeline-list" aria-hidden="true">
        {list.filter((node) => node.kind !== "out").map((node) => (
          <li key={node.id} className={`tone-${node.tone} ${stage >= node.stage ? "lit" : ""}`}>
            <i />
            <b>{node.label}</b>
            <span>{node.sub}</span>
          </li>
        ))}
        <li className={`tone-flood ${stage >= 5 ? "lit" : ""}`}><i /><b>Studio · Overlay · Fan</b><span>one verified moment</span></li>
      </ol>

      {showTrace && (
        <div className="trace-strip">
          {(trace?.length ? trace : (["TacticalAnalyst", "StoryProducer", "FactChecker", "AudienceEditor", "Director"].map((agent) => ({
            agent, model: "deepseek", prompt_version: "prompt-v3", latency_ms: 0, status: "ok" as const, error: "",
          })))).map((step, index) => (
            <div key={`${step.agent}-${index}`} className={`trace-chip tone-${AGENT_TONE[step.agent.split(":")[0]] ?? "violet"} ${step.status}`}>
              <span className="mono">{String(index + 1).padStart(2, "0")}</span>
              <b>{step.agent}</b>
              <em className="mono">{step.latency_ms ? `${(step.latency_ms / 1000).toFixed(1)} s` : "cached"}</em>
              <small>{step.model} · {step.prompt_version}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
