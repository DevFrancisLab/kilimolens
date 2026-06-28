"""Schemas for the USSD and SMS channels (Africa's Talking).

Africa's Talking delivers its USSD and SMS callbacks as
``application/x-www-form-urlencoded`` POST bodies. These models validate and
document those payloads; FastAPI binds them from form fields via ``Form(...)``
dependencies in the routers.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ── USSD ─────────────────────────────────────────────────────────────────────
class UssdRequest(BaseModel):
    """Inbound Africa's Talking USSD callback.

    ``text`` is the full session input so far: every screen's answer joined by
    ``*`` (empty on the very first request). The handler is therefore stateless
    with respect to navigation — it derives the current screen from ``text``.
    """

    sessionId: str
    serviceCode: str = ""
    phoneNumber: str
    text: str = ""


# ── SMS ──────────────────────────────────────────────────────────────────────
class InboundSms(BaseModel):
    """Inbound SMS callback (a farmer texting the shortcode)."""

    from_: str = Field(alias="from")
    to: str = ""
    text: str = ""
    date: str = ""
    id: str = ""
    linkId: str = ""

    model_config = {"populate_by_name": True}


class DeliveryReport(BaseModel):
    """SMS delivery-status callback."""

    id: str = ""
    status: str = ""
    phoneNumber: str = ""
    networkCode: str = ""
    failureReason: str = ""


class NotifyRequest(BaseModel):
    """Body for the guarded internal endpoint that sends a farmer an SMS."""

    phoneNumber: str
    message: Optional[str] = None  # if omitted, the farmer's latest result is sent
    language: Optional[str] = None  # "en" | "sw"


class LoanDecisionRequest(BaseModel):
    """Loan officer's approve/decline decision on an application."""

    decision: str  # "Approved" | "Declined"
    approvedAmount: Optional[float] = None  # approved amount (may differ from requested)
    note: str = ""
    language: Optional[str] = None  # override farmer language ("en" | "sw")


class SmsResult(BaseModel):
    """Outcome of an outbound SMS send."""

    status: str  # "sent" | "skipped" | "failed"
    to: str
    messageId: Optional[str] = None
    cost: Optional[str] = None
    detail: Optional[str] = None
