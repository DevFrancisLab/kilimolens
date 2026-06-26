"""API routes. The /assess endpoint runs the full pipeline:

  form  →  knowledge graph (ingest + features)  →  XGBoost (readiness + SHAP)
        →  climate intelligence  →  explainable AI  →  persist  →  response

The remaining endpoints serve the dashboard (Applications, AI Assessments,
Farmer Profiles, Overview KPIs, Knowledge Graph, Climate Insights) from the
SQLite store, so the whole product is backed by real data.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app import store
from app.climate import get_climate, parse_coords
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
        "store": {"assessments": store.stats()["totalAssessments"]},
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

    # 3. Climate intelligence (real, from the farm's coordinates).
    personal = payload.get("personal", {}) or {}
    lat, lon = parse_coords(personal.get("gps", ""), personal.get("county", ""))
    climate = get_climate(lat, lon, personal.get("county", ""))

    # 4. Explainable AI: plain-language explanation grounded in the drivers.
    explanation = generate_explanation(result, graph_features)

    response = AssessmentResponse(
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

    # 5. Persist: knowledge graph (if enabled) + SQLite system of record.
    if request.persist:
        repo.record_assessment(fid, result)
        saved = store.save_assessment(fid, payload, response.model_dump())
        response.assessmentId = saved["id"]
        response.createdAt = saved["createdAt"]
        response.status = saved["status"]

    return response


# ── Dashboard data endpoints ─────────────────────────────────────────────────
@router.get("/assessments")
def assessments(limit: int = Query(100, ge=1, le=500)) -> dict:
    return {"items": store.list_assessments(limit)}


@router.get("/assessments/{assessment_id}")
def assessment_detail(assessment_id: str) -> dict:
    item = store.get_assessment(assessment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return item


@router.get("/farmers")
def farmers() -> dict:
    return {"items": store.list_farmers()}


@router.get("/farmers/{farmer_id}")
def farmer_detail(farmer_id: str) -> dict:
    item = store.get_farmer(farmer_id)
    if not item:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return item


@router.get("/farmers/{farmer_id}/graph")
def farmer_graph(farmer_id: str) -> dict:
    """Knowledge-graph neighborhood. Prefers Neo4j; falls back to the store."""
    repo = GraphRepository()
    if repo.enabled:
        graph = repo.neighborhood(farmer_id)
        if graph["nodes"]:
            return graph
    return store.farmer_graph(farmer_id)


@router.get("/stats")
def dashboard_stats() -> dict:
    return store.stats()


@router.get("/climate")
def climate(
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    gps: str = Query(""),
    county: str = Query(""),
) -> dict:
    if lat is None or lon is None:
        lat, lon = parse_coords(gps, county)
    return get_climate(lat, lon, county)
