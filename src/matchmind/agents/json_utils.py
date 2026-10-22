"""Structured-output helpers for agents."""

from __future__ import annotations

import json

from pydantic import BaseModel, ValidationError


def extract_json(text: str) -> dict:
    """Extract the first JSON object from a model response."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rstrip()[:-3]
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("no JSON object found in response")
    return json.loads(cleaned[start : end + 1])


async def run_json_agent[T: BaseModel](
    agent,
    prompt: str,
    schema: type[T],
    *,
    repair: bool = True,
) -> T:
    """Run an agent and validate its JSON output, with one repair attempt."""
    result = await agent.run(prompt)
    text = getattr(result, "text", None) or str(result)
    try:
        return schema.model_validate(extract_json(text))
    except (ValueError, ValidationError) as first_error:
        if not repair:
            raise
        repair_prompt = (
            f"{prompt}\n\nYour previous response was invalid: {first_error}.\n"
            f"Return only valid JSON matching this schema:\n"
            f"{json.dumps(schema.model_json_schema(), ensure_ascii=False)}"
        )
        result = await agent.run(repair_prompt)
        text = getattr(result, "text", None) or str(result)
        return schema.model_validate(extract_json(text))
