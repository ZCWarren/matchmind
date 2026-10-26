"""The five-agent graph: typed fan-out, bounded revision, and direction."""

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
        "review",
        "revise",
        "finalize",
        "recheck",
    ]


async def run_fake_graph(monkeypatch, reviews: list[VerificationResult], action="approve"):
    async def fake_analyst(match_id, moment, snapshot, events, tools):
        return fallback_insight(moment, snapshot)

    async def fake_producer(candidate, feedback=None):
        return fallback_cue(candidate)

    async def fake_cards(candidate, profiles, languages, trace):
        return [
            fallback_card(candidate, profile, language)
            for profile in profiles
            for language in languages
        ]

    remaining = reviews.copy()

    async def fake_checker(candidate, evidence):
        return remaining.pop(0) if len(remaining) > 1 else remaining[0]

    async def fake_director(candidate, verification, options):
        return RundownDecision(
            action=action,
            priority=0.7,
            duration_seconds=8,
            reason="test",
            ranked_moment_ids=[item["moment_id"] for item in options],
        )

    monkeypatch.setattr(workflow._PIPELINE, "_analyst", fake_analyst)
    monkeypatch.setattr(workflow._PIPELINE, "_producer", fake_producer)
    monkeypatch.setattr(workflow._PIPELINE, "_generate_cards", fake_cards)
    monkeypatch.setattr(workflow._PIPELINE, "_checker", fake_checker)
    monkeypatch.setattr(workflow._PIPELINE, "_director", fake_director)
    request = PipelineRequest(
        profiles=["casual"], languages=["en"], use_mcp=False, use_cache=False
    )
    return await workflow.run_graph_pipeline("ast-2026-1018-nhr-orn", request)


async def test_workflow_runs_with_typed_envelopes(monkeypatch) -> None:
    result = await run_fake_graph(
        monkeypatch, [VerificationResult(status="pass", checked_claims=1)]
    )

    assert result.verification.status == "pass"
    assert result.decision.action == "approve"
    assert result.cue is not None
    assert len(result.fan_cards) == 1
    assert result.fallback is False
    assert result.rundown[0].moment_id == result.moment.moment_id
    assert result.decision.air_at is not None
    assert [step.agent for step in result.trace] == [
        "TacticalAnalyst",
        "StoryProducer",
        "AudienceEditor",
        "FactChecker",
        "Director",
    ]


async def test_workflow_revises_once_and_rechecks(monkeypatch) -> None:
    result = await run_fake_graph(
        monkeypatch,
        [VerificationResult(status="revise"), VerificationResult(status="pass")],
    )

    assert result.verification.status == "pass"
    assert result.cue is not None
    assert [step.agent for step in result.trace][-3:] == [
        "StoryProducer:revise",
        "FactChecker:recheck",
        "Director",
    ]


async def test_workflow_holds_after_failed_revision(monkeypatch) -> None:
    result = await run_fake_graph(
        monkeypatch,
        [
            VerificationResult(status="revise"),
            VerificationResult.model_validate(
                {
                    "status": "revise",
                    "issues": [{"message": "Unresolved error", "severity": "error"}],
                }
            ),
        ],
    )

    assert result.verification.status == "revise"
    assert result.decision.action == "hold"
    assert result.cue is None
    assert [step.agent for step in result.trace].count("StoryProducer:revise") == 1


async def test_director_hold_keeps_verified_cue_for_human_override(monkeypatch) -> None:
    result = await run_fake_graph(
        monkeypatch, [VerificationResult(status="pass", checked_claims=1)], action="hold"
    )

    assert result.verification.status == "pass"
    assert result.decision.action == "hold"
    assert result.cue is not None
