"""Summarize the cached five-fixture evaluation for docs and judges."""

from __future__ import annotations

import json
import re
from pathlib import Path

CACHE = Path("data/cache")
CJK = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]")


def main() -> None:
    records = []
    for path in sorted(CACHE.glob("*/*__prompt-v2.json")):
        data = json.loads(path.read_text())
        insight = data["insight"]
        trace = data["trace"]
        headline = insight["headline"]
        records.append(
            {
                "match_id": data["match_id"],
                "moment_id": data["moment"]["moment_id"],
                "headline": headline,
                "verification": data["verification"]["status"],
                "decision": data["decision"]["action"],
                "claims": len(insight.get("claims", [])),
                "cards": len(data.get("fan_cards", [])),
                "cue": data.get("cue") is not None,
                "generic_or_cjk": bool(CJK.search(headline))
                or headline.strip().lower() in {"line break under pressure"},
                "fallbacks": [
                    step["agent"] for step in trace if step["status"] != "ok"
                ],
                "trace_latency_ms": round(sum(step["latency_ms"] for step in trace), 1),
            }
        )

    total = len(records)
    passed = sum(row["verification"] == "pass" for row in records)
    approved = sum(row["decision"] == "approve" for row in records)
    cards = sum(row["cards"] for row in records)
    claims = sum(row["claims"] for row in records)
    fallbacks = [agent for row in records for agent in row["fallbacks"]]
    generic = sum(row["generic_or_cjk"] for row in records)
    mean_trace = round(
        sum(row["trace_latency_ms"] for row in records) / total, 1
    ) if total else 0

    summary = {
        "fixtures": total,
        "deterministic_pass": passed,
        "approved_cues": approved,
        "fan_cards": cards,
        "claims": claims,
        "generic_or_cjk_headlines": generic,
        "fallback_agents": fallbacks,
        "mean_summed_trace_ms": mean_trace,
        "records": records,
    }
    Path("docs/evaluation.json").write_text(json.dumps(summary, indent=2) + "\n")

    lines = [
        "# Evaluation snapshot",
        "",
        "Generated from the committed cache with `scripts/evaluate_fixtures.py`.",
        "",
        "| Metric | Value |",
        "|---|---:|",
        f"| Fixtures | {total} |",
        f"| Deterministic verifier pass | {passed}/{total} |",
        f"| Approved cues | {approved}/{total} |",
        f"| Fan cards | {cards} |",
        f"| Claims | {claims} |",
        f"| Generic or non-English headlines | {generic} |",
        f"| Fallback agent runs | {len(fallbacks)} |",
        f"| Mean summed agent trace | {mean_trace / 1000:.1f}s |",
        "",
        "## Per fixture",
        "",
        "| Match | Moment | Verification | Decision | Claims | Cards | Headline |",
        "|---|---|---|---|---:|---:|---|",
    ]
    for row in records:
        lines.append(
            f"| `{row['match_id']}` | `{row['moment_id']}` | {row['verification']} | "
            f"{row['decision']} | {row['claims']} | {row['cards']} | {row['headline']} |"
        )
    lines += [
        "",
        "A trace total counts parallel roles separately; it is not wall-clock latency.",
        "Cached fixture reads take about 2 ms, which is what the Studio and public demo use.",
        "",
        "The deterministic verifier is the release gate. The LLM FactChecker is",
        "advisory; a fallback run means the model audit was unavailable, not that the",
        "deterministic evidence check failed.",
        "",
    ]
    Path("docs/EVALUATION.md").write_text("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    main()
