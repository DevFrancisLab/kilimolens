"""MIP-003: Agentic Service API Standard — shared request/response models.

https://docs.masumi.network/mips/_mip-003

Every Masumi-compliant agent exposes the same five endpoints so any consumer
(e.g. KilimoLens) can discover and call it uniformly:
  GET  /availability
  GET  /input_schema
  POST /start_job
  GET  /status
  POST /provide_input
"""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

# Job status values defined by MIP-003.
STATUS_AWAITING_PAYMENT = "awaiting_payment"
STATUS_AWAITING_INPUT = "awaiting_input"
STATUS_RUNNING = "running"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"


class AvailabilityResponse(BaseModel):
    status: str = "available"  # "available" | "unavailable"
    type: str = "masumi-agent"
    message: Optional[str] = None


class InputField(BaseModel):
    id: str
    type: str  # "string" | "number" | "boolean" | "option" | "none"
    name: str
    data: Optional[dict[str, Any]] = None
    validations: Optional[list[dict[str, Any]]] = None


class InputSchemaResponse(BaseModel):
    input_data: list[InputField]


class StartJobRequest(BaseModel):
    identifier_from_purchaser: str = Field(..., description="Purchaser-defined id")
    input_data: dict[str, Any] = Field(default_factory=dict)


class StartJobResponse(BaseModel):
    # Job + payment binding fields per MIP-003.
    job_id: str
    blockchainIdentifier: str
    payByTime: Optional[int] = None
    submitResultTime: Optional[int] = None
    unlockTime: Optional[int] = None
    externalDisputeUnlockTime: Optional[int] = None
    agentIdentifier: Optional[str] = None
    sellerVKey: Optional[str] = None
    identifierFromPurchaser: str
    input_hash: str
    status: str = STATUS_AWAITING_PAYMENT
    # Convenience for non-blockchain/mock mode so callers can poll immediately.
    amountLovelace: Optional[int] = None


class StatusResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[Any] = None
    input_schema: Optional[dict[str, Any]] = None
    message: Optional[str] = None


class ProvideInputRequest(BaseModel):
    job_id: str
    input_schema_hash: Optional[str] = None
    input_data: dict[str, Any] = Field(default_factory=dict)


class ProvideInputResponse(BaseModel):
    input_hash: str
    signature: Optional[str] = None
