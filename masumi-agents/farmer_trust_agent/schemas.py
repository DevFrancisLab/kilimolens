"""Farmer Trust Report models."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class TrustInput(BaseModel):
    phone_number: str = ""
    national_id: str = ""
    farmer_id: str = ""
    gps: Optional[str] = ""
    loan_application_reference: Optional[str] = ""


class TimelineEvent(BaseModel):
    date: str
    event: str
    detail: str = ""


class TrustReport(BaseModel):
    farmerId: str
    trustScore: int  # 0-100
    identityConfidence: int  # 0-100
    verificationStatus: str  # Verified | Partially Verified | Unverified
    repaymentBehaviourSummary: str
    knownFraudFlags: list[str]
    historicalTimeline: list[TimelineEvent]
    confidenceLevel: str  # High | Medium | Low
    recommendations: list[str]
    explanation: str  # WHY — never just a number
    dataSources: list[str]
    generatedBy: str = "Farmer Trust Agent (Masumi)"
