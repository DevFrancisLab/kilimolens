"""Cooperative Reputation Report models."""
from __future__ import annotations

from pydantic import BaseModel


class CoopInput(BaseModel):
    cooperative_name: str = ""
    registration_number: str = ""
    county: str = ""


class CoopReport(BaseModel):
    cooperativeName: str
    county: str
    reputationScore: int  # 0-100
    activeMembership: int
    averageRepaymentBehaviour: float  # 0-1
    averageDefaultRisk: int  # 0-100 (higher = riskier)
    yearsActive: float
    knownFraudReports: list[str]
    financialStabilityIndicators: dict
    climateExposure: str  # Low | Moderate | High
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    explanation: str  # WHY each score — never just numbers
    dataSources: list[str]
    generatedBy: str = "Cooperative Intelligence Agent (Masumi)"
