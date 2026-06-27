"""API routes. The /assess endpoint runs the full pipeline:

  form  →  knowledge graph (ingest + features)  →  XGBoost (readiness + SHAP)
        →  climate intelligence  →  explainable AI  →  persist  →  response

The remaining endpoints serve the dashboard (Applications, AI Assessments,
Farmer Profiles, Overview KPIs, Knowledge Graph, Climate Insights) from the
SQLite store, so the whole product is backed by real data.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app import store
from app.climate import get_climate, parse_coords
from app.config import get_settings
from app.graph import assistant
from app.graph.repository import GraphRepository
from app.ml.scorer import CreditScorer
from app.schemas import AssessmentRequest, AssessmentResponse
from app.services.assessment_service import complete_application, run_assessment

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
        "gemini": {"enabled": settings.gemini_enabled, "model": settings.gemini_model},
        "store": {"assessments": store.stats()["totalAssessments"]},
    }


@router.post("/assess", response_model=AssessmentResponse)
def assess(request: AssessmentRequest) -> AssessmentResponse:
    # The full pipeline (graph → model → climate → explanation → persist) lives
    # in the shared assessment service, reused by the USSD channel.
    return run_assessment(request)


@router.patch("/applications/{reference}", response_model=AssessmentResponse)
def complete_loan_application(reference: str, request: AssessmentRequest) -> AssessmentResponse:
    """Complete a loan application in place (loan officer site visit).

    Used when an officer opens a USSD-originated application, fills in the fields
    USSD could not capture (National ID, name, GPS, farm size, etc.) and saves.
    The USSD-captured data and original creation time are preserved, the officer's
    input is authoritative, audit timestamps are maintained, and the SAME
    application is updated — never duplicated.
    """
    response = complete_application(reference, request)
    if response is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return response


# ── Dashboard data endpoints ─────────────────────────────────────────────────
# Reads prefer Neo4j (system of record); SQLite is the offline fallback.
@router.get("/assessments")
def assessments(limit: int = Query(100, ge=1, le=500)) -> dict:
    repo = GraphRepository()
    if repo.enabled:
        return {"items": repo.list_assessments(limit), "source": "neo4j"}
    return {"items": store.list_assessments(limit), "source": "store"}


@router.get("/assessments/{assessment_id}")
def assessment_detail(assessment_id: str) -> dict:
    repo = GraphRepository()
    item = repo.get_assessment(assessment_id) if repo.enabled else None
    if item is None:
        item = store.get_assessment(assessment_id)
    if not item:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return item


@router.get("/farmers")
def farmers() -> dict:
    repo = GraphRepository()
    if repo.enabled:
        return {"items": repo.list_farmers(), "source": "neo4j"}
    return {"items": store.list_farmers(), "source": "store"}


@router.get("/farmers/{farmer_id}")
def farmer_detail(farmer_id: str) -> dict:
    repo = GraphRepository()
    item = repo.get_farmer(farmer_id) if repo.enabled else None
    if item is None:
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
    repo = GraphRepository()
    if repo.enabled:
        return repo.stats()
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


# ── GraphRAG assistant (Vector + Cypher retriever over Neo4j) ────────────────
class AskRequest(BaseModel):
    question: str


@router.post("/assistant/ask")
def assistant_ask(req: AskRequest) -> dict:
    return assistant.ask(req.question)


@router.post("/assistant/reindex")
def assistant_reindex() -> dict:
    """Embed any assessments missing a vector (one-time / maintenance)."""
    return assistant.backfill()
