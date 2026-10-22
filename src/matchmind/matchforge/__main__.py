"""CLI: generate all five narratives or a single match."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from matchmind.matchforge import generate_all, generate_match


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic MatchMind matches.")
    parser.add_argument(
        "--match",
        default="all",
        help="Match id, or 'all' for every fixture",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path("data/demo"),
        help="Root directory for generated matches",
    )
    args = parser.parse_args()

    if args.match == "all":
        bundles = generate_all(args.output_root)
    else:
        bundle = generate_match(args.match, args.output_root / args.match)
        bundles = [bundle]

    summary = [
        {
            "match_id": bundle.match.match_id,
            "fixture": f"{bundle.match.home.team_id} vs {bundle.match.away.team_id}",
            "events": len(bundle.events),
            "labels": len(bundle.labels),
            "score": bundle.match.final_score.model_dump(),
            "output": str(args.output_root / bundle.match.match_id),
        }
        for bundle in bundles
    ]
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
