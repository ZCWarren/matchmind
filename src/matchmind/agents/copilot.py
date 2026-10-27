"""Live Tactical Copilot with MCP evidence and deterministic release checks."""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import sys
from typing import Any

from agent_framework import Agent, MCPStdioTool

from matchmind.agents.blackboard import CopilotQA, build_blackboard
from matchmind.agents.json_utils import run_json_agent
from matchmind.agents.llm import build_chat_client
from matchmind.agents.retry import retry_async
from matchmind.analytics import build_snapshot, detect_moments, load_match
from matchmind.analytics.models import Metric
from matchmind.config import settings
from matchmind.mcp.server import get_player_summary, get_pressure_comparison, get_tactical_chain
from matchmind.models.event import Event, MatchBundle

COPILOT_INSTRUCTIONS = """You are MatchMind Tactical Copilot. Answer questions about one
synthetic football match using only evidence obtained from the MCP analytics tools and the
supplied MatchBlackboard.

Rules:
- Call at least one MCP analytics tool before answering. Use additional tools when needed.
- Write answer in concise English and answer_zh in natural Simplified Chinese.
- Every verified answer must cite at least one relevant event_id returned by a tool.
- Every number in either answer must be supported by metric_refs or by a cited raw event.
- Use metric names and values exactly as returned by tools. Do not derive new statistics.
- For raw event fields use these metric names: event_pressure, event_speed, ball_speed,
  shot_speed, difficulty, distance. Use formula_version event-v1.
- For player aggregates use: touches, passes, pass_completion, shots, sprints,
  sprint_distance_m, top_speed_kmh. Use formula_version player-summary-v1.
- For tactical chains use: territorial_gain_x, peak_pressure, sequence_length.
  Use formula_version tactical-chain-v1.
- For pressure comparisons use: pressure_percentile, match_peak_speed_kmh,
  event_speed_kmh, event_pressure. Use formula_version pressure-comparison-v1.
- Never invent events, players, numbers, tactical facts, or superlatives.
- Do not answer questions about injuries, transfers, betting, or real people.
- If the available tools cannot support a complete answer, set verified=false and briefly
  say what evidence is missing in both languages. Do not guess.
- Return only one JSON object matching the CopilotQA schema. No markdown.
"""

NUMBER_RE = re.compile(r"(?<![A-Za-z0-9_-])-?\d+(?:\.\d+)?")
EVENT_FIELDS = {
    "event_pressure": "pressure",
    "event_speed": "speed_kmh",
    "ball_speed": "ball_speed_kmh",
    "shot_speed": "shot_speed_kmh",
    "difficulty": "difficulty",
    "distance": "distance_m",
}
PLAYER_FIELDS = {
    "touches",
    "passes",
    "pass_completion",
    "shots",
    "sprints",
    "sprint_distance_m",
    "top_speed_kmh",
}
CHAIN_FIELDS = {"territorial_gain_x", "peak_pressure", "sequence_length"}
PRESSURE_FIELDS = {
    "pressure_percentile",
    "match_peak_speed_kmh",
    "event_speed_kmh",
    "event_pressure",
}


def _close(actual: float, expected: float) -> bool:
    return abs(actual - expected) <= max(0.011, abs(expected) * 0.001)


def _metric_matches(ref: Any, metric: Metric) -> bool:
    return (
        ref.name == metric.name
        and ref.formula_version == metric.formula_version
        and _close(ref.value, metric.value)
    )


def _event_number_values(event: Event) -> set[float]:
    values = {
        float(event.clock.period),
        float(event.clock.minute),
        float(event.clock.second),
        float(event.location.x),
        float(event.location.y),
        float(event.pressure),
        float(event.score.home),
        float(event.score.away),
    }
    if event.end_location:
        values.update((float(event.end_location.x), float(event.end_location.y)))
    for field in (
        "ball_speed_kmh",
        "shot_speed_kmh",
        "speed_kmh",
        "distance_m",
        "difficulty",
    ):
        value = getattr(event, field)
        if value is not None:
            values.add(float(value))
    return values


def _validate_metric_ref(ref: Any, bundle: MatchBundle, metrics: list[Metric]) -> str | None:
    if any(_metric_matches(ref, metric) for metric in metrics):
        return None
    events_by_id = {event.event_id: event for event in bundle.events}
    if any(event_id not in events_by_id for event_id in ref.event_ids):
        return f"Metric {ref.name} references an unknown event"
    if ref.name in EVENT_FIELDS and ref.formula_version == "event-v1":
        field = EVENT_FIELDS[ref.name]
        values = [
            getattr(events_by_id[event_id], field)
            for event_id in ref.event_ids
            if getattr(events_by_id[event_id], field) is not None
        ]
        if any(_close(ref.value, float(value)) for value in values):
            return None
    if ref.name in PLAYER_FIELDS and ref.formula_version == "player-summary-v1":
        player_ids = {
            events_by_id[event_id].player_id
            for event_id in ref.event_ids
            if events_by_id[event_id].player_id
        }
        for player_id in player_ids:
            summary = get_player_summary(bundle.match.match_id, player_id)
            if _close(ref.value, float(summary[ref.name])):
                return None
    if ref.name in CHAIN_FIELDS and ref.formula_version == "tactical-chain-v1":
        for event_id in ref.event_ids:
            chain = get_tactical_chain(bundle.match.match_id, event_id)
            if _close(ref.value, float(chain[ref.name])):
                return None
    if ref.name in PRESSURE_FIELDS and ref.formula_version == "pressure-comparison-v1":
        for event_id in ref.event_ids:
            comparison = get_pressure_comparison(bundle.match.match_id, event_id)
            if _close(ref.value, float(comparison[ref.name])):
                return None
    return f"Metric {ref.name}={ref.value} does not match deterministic evidence"


def validate_copilot_answer(answer: CopilotQA, bundle: MatchBundle) -> list[str]:
    """Return release-blocking evidence errors for a model-generated answer."""
    if not answer.verified:
        return []
    errors: list[str] = []
    events_by_id = {event.event_id: event for event in bundle.events}
    if not answer.event_ids:
        errors.append("A verified answer must cite at least one event")
    unknown = [event_id for event_id in answer.event_ids if event_id not in events_by_id]
    if unknown:
        errors.append(f"Unknown event references: {', '.join(unknown)}")
    if errors:
        return errors

    snapshot = build_snapshot(bundle)
    metrics = list(snapshot.metrics.values())
    for moment in detect_moments(bundle):
        metrics.extend(moment.metrics.values())
    for ref in answer.metric_refs:
        error = _validate_metric_ref(ref, bundle, metrics)
        if error:
            errors.append(error)

    allowed_numbers = {float(ref.value) for ref in answer.metric_refs}
    for event_id in answer.event_ids:
        allowed_numbers.update(_event_number_values(events_by_id[event_id]))
    allowed_numbers.update(
        (float(bundle.match.final_score.home), float(bundle.match.final_score.away))
    )
    for language, text in (("English", answer.answer), ("Chinese", answer.answer_zh)):
        for token in NUMBER_RE.findall(text):
            value = float(token)
            if not any(_close(value, allowed) for allowed in allowed_numbers):
                errors.append(f"{language} answer contains unsupported number {token}")
    return sorted(set(errors))


def _withheld_answer(question: str, notice: str) -> CopilotQA:
    return CopilotQA(
        id=f"withheld-{hashlib.sha1(question.encode()).hexdigest()[:10]}",
        question=question,
        question_zh=question,
        answer="I cannot verify a complete answer from the available match evidence.",
        answer_zh="现有比赛证据不足以核验完整回答，因此我不会猜测。",
        event_ids=[],
        metric_refs=[],
        verified=False,
        source="live",
        notice=notice,
    )


async def _run_live_copilot(match_id: str, question: str, context: dict[str, Any]) -> CopilotQA:
    prompt = (
        f"Match ID: {match_id}\nQuestion: {question}\n\n"
        f"MatchBlackboard context:\n{json.dumps(context, ensure_ascii=False)}\n\n"
        "Use MCP analytics tools to gather evidence, then return one CopilotQA JSON object."
    )
    async with MCPStdioTool(
        name="analytics",
        command=sys.executable,
        args=["-m", "matchmind.mcp.server"],
        approval_mode="never_require",
        allowed_tools=[
            "get_match_info",
            "get_event_window",
            "get_snapshot",
            "get_moments",
            "get_player_summary",
            "get_tactical_chain",
            "get_pressure_comparison",
        ],
        request_timeout=settings.llm_timeout_seconds,
    ) as tool:
        agent = Agent(
            client=build_chat_client(),
            name="TacticalCopilot",
            instructions=COPILOT_INSTRUCTIONS,
            tools=tool,
        )

        async def attempt() -> CopilotQA:
            return await asyncio.wait_for(
                run_json_agent(agent, prompt, CopilotQA),
                timeout=settings.llm_timeout_seconds,
            )

        draft = await retry_async(
            attempt,
            attempts=settings.agent_max_attempts,
            delay_seconds=settings.agent_retry_delay_seconds,
        )
        draft = draft.model_copy(
            update={
                "id": f"live-{hashlib.sha1(question.encode()).hexdigest()[:10]}",
                "question": question,
                "source": "live",
                "notice": "",
            }
        )
        bundle = load_match(match_id)
        errors = validate_copilot_answer(draft, bundle)
        if not errors:
            return draft
        if not draft.verified:
            return _withheld_answer(question, "The model could not ground this answer in evidence.")

        repair_prompt = (
            f"{prompt}\n\nPrevious answer:\n{draft.model_dump_json()}\n\n"
            f"Deterministic release errors:\n{json.dumps(errors, ensure_ascii=False)}\n"
            "Correct the answer using MCP evidence. If you cannot resolve every error, "
            "set verified=false and do not make factual claims."
        )
        repaired = await asyncio.wait_for(
            run_json_agent(agent, repair_prompt, CopilotQA),
            timeout=settings.llm_timeout_seconds,
        )
        repaired = repaired.model_copy(
            update={
                "id": draft.id,
                "question": question,
                "source": "live",
                "notice": "",
            }
        )
        repaired_errors = validate_copilot_answer(repaired, bundle)
        if repaired.verified and not repaired_errors:
            return repaired
        return _withheld_answer(
            question,
            "The live answer was withheld because deterministic evidence checks failed.",
        )


async def answer_copilot_question(match_id: str, question: str) -> CopilotQA:
    """Answer a preset directly or run a real MCP-backed model query."""
    board = build_blackboard(match_id)
    normalized = question.strip().casefold()
    for preset in board.copilot_presets:
        if normalized in {preset.question.casefold(), preset.question_zh.casefold()}:
            return preset.model_copy(update={"source": "preset"})
    if not settings.allow_live_generation:
        raise RuntimeError(
            "Live Copilot is disabled; choose a preset question or enable live generation"
        )
    context = {
        "narrative_title": board.narrative_title,
        "tactical_thread": board.tactical_thread,
        "story_arc": [chapter.model_dump(mode="json") for chapter in board.story_arc],
        "verified_preset_examples": [
            preset.model_dump(mode="json") for preset in board.copilot_presets
        ],
    }
    return await _run_live_copilot(match_id, question.strip(), context)
