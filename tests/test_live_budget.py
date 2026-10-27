"""Model-call budgets include structured-output repair attempts."""

from __future__ import annotations

from types import SimpleNamespace

from matchmind.agents.blackboard import CopilotQA
from matchmind.agents.budget import budget_snapshot, live_budget, reset_budgets
from matchmind.agents.json_utils import run_json_agent
from matchmind.config import settings


async def test_llm_budget_blocks_repair_after_limit(monkeypatch) -> None:
    class InvalidAgent:
        calls = 0

        async def run(self, prompt: str):
            self.calls += 1
            return SimpleNamespace(text="not json")

    reset_budgets()
    monkeypatch.setattr(settings, "max_llm_calls_per_match", 1)
    agent = InvalidAgent()
    try:
        with live_budget("budget-test"):
            await run_json_agent(agent, "question", CopilotQA)
    except RuntimeError as exc:
        assert "budget exhausted" in str(exc)
    else:
        raise AssertionError("repair should consume the same bounded model-call budget")
    assert agent.calls == 1
    assert budget_snapshot("budget-test") == 1
    reset_budgets()
