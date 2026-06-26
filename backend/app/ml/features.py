"""Feature engineering: turn the raw assessment form into the numeric feature
vector the XGBoost model consumes.

Fairness note (challenge brief): protected / collateral-proxy attributes are
deliberately NOT used as model features. Gender, age, and land *ownership* never
enter the model. Creditworthiness is judged on behavioural and alternative-data
signals (repayment, mobile money, cooperative participation, climate practices).
Two graph-derived features (cooperative network strength, peer repayment) are
appended by the scoring service.
"""
from __future__ import annotations

from typing import Any

# Canonical feature order. MUST stay in sync between training and inference.
FEATURE_ORDER: list[str] = [
    "farm_area_ha",
    "num_main_crops",
    "years_of_farming",
    "savings_kes",
    "avg_monthly_income_kes",
    "outstanding_loans_kes",
    "existing_debt_flag",
    "mobile_money_activity",
    "repayment_history",
    "previous_loans_flag",
    "cooperative_member",
    "sacco_member",
    "years_in_sacco",
    "peer_guarantees_count",
    "crop_diversification",
    "drought_resistant",
    "water_harvesting_flag",
    "soil_conservation_flag",
    "irrigation",
    "climate_training",
    "livelihood_diversification_flag",
    "alt_income_flag",
    # graph-derived (appended at scoring time)
    "coop_network_strength",
    "peer_repayment_score",
]

# Human-readable labels for the explanation / driver UI.
FEATURE_LABELS: dict[str, str] = {
    "farm_area_ha": "Farm area (ha)",
    "num_main_crops": "Number of crops grown",
    "years_of_farming": "Years of farming experience",
    "savings_kes": "Savings (KES)",
    "avg_monthly_income_kes": "Average monthly income (KES)",
    "outstanding_loans_kes": "Outstanding loans (KES)",
    "existing_debt_flag": "Has existing informal debt",
    "mobile_money_activity": "Mobile money activity",
    "repayment_history": "Repayment history",
    "previous_loans_flag": "Has prior loan track record",
    "cooperative_member": "Cooperative membership",
    "sacco_member": "SACCO membership",
    "years_in_sacco": "Years in SACCO",
    "peer_guarantees_count": "Peer guarantees",
    "crop_diversification": "Crop diversification",
    "drought_resistant": "Drought-resistant crops",
    "water_harvesting_flag": "Water harvesting",
    "soil_conservation_flag": "Soil conservation",
    "irrigation": "Irrigation",
    "climate_training": "Climate-smart training",
    "livelihood_diversification_flag": "Livelihood diversification",
    "alt_income_flag": "Alternative income sources",
    "coop_network_strength": "Cooperative network strength",
    "peer_repayment_score": "Peer repayment behaviour",
}

# Ordinal encodings
_MOBILE = {"low": 0, "medium": 1, "high": 2}
_REPAY = {"poor": 0, "fair": 1, "good": 2}
_DIVERSIFICATION = {"low": 0, "moderate": 1, "high": 2}
_DROUGHT = {"none": 0, "some": 1, "majority": 2}
_IRRIGATION = {"rainfed": 0, "mixed": 1, "irrigated": 2}
_TRAINING = {"none": 0, "some": 1, "comprehensive": 2}


def _num(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        s = str(value).replace(",", "").replace("KSh", "").replace("KES", "").strip()
        if s == "":
            return default
        return float(s)
    except (ValueError, TypeError):
        return default


def _ordinal(value: Any, table: dict[str, int], default: int = 0) -> int:
    return table.get(str(value or "").strip().lower(), default)


def _yes(value: Any) -> int:
    return 1 if str(value or "").strip().lower() in {"yes", "y", "true", "1"} else 0


def _nonempty_flag(value: Any) -> int:
    s = str(value or "").strip().lower()
    return 0 if s in {"", "none", "no", "n/a", "0"} else 1


def _count_crops(main: Any, secondary: Any) -> int:
    parts: list[str] = []
    for raw in (main, secondary):
        if raw:
            parts += [p for p in str(raw).replace(";", ",").split(",") if p.strip()]
    return max(1, len(parts)) if parts else 1


def build_feature_dict(payload: dict[str, Any]) -> dict[str, float]:
    """Build the (graph-free) feature dict from the wizard form sections.

    `payload` is the AssessmentRequest dumped to a dict. Graph features default
    to 0.0 here and are overwritten by the scoring service.
    """
    personal = payload.get("personal", {}) or {}
    farm = payload.get("farm", {}) or {}
    finance = payload.get("finance", {}) or {}
    community = payload.get("community", {}) or {}
    climate = payload.get("climate", {}) or {}

    feats: dict[str, float] = {
        "farm_area_ha": _num(farm.get("areaHa")),
        "num_main_crops": float(_count_crops(farm.get("mainCrops"), farm.get("secondaryCrops"))),
        "years_of_farming": _num(farm.get("yearsOfFarming")),
        "savings_kes": _num(finance.get("savings")),
        "avg_monthly_income_kes": _num(finance.get("averageMonthlyIncome")),
        "outstanding_loans_kes": _num(finance.get("outstandingLoans")),
        "existing_debt_flag": float(_nonempty_flag(finance.get("existingDebts"))),
        "mobile_money_activity": float(_ordinal(finance.get("mobileMoneyActivity"), _MOBILE, 1)),
        "repayment_history": float(_ordinal(finance.get("repaymentHistory"), _REPAY, 2)),
        "previous_loans_flag": float(_nonempty_flag(finance.get("previousLoans"))),
        "cooperative_member": float(
            _yes(community.get("cooperative")) or _nonempty_flag(community.get("cooperativeMembership"))
        ),
        "sacco_member": float(
            _nonempty_flag(community.get("saccoMembership")) or _nonempty_flag(community.get("selectedSacco"))
        ),
        "years_in_sacco": _num(community.get("yearsInSacco")),
        "peer_guarantees_count": _num(community.get("peerGuarantees")),
        "crop_diversification": float(_ordinal(climate.get("cropDiversification"), _DIVERSIFICATION, 1)),
        "drought_resistant": float(_ordinal(climate.get("droughtResistantCrops"), _DROUGHT, 1)),
        "water_harvesting_flag": float(_nonempty_flag(climate.get("waterHarvesting"))),
        "soil_conservation_flag": float(_nonempty_flag(climate.get("soilConservation"))),
        "irrigation": float(
            _ordinal(climate.get("irrigation") or farm.get("irrigation"), _IRRIGATION, 0)
        ),
        "climate_training": float(
            _ordinal(climate.get("climateSmartTraining") or community.get("climateTraining"), _TRAINING, 0)
        ),
        "livelihood_diversification_flag": float(_nonempty_flag(climate.get("livelihoodDiversification"))),
        "alt_income_flag": float(_nonempty_flag(finance.get("alternativeIncomeSources"))),
        "coop_network_strength": 0.0,
        "peer_repayment_score": 0.0,
    }
    return feats


def data_completeness(payload: dict[str, Any]) -> float:
    """Fraction of meaningful form fields that are filled (0-1).

    Feeds the confidence score and the 'Data Confidence' dimension.
    """
    filled = 0
    total = 0
    for section in ("personal", "farm", "finance", "community", "climate"):
        section_data = payload.get(section, {}) or {}
        for key, value in section_data.items():
            if key.endswith("Status"):
                continue
            total += 1
            if str(value or "").strip():
                filled += 1
    return filled / total if total else 0.0


def humanize_value(feature: str, value: float) -> str:
    """Render a feature value for the driver display."""
    inv = {
        "mobile_money_activity": {0: "Low", 1: "Medium", 2: "High"},
        "repayment_history": {0: "Poor", 1: "Fair", 2: "Good"},
        "crop_diversification": {0: "Low", 1: "Moderate", 2: "High"},
        "drought_resistant": {0: "None", 1: "Some", 2: "Majority"},
        "irrigation": {0: "Rainfed", 1: "Mixed", 2: "Irrigated"},
        "climate_training": {0: "None", 1: "Some", 2: "Comprehensive"},
    }
    if feature in inv:
        return inv[feature].get(int(round(value)), str(value))
    if feature.endswith("_flag"):
        return "Yes" if value >= 0.5 else "No"
    if feature in {"coop_network_strength", "peer_repayment_score"}:
        return f"{value:.2f}"
    if feature.endswith("_kes"):
        return f"KSh {int(value):,}"
    if value == int(value):
        return str(int(value))
    return f"{value:.1f}"
