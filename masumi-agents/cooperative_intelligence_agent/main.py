"""Cooperative Intelligence Agent — an independent, Masumi-discoverable AI service.

Exposes the MIP-003 Agentic Service API. Lenders discover it via the Masumi
registry, pay via the Masumi Payment Service, and receive an explainable
Cooperative Reputation Report.

Run:  uvicorn cooperative_intelligence_agent.main:app --port 8200
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query

from common import mip003
from common.config import get_settings
from common.jobs import JobManager
from common.payment import build_provider, hash_payload
from cooperative_intelligence_agent.agent import generate_coop_report

settings = get_settings()
provider = build_provider(
    settings, settings.coop_intel_agent_identifier, settings.coop_intel_price_lovelace
)
jobs = JobManager(provider, generate_coop_report)

app = FastAPI(
    title="Cooperative Intelligence Agent",
    description="Masumi-discoverable AI service: explainable farmer-cooperative reputation reports.",
    version="1.0.0",
)

INPUT_SCHEMA = mip003.InputSchemaResponse(
    input_data=[
        mip003.InputField(id="cooperative_name", type="string", name="Cooperative Name"),
        mip003.InputField(id="registration_number", type="string", name="Registration Number"),
        mip003.InputField(id="county", type="string", name="County"),
    ]
)


@app.get("/availability", response_model=mip003.AvailabilityResponse)
def availability() -> mip003.AvailabilityResponse:
    return mip003.AvailabilityResponse(
        status="available",
        type="masumi-agent",
        message=f"Cooperative Intelligence Agent ready (payment: {provider.mode}).",
    )


@app.get("/input_schema", response_model=mip003.InputSchemaResponse)
def input_schema() -> mip003.InputSchemaResponse:
    return INPUT_SCHEMA


@app.post("/start_job", response_model=mip003.StartJobResponse)
async def start_job(req: mip003.StartJobRequest) -> mip003.StartJobResponse:
    started = await jobs.start_job(req.identifier_from_purchaser, req.input_data)
    return mip003.StartJobResponse(
        agentIdentifier=settings.coop_intel_agent_identifier or None,
        sellerVKey=settings.coop_intel_seller_vkey or None,
        **started,
    )


@app.get("/status", response_model=mip003.StatusResponse)
def status(job_id: str = Query(...)) -> mip003.StatusResponse:
    job = jobs.status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    return mip003.StatusResponse(
        job_id=job.job_id, status=job.status, result=job.result, message=job.message
    )


@app.post("/provide_input", response_model=mip003.ProvideInputResponse)
def provide_input(req: mip003.ProvideInputRequest) -> mip003.ProvideInputResponse:
    return mip003.ProvideInputResponse(input_hash=hash_payload(req.input_data))


@app.get("/audit/{job_id}")
def audit(job_id: str) -> dict:
    job = jobs.status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    return {"job_id": job.job_id, "blockchainIdentifier": job.blockchain_identifier, "trail": job.audit}


@app.get("/")
def root() -> dict:
    return {"agent": "Cooperative Intelligence Agent", "standard": "MIP-003", "docs": "/docs"}
