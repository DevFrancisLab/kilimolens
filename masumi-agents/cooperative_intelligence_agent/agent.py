"""Cooperative Intelligence Agent - aggregates intelligence about a farmer
cooperative from the shared knowledge graph (member repayment, default risk,
activity, climate exposure) into an explainable reputation report."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from common.graphdb import GraphReader
from common.llm import explain
from cooperative_intelligence_agent.schemas import CoopReport

# Rough agro-climate exposure by county (drought/variability), for a heuristic.
_HIGH_EXPOSURE = {"garissa", "turkana", "wajir", "marsabit", "mandera", "kitui", "makueni"}
_MODERATE_EXPOSURE = {"embu", "nakuru", "machakos", "kajiado", "tharaka"}


def _fetch(name: str, county: str) -> dict[str, Any]:
    g = GraphReader.instance()
    if not (g.enabled and name.strip()):
        return {"found": False, "coop": name, "members": []}
    rows = g.run(
        """
        MATCH (co:Cooperative) WHERE toLower(co.name) CONTAINS toLower($name)
        WITH co LIMIT 1
        MATCH (co)<-[:MEMBER_OF]-(f:Farmer)
        OPTIONAL MATCH (f)-[:HAS_ASSESSMENT]->(a:Assessment)
        WITH co.name AS coop, f, a ORDER BY a.createdAt DESC
        WITH coop, f, head(collect(a)) AS latest
        RETURN coop,
               f.repaymentScore AS repay,
               latest.readiness AS readiness,
               latest.status AS status,
               latest.createdAt AS createdAt,
               latest.county AS county
        """,
        name=name,
    )
    if not rows:
        return {"found": False, "coop": name, "members": []}
    return {"found": True, "coop": rows[0]["coop"], "members": rows}


def _clamp(v: float) -> int:
    return int(max(0, min(100, round(v))))


def _years_active(dates: list[str]) -> float:
    valid = [d for d in dates if d]
    if not valid:
        return 0.0
    try:
        first = min(datetime.fromisoformat(d.replace("Z", "+00:00")) for d in valid)
        delta = datetime.now(timezone.utc) - first
        return round(max(0.0, delta.days / 365.25), 1)
    except Exception:
        return 0.0


def generate_coop_report(inp: dict) -> dict:
    name = str(inp.get("cooperative_name", "") or "")
    county_in = str(inp.get("county", "") or "")
    data = _fetch(name, county_in)
    members = data["members"]
    n = len(members)
    sources = ["KilimoLens Knowledge Graph (Neo4j)"] if data["found"] else []

    # Member-level aggregation.
    repays = [
        m["repay"] if m["repay"] is not None else (1.0 if m["status"] == "Approved" else 0.4)
        for m in members
    ]
    readiness = [m["readiness"] for m in members if m["readiness"] is not None]
    avg_repay = round(sum(repays) / len(repays), 2) if repays else 0.0
    avg_readiness = (sum(readiness) / len(readiness)) if readiness else 0.0
    default_risk = _clamp(100 - avg_readiness) if readiness else 60
    years = _years_active([m["createdAt"] for m in members])
    declined = sum(1 for m in members if m["status"] == "Declined")
    approved = sum(1 for m in members if m["status"] == "Approved")

    county = county_in or next((m["county"] for m in members if m.get("county")), "")
    cl = county.strip().lower()
    climate = "High" if cl in _HIGH_EXPOSURE else "Moderate" if cl in _MODERATE_EXPOSURE else "Low"

    # Fraud reports (heuristic).
    fraud: list[str] = []
    if n >= 4 and declined / n > 0.5:
        fraud.append("Majority of recently assessed members were declined")

    # Reputation score.
    score = (
        40 * avg_repay
        + 25 * (avg_readiness / 100 if readiness else 0.4)
        + 15 * min(1.0, n / 10)            # membership scale
        + 10 * min(1.0, years / 3)          # longevity
        + 10 * (1 if climate != "High" else 0.3)
    )
    score -= 15 * len(fraud)
    reputation = _clamp(score)

    stability = {
        "memberCount": n,
        "averageReadiness": round(avg_readiness),
        "approvalRate": round(approved / n * 100, 1) if n else 0.0,
        "declinedMembers": declined,
    }

    strengths: list[str] = []
    weaknesses: list[str] = []
    if avg_repay >= 0.7:
        strengths.append("Strong average member repayment behaviour")
    else:
        weaknesses.append("Below-target average member repayment")
    if n >= 5:
        strengths.append(f"Healthy active membership ({n} assessed members)")
    elif data["found"]:
        weaknesses.append("Thin membership data - limited statistical confidence")
    if climate == "High":
        weaknesses.append("High agro-climate exposure in its region")
    elif climate == "Low":
        strengths.append("Low climate exposure in its region")
    if not data["found"]:
        weaknesses.append("No record found for this cooperative in the network")

    recommendations: list[str] = []
    if not data["found"]:
        recommendations.append("Onboard the cooperative and assess a sample of members to build a baseline.")
    if avg_repay < 0.7 and data["found"]:
        recommendations.append("Pair lending with repayment coaching and group guarantees.")
    if climate == "High":
        recommendations.append("Bundle climate-smart inputs or index insurance to offset drought risk.")
    if fraud:
        recommendations.append("Flag for manual due diligence before portfolio-level lending.")
    if not recommendations:
        recommendations.append("Suitable for cooperative-level credit lines with standard monitoring.")

    explanation = explain(
        system=(
            "You are the Cooperative Intelligence Agent. Explain a cooperative's "
            "reputation to a lender, fairly and clearly, using ONLY the facts given. "
            "Explain WHY each score was assigned. 3-5 sentences."
        ),
        prompt=(
            f"Cooperative: {data['coop']}. Reputation {reputation}/100. "
            f"Members assessed: {n}. Avg repayment {avg_repay}. Avg readiness {round(avg_readiness)}. "
            f"Default risk {default_risk}/100. Years active {years}. Climate exposure {climate}. "
            f"Approval rate {stability['approvalRate']}%. Fraud reports: {fraud or 'none'}. "
            "Explain WHY the cooperative received this reputation score and default risk."
        ),
        fallback=(
            f"{data['coop'] or name} scores {reputation}/100. This reflects an average member "
            f"repayment of {avg_repay} and average credit readiness of {round(avg_readiness)} across "
            f"{n} assessed member(s), giving an estimated default risk of {default_risk}/100. "
            f"Regional climate exposure is {climate.lower()} and the cooperative has ~{years} years of "
            f"activity on record"
            + (f". Fraud reports: {', '.join(fraud)}." if fraud else " with no fraud reports.")
        ),
    )

    report = CoopReport(
        cooperativeName=data["coop"] or name or "Unknown",
        county=county or "Unknown",
        reputationScore=reputation,
        activeMembership=n,
        averageRepaymentBehaviour=avg_repay,
        averageDefaultRisk=default_risk,
        yearsActive=years,
        knownFraudReports=fraud,
        financialStabilityIndicators=stability,
        climateExposure=climate,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        explanation=explanation,
        dataSources=sources,
    )
    return report.model_dump()
