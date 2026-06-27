"""Farmer Trust Agent — an independent, Masumi-discoverable AI service.

Exposes the MIP-003 Agentic Service API. A lender (e.g. KilimoLens) discovers
this agent via the Masumi registry, pays through the Masumi Payment Service, and
receives a verified, explainable Farmer Trust Report.

Run:  uvicorn farmer_trust_agent.main:app --port 8100
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query

from common import mip003
from common.config import get_settings
from common.jobs import JobManager
from common.payment import build_provider, hash_payload
from farmer_trust_agent.agent import generate_trust_report

settings = get_settings()
provider = build_provider(
    settings, settings.farmer_trust_agent_identifier, settings.farmer_trust_price_lovelace
)
jobs = JobManager(provider, generate_trust_report)

app = FastAPI(
    title="Farmer Trust Agent",
    description="Masumi-discoverable AI service: portable, explainable farmer trust profiles.",
    version="1.0.0",
)

INPUT_SCHEMA = mip003.InputSchemaResponse(
    input_data=[
        mip003.InputField(id="phone_number", type="string", name="Phone Number"),
        mip003.InputField(id="national_id", type="string", name="National ID"),
        mip003.InputField(id="farmer_id", type="string", name="Farmer ID"),
        mip003.InputField(id="gps", type="string", name="GPS (optional)"),
        mip003.InputField(
            id="loan_application_reference", type="string", name="Loan Application Reference (optional)"
        ),
    ]
)


@app.get("/availability", response_model=mip003.AvailabilityResponse)
def availability() -> mip003.AvailabilityResponse:
    return mip003.AvailabilityResponse(
        status="available",
        type="masumi-agent",
        message=f"Farmer Trust Agent ready (payment: {provider.mode}).",
    )


@app.get("/input_schema", response_model=mip003.InputSchemaResponse)
def input_schema() -> mip003.InputSchemaResponse:
    return INPUT_SCHEMA


@app.post("/start_job", response_model=mip003.StartJobResponse)
async def start_job(req: mip003.StartJobRequest) -> mip003.StartJobResponse:
    started = await jobs.start_job(req.identifier_from_purchaser, req.input_data)
    return mip003.StartJobResponse(
        agentIdentifier=settings.farmer_trust_agent_identifier or None,
        sellerVKey=settings.farmer_trust_seller_vkey or None,
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
    # This agent collects everything up front, so no extra input is needed.
    return mip003.ProvideInputResponse(input_hash=hash_payload(req.input_data))


@app.get("/audit/{job_id}")
def audit(job_id: str) -> dict:
    job = jobs.status(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    return {"job_id": job.job_id, "blockchainIdentifier": job.blockchain_identifier, "trail": job.audit}


@app.get("/")
def root() -> dict:
    return {"agent": "Farmer Trust Agent", "standard": "MIP-003", "docs": "/docs"}
