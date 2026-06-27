"""Pydantic schemas for KilimoLens.

Re-exports the assessment models so existing imports
(``from app.schemas import AssessmentRequest``) keep working, and exposes the
USSD/SMS messaging models added for the Africa's Talking channels.
"""
from __future__ import annotations

from app.schemas.assessment import (
    AssessmentRequest,
    AssessmentResponse,
    Climate,
    ClimateData,
    Community,
    DimensionScores,
    Driver,
    Explanation,
    Farm,
    Finance,
    GraphFeatures,
    Personal,
)
from app.schemas.messaging import (
    DeliveryReport,
    InboundSms,
    NotifyRequest,
    SmsResult,
    UssdRequest,
)

__all__ = [
    "AssessmentRequest",
    "AssessmentResponse",
    "Climate",
    "ClimateData",
    "Community",
    "DimensionScores",
    "Driver",
    "Explanation",
    "Farm",
    "Finance",
    "GraphFeatures",
    "Personal",
    "DeliveryReport",
    "InboundSms",
    "NotifyRequest",
    "SmsResult",
    "UssdRequest",
]
