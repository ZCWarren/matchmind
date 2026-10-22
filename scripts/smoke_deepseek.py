#!/usr/bin/env python3
"""Smoke-test the DeepSeek API and the Agent Framework provider path.

Usage:
    cp .env.example .env   # add DEEPSEEK_API_KEY
    make smoke

This script never prints the API key. It checks two things:
1. Raw OpenAI-compatible Chat Completions with JSON output.
2. Microsoft Agent Framework using a custom AsyncOpenAI base_url.

If step 2 fails because of an SDK version difference, the error is printed
with the tried constructor variants so it can be fixed quickly.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")


def _env(name: str, default: str) -> str:
    return os.getenv(name, default).strip()


def _key() -> str | None:
    key = _env("DEEPSEEK_API_KEY", "")
    if not key:
        print("DEEPSEEK_API_KEY is not set.")
        print("  cp .env.example .env")
        print("  # then put your DeepSeek key in .env (never paste it into chat)")
        return None
    return key


def _base_url() -> str:
    return _env("DEEPSEEK_BASE_URL", "https://api.deepseek.com")


def _model() -> str:
    return _env("DEEPSEEK_MODEL", "deepseek-flash")


def smoke_raw(key: str) -> bool:
    """Verify the raw OpenAI-compatible endpoint and JSON mode."""
    from openai import OpenAI

    client = OpenAI(api_key=key, base_url=_base_url())
    prompt = (
        'Return exactly one JSON object with the key "ok" set to true. '
        "No markdown, no extra text."
    )
    try:
        response = client.chat.completions.create(
            model=_model(),
            messages=[
                {"role": "system", "content": "You are a JSON-only test endpoint."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )
        content = response.choices[0].message.content or ""
        data = json.loads(content)
        print(f"[raw] PASS model={_model()} response={data}")
        return True
    except Exception as exc:  # noqa: BLE001 - smoke test must report anything
        print(f"[raw] FAIL {type(exc).__name__}: {exc}")
        return False


async def smoke_agent(key: str) -> bool:
    """Verify Agent Framework can talk to DeepSeek via a custom base_url."""
    from agent_framework import Agent
    from agent_framework.openai import OpenAIChatClient, OpenAIChatCompletionClient
    from openai import AsyncOpenAI

    async_client = AsyncOpenAI(api_key=key, base_url=_base_url())
    model = _model()

    # Current Agent Framework (1.22+) supports base_url directly.
    # The async_client variants are kept as a fallback for older releases.
    variants = [
        (
            "OpenAIChatClient(base_url=...)",
            lambda: OpenAIChatClient(model=model, api_key=key, base_url=_base_url()),
        ),
        (
            "OpenAIChatCompletionClient(base_url=...)",
            lambda: OpenAIChatCompletionClient(model=model, api_key=key, base_url=_base_url()),
        ),
        (
            "OpenAIChatClient(async_client=...)",
            lambda: OpenAIChatClient(async_client=async_client, model=model),
        ),
        (
            "OpenAIChatCompletionClient(async_client=...)",
            lambda: OpenAIChatCompletionClient(async_client=async_client, model=model),
        ),
    ]

    errors: list[str] = []
    for label, build in variants:
        try:
            client = build()
            agent = Agent(
                client=client,
                name="SmokeAgent",
                instructions=(
                    "Answer in one short sentence. Confirm that you can see the "
                    "MatchMind smoke-test prompt."
                ),
            )
            result = await agent.run("Say 'agent framework connected' and nothing else.")
            text = getattr(result, "text", None) or str(result)
            print(f"[agent] PASS via {label}: {text[:300]}")
            return True
        except Exception as exc:  # noqa: BLE001 - try the next SDK variant
            errors.append(f"{label}: {type(exc).__name__}: {exc}")

    print("[agent] FAIL all constructor variants")
    for error in errors:
        print(f"  - {error}")
    print("  Check installed versions: uv pip show agent-framework agent-framework-openai")
    return False


def main() -> int:
    key = _key()
    if key is None:
        return 2

    raw_ok = smoke_raw(key)
    agent_ok = asyncio.run(smoke_agent(key))
    print("\nRESULT:", "PASS" if raw_ok and agent_ok else "FAIL")
    return 0 if raw_ok and agent_ok else 1


if __name__ == "__main__":
    sys.exit(main())
