"""API routes. The /assess endpoint runs the full pipeline:

  form  →  knowledge graph (ingest + features)  →  XGBoost (readiness + SHAP)
        →  explainable AI (LangChain + Featherless)  →  response
"""
from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.explain.explainer import generate_explanation
from app.graph.repository import GraphRepository, farmer_id
from app.ml.scorer import CreditScorer
from app.schemas import AssessmentRequest, AssessmentResponse

router = APIRouter()


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    scorer = CreditScorer.instance()
    repo = GraphRepository()
    return {
        "status": "ok",
        "model": {"loaded": scorer.ready, "version": scorer.model_version},
        "neo4j": {"enabled": repo.enabled, "error": repo.client.last_error},
        "featherless": {"enabled": settings.featherless_enabled, "model": settings.featherless_model},
    }


@router.post("/assess", response_model=AssessmentResponse)
def assess(request: AssessmentRequest) -> AssessmentResponse:
    payload = request.model_dump()
    repo = GraphRepository()
    scorer = CreditScorer.instance()

    # 1. Knowledge graph: persist the farmer and derive network features.
    fid = repo.upsert_farmer(payload) if request.persist else farmer_id(payload)
    graph_features = repo.graph_features(fid, payload)

    # 2. ML: credit readiness + confidence + SHAP drivers.
    result = scorer.score(payload, graph_features)

    # 3. Explainable AI: plain-language explanation grounded in the drivers.
    explanation = generate_explanation(result, graph_features)

    # 4. Persist the assessment back into the graph for history/networks.
    if request.persist:
        repo.record_assessment(fid, result)

    return AssessmentResponse(
        farmerId=fid,
        creditReadinessScore=result["creditReadinessScore"],
        confidenceScore=result["confidenceScore"],
        recommendation=result["recommendation"],
        dimensionScores=result["dimensionScores"],
        drivers=result["drivers"],
        graphFeatures=graph_features,
        explanation=explanation,
        modelVersion=result["modelVersion"],
    )


@router.get("/farmers/{farmer_id}/graph")
def farmer_graph(farmer_id: str) -> dict:
    """Knowledge-graph neighborhood for the graph explorer UI."""
    return GraphRepository().neighborhood(farmer_id)
