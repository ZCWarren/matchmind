"""CLI: python -m matchmind.matchforge --seed 20261018 --output data/demo/..."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from matchmind.matchforge import generate_match


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a synthetic MatchMind match.")
    parser.add_argument("--seed", type=int, default=20261018)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/demo/ast-2026-1018-nhr-orn"),
        help="Output directory for events.jsonl, match.json, labels.json",
    )
    args = parser.parse_args()

    bundle = generate_match(seed=args.seed, output_dir=args.output)
    summary = {
        "match_id": bundle.match.match_id,
        "events": len(bundle.events),
        "labels": len(bundle.labels),
        "score": bundle.match.final_score.model_dump(),
        "output": str(args.output),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
