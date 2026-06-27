"""The credit-assessment pipeline as a single reusable service.

  form  →  knowledge graph (ingest + features)  →  XGBoost (readiness + SHAP)
        →  climate intelligence  →  explainable AI  →  persist  →  response

Both the REST endpoint (``POST /api/assess``) and the USSD channel call this, so
the scoring/persistence logic lives in exactly one place. It is synchronous and
CPU/IO-bound (model + Neo4j + optional LLM); async callers should invoke it via
``starlette.concurrency.run_in_threadpool``.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from app import store
from app.climate import get_climate, parse_coords
from app.explain.explainer import generate_explanation
from app.graph.repository import GraphRepository, farmer_id
from app.ml.scorer import CreditScorer
from app.schemas import AssessmentRequest, AssessmentResponse


def _score(payload: dict[str, Any], fid: str, graph_features: dict[str, Any]) -> AssessmentResponse:
    """Run model + climate + explanation for an already-identified farmer."""
    scorer = CreditScorer.instance()
    result = scorer.score(payload, graph_features)

    personal = payload.get("personal", {}) or {}
    lat, lon = parse_coords(personal.get("gps", ""), personal.get("county", ""))
    climate = get_climate(lat, lon, personal.get("county", ""))
    explanation = generate_explanation(result, graph_features)

    return AssessmentResponse(
        farmerId=fid,
        creditReadinessScore=result["creditReadinessScore"],
        confidenceScore=result["confidenceScore"],
        recommendation=result["recommendation"],
        dimensionScores=result["dimensionScores"],
        drivers=result["drivers"],
        graphFeatures=graph_features,
        climate=climate,
        explanation=explanation,
        modelVersion=result["modelVersion"],
    )


def run_assessment(request: AssessmentRequest) -> AssessmentResponse:
    """Run the full pipeline for an assessment request and return the response.

    Persists to Neo4j (system of record) and the SQLite mirror when
    ``request.persist`` is true, exactly like the dashboard flow.
    """
    payload = request.model_dump()
    repo = GraphRepository()

    # 1. Knowledge graph: persist the farmer and derive network features.
    fid = repo.upsert_farmer(payload) if request.persist else farmer_id(payload)
    graph_features = repo.graph_features(fid, payload)

    # 2-4. ML readiness + SHAP, climate intelligence, explainable AI.
    response = _score(payload, fid, graph_features)

    # 5. Persist. Neo4j is the system of record when configured; SQLite always
    #    gets a copy so the dashboard still works if Aura is paused/unreachable.
    if request.persist:
        full = response.model_dump()
        saved = store.save_assessment(fid, payload, full)
        meta = {"id": saved["id"], "createdAt": saved["createdAt"], "status": saved["status"]}
        # Store the FULL result in Neo4j too (drivers, dimensions, climate,
        # explanation, graph features) so dashboard reads from the graph render
        # the complete profile — not just the four headline scores.
        repo.record_assessment(fid, full, meta, payload)
        response.assessmentId = saved["id"]
        response.createdAt = saved["createdAt"]
        response.status = saved["status"]

    return response


def complete_application(reference: str, request: AssessmentRequest) -> Optional[AssessmentResponse]:
    """Complete an existing loan application in place (loan officer site visit).

    The officer's edited form (``request``) is merged over the application and
    re-scored. The USSD-captured channel metadata (reference, source, preferred
    language, requested categories) and the original ``createdAt`` are preserved,
    an ``officer_completed`` entry is appended to the audit trail, and
    ``updatedAt`` is stamped. A NEW application is never created — the same record
    is updated; returns ``None`` if the application does not exist.

    The officer's input is authoritative: nothing they enter is overwritten by
    the previously stored USSD values (only the immutable channel metadata is
    re-attached).
    """
    existing = store.get_assessment(reference)
    if existing is None:
        return None

    stored_request = existing.get("request") or {}
    channel = stored_request.get("channel") or {}
    prior_result = existing.get("result") or {}
    prior_audit = prior_result.get("audit") or []
    created_at = prior_result.get("createdAt") or existing.get("createdAt")

    # Officer's data wins; only the immutable channel metadata is preserved.
    payload = request.model_dump()
    payload["channel"] = channel

    repo = GraphRepository()
    # Re-derive identity (the officer may now have supplied a National ID) and
    # graph features, then score on the completed data.
    fid = farmer_id(payload)
    graph_features = repo.graph_features(fid, payload)
    response = _score(payload, fid, graph_features)

    now = store._now_iso()
    personal = payload.get("personal", {}) or {}
    farm = payload.get("farm", {}) or {}

    result_payload = response.model_dump()
    result_payload.update(
        {
            "applicationReference": channel.get("applicationReference", reference),
            "applicationSource": channel.get("source", "USSD"),
            "preferredLanguage": channel.get("preferredLanguage", ""),
            "requestedCategories": channel.get("requestedCategories", []),
            "createdAt": created_at,
            "updatedAt": now,
            "audit": [*prior_audit, {"event": "officer_completed", "at": now}],
        }
    )

    status = store._STATUS.get(response.recommendation, "Under Review")
    saved = store.update_application(
        reference,
        request_json=json.dumps(payload),
        result_json=json.dumps(result_payload),
        farmer_id=fid,
        farmer_name=personal.get("fullName") or "",
        phone=personal.get("phone") or "",
        county=(personal.get("county") or farm.get("county") or "").strip(),
        gender=personal.get("gender") or "",
        loan_amount=store._to_float(personal.get("loanAmountRequested")),
        purpose=personal.get("purposeOfLoan") or "",
        readiness=response.creditReadinessScore,
        confidence=response.confidenceScore,
        recommendation=response.recommendation,
        status=status,
        model_version=response.modelVersion,
    )
    if saved is None:
        return None

    response.assessmentId = reference
    response.createdAt = saved["createdAt"]
    response.status = saved["status"]
    return response


def pick_farmer_message(response: AssessmentResponse, language: str) -> str:
    """Return the SMS-ready farmer message in the requested language.

    Falls back to the English message if the Kiswahili one is empty.
    """
    explanation = response.explanation
    if language == "sw" and explanation.farmerMessageSw.strip():
        return explanation.farmerMessageSw
    return explanation.farmerMessage or explanation.farmerMessageSw
