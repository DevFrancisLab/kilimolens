"""Request/response models. The request mirrors the frontend assessment wizard
(FormData in NewAssessmentWizard.tsx) so the dashboard can POST its draft as-is."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ── Inbound: mirrors the frontend wizard sections ────────────────────────────
class Personal(BaseModel):
    fullName: str = ""
    nationalId: str = ""
    phone: str = ""
    gender: str = ""
    age: str = ""
    county: str = ""
    subCounty: str = ""
    ward: str = ""
    village: str = ""
    gps: str = ""
    loanAmountRequested: str = ""
    purposeOfLoan: str = ""


class Farm(BaseModel):
    farmName: str = ""
    county: str = ""
    areaHa: str = ""
    mainCrops: str = ""
    secondaryCrops: str = ""
    livestock: str = ""
    yearsOfFarming: str = ""
    irrigation: str = "Rainfed"
    previousHarvest: str = ""
    expectedHarvest: str = ""
    inputPurchases: str = ""


class Finance(BaseModel):
    previousLoans: str = ""
    repaymentHistory: str = "Good"
    outstandingLoans: str = ""
    savings: str = ""
    averageMonthlyIncome: str = ""
    mobileMoneyActivity: str = "Medium"
    alternativeIncomeSources: str = ""
    existingDebts: str = ""


class Community(BaseModel):
    cooperative: str = "No"
    verifier: str = ""
    verificationMethod: str = ""
    saccoMembership: str = ""
    selectedSacco: str = ""
    yearsInSacco: str = ""
    cooperativeMembership: str = ""
    farmerGroup: str = ""
    peerGuarantees: str = ""
    extensionOfficer: str = ""
    climateTraining: str = ""


class Climate(BaseModel):
    irrigation: str = "Rainfed"
    fertilizerUse: str = "Moderate"
    plantingPractice: str = ""
    cropDiversification: str = "Moderate"
    droughtResistantCrops: str = "Some"
    waterHarvesting: str = "None"
    soilConservation: str = "Mulching"
    livelihoodDiversification: str = "None"
    climateSmartTraining: str = "None"


class AssessmentRequest(BaseModel):
    personal: Personal = Field(default_factory=Personal)
    farm: Farm = Field(default_factory=Farm)
    finance: Finance = Field(default_factory=Finance)
    community: Community = Field(default_factory=Community)
    climate: Climate = Field(default_factory=Climate)
    # If true and Neo4j is configured, persist the farmer into the graph.
    persist: bool = True


# ── Outbound ─────────────────────────────────────────────────────────────────
class Driver(BaseModel):
    feature: str
    label: str
    impact: float  # signed SHAP contribution (positive = raises readiness)
    direction: str  # "positive" | "negative"
    value: str


class DimensionScores(BaseModel):
    financial: int
    productivity: int
    resilience: int
    envRisk: int
    community: int
    dataConfidence: int


class GraphFeatures(BaseModel):
    cooperativeNetworkStrength: float
    peerRepaymentScore: float
    cooperativeSize: int
    source: str  # "neo4j" | "derived"


class ClimateData(BaseModel):
    rainfallMmYr: float
    avgTempC: float
    tempTrendCPerDecade: float
    droughtRiskPct: int
    floodRisk: str
    ndviProxy: float
    soilSuitability: str
    latitude: float
    longitude: float
    source: str  # "open-meteo" | "estimated"


class Explanation(BaseModel):
    summary: str
    strengths: list[str]
    risks: list[str]
    farmerMessage: str  # plain-language English, SMS/USSD-friendly
    farmerMessageSw: str = ""  # Kiswahili version for SMS/USSD
    nextSteps: list[str]
    source: str  # "gemini" | "fallback"


class AssessmentResponse(BaseModel):
    farmerId: str
    creditReadinessScore: int  # 0-100
    confidenceScore: int  # 0-100
    recommendation: str  # "Approve" | "Further Review" | "Decline"
    dimensionScores: DimensionScores
    drivers: list[Driver]
    graphFeatures: GraphFeatures
    climate: ClimateData
    explanation: Explanation
    modelVersion: str
    # Set when the assessment is persisted (request.persist = true).
    assessmentId: Optional[str] = None
    createdAt: Optional[str] = None
    status: Optional[str] = None
