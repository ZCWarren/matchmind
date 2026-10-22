"""The five-agent graph: structure and typed fan-out/fan-in execution."""

from __future__ import annotations

from matchmind.agents import workflow
from matchmind.agents.contracts import (
    PipelineRequest,
    RundownDecision,
    VerificationResult,
)
from matchmind.agents.verifier import fallback_card, fallback_cue, fallback_insight


def test_workflow_structure() -> None:
    graph = workflow.build_workflow()
    assert [executor.id for executor in graph.get_executors_list()] == [
        "prepare",
        "analyst",
        "producer",
        "audience",
        "checker",
        "finalize",
    ]


async def test_workflow_runs_with_typed_envelopes(monkeypatch) -> None:
    async def fake_analyst(match_id, moment, snapshot, events, tools):
        return fallback_insight(moment, snapshot)

    async def fake_producer(candidate):
        return fallback_cue(candidate)

    async def fake_cards(candidate, profiles, languages, trace):
        return [
            fallback_card(candidate, profile, language)
            for profile in profiles
            for language in languages
        ]

    async def fake_checker(candidate, evidence):
        return VerificationResult(status="pass", checked_claims=len(candidate.claims))

    async def fake_director(candidate, verification):
        return RundownDecision(action="approve", priority=0.7, duration_seconds=8, reason="test")

    monkeypatch.setattr(workflow._PIPELINE, "_analyst", fake_analyst)
    monkeypatch.setattr(workflow._PIPELINE, "_producer", fake_producer)
    monkeypatch.setattr(workflow._PIPELINE, "_generate_cards", fake_cards)
    monkeypatch.setattr(workflow._PIPELINE, "_checker", fake_checker)
    monkeypatch.setattr(workflow._PIPELINE, "_director", fake_director)

    request = PipelineRequest(
        profiles=["casual"],
        languages=["en"],
        use_mcp=False,
        use_cache=False,
    )
    result = await workflow.run_graph_pipeline("ast-2026-1018-nhr-orn", request)

    assert result.verification.status == "pass"
    assert result.decision.action == "approve"
    assert result.cue is not None
    assert len(result.fan_cards) == 1
    assert result.fallback is False
    assert [step.agent for step in result.trace] == [
        "TacticalAnalyst",
        "StoryProducer",
        "AudienceEditor",
        "FactChecker",
        "Director",
    ]
