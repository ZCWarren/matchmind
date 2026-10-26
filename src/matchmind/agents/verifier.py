"""Deterministic verification and fallback content."""

from __future__ import annotations

import re

from matchmind.agents.contracts import (
    Claim,
    FanCard,
    InsightCandidate,
    MetricRef,
    OverlayCue,
    RundownDecision,
    VerificationIssue,
    VerificationResult,
)
from matchmind.analytics.models import FeatureSnapshot, Moment

SUPERLATIVES = ("fastest", "quickest", "most", "record", "first", "only", "best")


def _lookup_metric(
    name: str,
    snapshot: FeatureSnapshot,
    moment: Moment,
):
    if name in snapshot.metrics:
        return snapshot.metrics[name]
    return moment.metrics.get(name)


EVENT_FIELDS = {
    "event_pressure": "pressure",
    "event_speed": "speed_kmh",
    "ball_speed": "ball_speed_kmh",
    "shot_speed": "shot_speed_kmh",
    "difficulty": "difficulty",
    "distance": "distance_m",
}


def verify_deterministic(
    candidate: InsightCandidate,
    snapshot: FeatureSnapshot,
    moment: Moment,
    events_by_id: dict[str, object],
) -> VerificationResult:
    """Check event references, metric values, and dangerous superlatives."""
    issues: list[VerificationIssue] = []
    valid_event_ids = set(events_by_id)
    if not candidate.claims:
        issues.append(
            VerificationIssue(code="no_claims", message="Insight has no verifiable claims")
        )

    moment_speed = moment.metrics.get("event_speed")
    top_speed = snapshot.metrics.get("top_speed")

    for index, claim in enumerate(candidate.claims):
        if not claim.event_ids:
            issues.append(
                VerificationIssue(
                    code="missing_evidence",
                    message="Claim has no event IDs",
                    claim_index=index,
                )
            )
        for event_id in claim.event_ids:
            if event_id not in valid_event_ids:
                issues.append(
                    VerificationIssue(
                        code="unknown_event",
                        message=f"Claim references unknown event {event_id}",
                        claim_index=index,
                    )
                )

        for ref in claim.metric_refs:
            # Event-level fields are valid evidence for a single event even when
            # the aggregate metric has a different value (e.g. a 0.9 pressure
            # event vs. the match average of 0.82).
            field = EVENT_FIELDS.get(ref.name)
            if field and ref.event_ids:
                event_values = []
                for event_id in ref.event_ids:
                    event = events_by_id.get(event_id)
                    value = getattr(event, field, None) if event else None
                    if value is not None:
                        event_values.append(float(value))
                if any(abs(ref.value - value) <= 0.02 for value in event_values):
                    continue
            metric = _lookup_metric(ref.name, snapshot, moment)
            if metric is None:
                issues.append(
                    VerificationIssue(
                        code="unknown_metric",
                        message=f"Metric {ref.name} is not in the evidence bundle",
                        claim_index=index,
                        severity="warn",
                    )
                )
                continue
            tolerance = max(0.02, abs(metric.value) * 0.05)
            if abs(ref.value - metric.value) > tolerance:
                issues.append(
                    VerificationIssue(
                        code="metric_mismatch",
                        message=(
                            f"Metric {ref.name} claim={ref.value} evidence={metric.value}"
                        ),
                        claim_index=index,
                    )
                )
            for event_id in ref.event_ids:
                if event_id not in valid_event_ids:
                    issues.append(
                        VerificationIssue(
                            code="unknown_metric_event",
                            message=f"Metric references unknown event {event_id}",
                            claim_index=index,
                        )
                    )

        lowered = claim.text.lower()
        if any(word in lowered for word in ("fastest", "quickest")):
            speed = moment_speed.value if moment_speed else 0.0
            top = top_speed.value if top_speed else 0.0
            if speed + 0.01 < top:
                issues.append(
                    VerificationIssue(
                        code="unsupported_superlative",
                        message=(
                            f"Claim says fastest, but moment speed {speed} is below "
                            f"match top speed {top}"
                        ),
                        claim_index=index,
                    )
                )
        elif any(word in lowered for word in SUPERLATIVES):
            issues.append(
                VerificationIssue(
                    code="review_superlative",
                    message="Superlative wording needs explicit support",
                    claim_index=index,
                    severity="warn",
                )
            )

    errors = [issue for issue in issues if issue.severity == "error"]
    status = "reject" if errors else "pass"
    return VerificationResult(
        status=status,
        issues=issues,
        checked_claims=len(candidate.claims),
        notes="deterministic verifier",
    )


def verify_cue(cue: OverlayCue, candidate: InsightCandidate) -> VerificationResult:
    issues: list[VerificationIssue] = []
    if cue.insight_id != candidate.moment_id:
        issues.append(
            VerificationIssue(code="cue_mismatch", message="Cue targets another insight")
        )
    candidate_text = " ".join(
        [candidate.headline, candidate.why_it_matters, candidate.watch_next]
        + [claim.text for claim in candidate.claims]
    )
    allowed_numbers = {float(value) for value in re.findall(r"-?\d+(?:\.\d+)?", candidate_text)}
    allowed_numbers.update(
        ref.value for claim in candidate.claims for ref in claim.metric_refs
    )
    cue_text = " ".join(
        str(cue.payload.get(key, "")) for key in ("headline", "stat", "subline")
    )
    for value in re.findall(r"-?\d+(?:\.\d+)?", cue_text):
        number = float(value)
        if not any(abs(number - allowed) <= 0.011 for allowed in allowed_numbers):
            issues.append(
                VerificationIssue(
                    code="unsupported_cue_number",
                    message=f"Cue number {value} is absent from the verified candidate",
                )
            )
    return VerificationResult(
        status="reject" if issues else "pass",
        issues=issues,
        checked_claims=len(candidate.claims),
        notes="deterministic cue verifier",
    )


def merge_verifications(
    deterministic: VerificationResult,
    model: VerificationResult | None,
    *,
    after_revision: bool = False,
) -> VerificationResult:
    """The deterministic gate is authoritative; model revision is a bounded hold."""
    if model is None:
        return deterministic
    issues = deterministic.issues + model.issues
    unresolved_errors = any(issue.severity == "error" for issue in model.issues)
    needs_revision = model.status == "revise" and (not after_revision or unresolved_errors)
    status = (
        "reject" if deterministic.status == "reject" else "revise" if needs_revision else "pass"
    )
    notes = f"{deterministic.notes}; {model.notes}".strip("; ")
    advisory_revision = after_revision and model.status == "revise" and not unresolved_errors
    if model.status == "reject" or advisory_revision:
        notes = f"{notes}; model reviewer flagged issues (advisory)"
    return VerificationResult(
        status=status,
        issues=issues,
        checked_claims=max(deterministic.checked_claims, model.checked_claims),
        notes=notes,
    )


def fallback_insight(moment: Moment, snapshot: FeatureSnapshot) -> InsightCandidate:
    metric = next(iter(moment.metrics.values()), None)
    refs = (
        [
            MetricRef(
                name=metric.name,
                value=metric.value,
                formula_version=metric.formula_version,
                event_ids=metric.event_ids,
            )
        ]
        if metric
        else []
    )
    return InsightCandidate(
        moment_id=moment.moment_id,
        match_id=moment.match_id,
        headline=moment.headline,
        why_it_matters=(
            f"Detected {moment.type} at {moment.clock.minute}' with importance "
            f"{moment.importance:.2f}. The insight is based on the supplied event window."
        ),
        watch_next="",
        claims=[
            Claim(
                text=moment.headline,
                event_ids=moment.event_ids or [moment.event_id],
                metric_refs=refs,
                confidence=0.6,
            )
        ],
        importance=moment.importance,
        confidence=0.6,
    )


def fallback_cue(candidate: InsightCandidate) -> OverlayCue:
    metric = candidate.claims[0].metric_refs[0] if candidate.claims[0].metric_refs else None
    stat = f"{metric.name} {metric.value}" if metric else ""
    return OverlayCue(
        cue_id=f"cue-{candidate.moment_id}",
        insight_id=candidate.moment_id,
        template="lower_third_why",
        priority=candidate.importance,
        duration_seconds=8.0,
        safe_area="lower_third",
        payload={
            "eyebrow": candidate.match_id,
            "headline": candidate.headline,
            "stat": stat,
            "subline": candidate.why_it_matters[:120],
        },
    )


def fallback_card(candidate: InsightCandidate, profile: str, language: str) -> FanCard:
    if profile == "casual":
        why = candidate.why_it_matters[:220]
        headline = candidate.headline
    elif profile == "player":
        why = candidate.why_it_matters
        headline = candidate.headline
    else:
        why = candidate.why_it_matters
        headline = candidate.headline
    event_ids = sorted({event_id for claim in candidate.claims for event_id in claim.event_ids})
    return FanCard(
        insight_id=candidate.moment_id,
        profile=profile,  # type: ignore[arg-type]
        language=language,  # type: ignore[arg-type]
        headline=headline,
        what_happened=candidate.headline,
        why_it_matters=why,
        watch_next=candidate.watch_next,
        how_we_know="Evidence: " + ", ".join(event_ids[:5]),
        evidence_event_ids=event_ids,
    )


def fallback_decision(verification: VerificationResult) -> RundownDecision:
    if verification.status == "pass":
        return RundownDecision(
            action="approve",
            priority=0.7,
            duration_seconds=8.0,
            reason="deterministic fallback: verified",
        )
    return RundownDecision(
        action="hold",
        priority=0.3,
        duration_seconds=8.0,
        reason=f"deterministic fallback: {verification.status}",
    )
