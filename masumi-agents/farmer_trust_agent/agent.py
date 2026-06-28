"""Farmer Trust Agent - builds a portable, explainable trust profile for a farmer
from the shared knowledge graph (historical assessments, repayment behaviour,
cooperative membership, verification history)."""
from __future__ import annotations

import hashlib
from typing import Any

from common.graphdb import GraphReader
from common.llm import explain
from farmer_trust_agent.schemas import TimelineEvent, TrustReport


def resolve_farmer_id(national_id: str, phone: str, farmer_id: str) -> str:
    """Mirror KilimoLens' deterministic farmer id so trust profiles are portable
    across lenders (same farmer -> same id)."""
    if farmer_id.strip():
        return farmer_id.strip()
    raw = national_id.strip() or phone.strip()
    if not raw:
        return ""
    return "F" + hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


def _fetch(fid: str) -> dict[str, Any]:
    g = GraphReader.instance()
    if not (g.enabled and fid):
        return {"found": False, "farmer": None, "assessments": [], "cooperative": None, "sacco": None}
    rows = g.run(
        """
        MATCH (f:Farmer {id:$id})
        OPTIONAL MATCH (f)-[:HAS_ASSESSMENT]->(a:Assessment)
        OPTIONAL MATCH (f)-[:MEMBER_OF]->(co:Cooperative)
        OPTIONAL MATCH (f)-[:SAVES_WITH]->(s:Sacco)
        RETURN f{.id,.name,.repaymentScore,.phone} AS farmer,
               collect(DISTINCT a{.readiness,.confidence,.recommendation,.status,.createdAt,.purpose,.loanAmount}) AS assessments,
               co.name AS cooperative, s.name AS sacco
        """,
        id=fid,
    )
    if not rows or not rows[0]["farmer"]:
        return {"found": False, "farmer": None, "assessments": [], "cooperative": None, "sacco": None}
    r = rows[0]
    assessments = [a for a in r["assessments"] if a and a.get("createdAt")]
    assessments.sort(key=lambda a: a.get("createdAt") or "", reverse=True)
    return {
        "found": True,
        "farmer": r["farmer"],
        "assessments": assessments,
        "cooperative": r.get("cooperative"),
        "sacco": r.get("sacco"),
    }


def _clamp(v: float) -> int:
    return int(max(0, min(100, round(v))))


def generate_trust_report(inp: dict) -> dict:
    national_id = str(inp.get("national_id", "") or "")
    phone = str(inp.get("phone_number", "") or "")
    fid = resolve_farmer_id(national_id, phone, str(inp.get("farmer_id", "") or ""))
    data = _fetch(fid)

    farmer = data["farmer"] or {}
    assessments = data["assessments"]
    n = len(assessments)
    repay = farmer.get("repaymentScore")
    if repay is None:
        # Derive from assessment outcomes when no explicit repayment score.
        approved = sum(1 for a in assessments if a.get("status") == "Approved")
        repay = (approved / n) if n else 0.5

    sources = ["KilimoLens Knowledge Graph (Neo4j)"] if data["found"] else []

    # ── identity confidence ──────────────────────────────────────────────────
    if not fid:
        identity = 10
    elif not data["found"]:
        identity = 35  # id well-formed but no record found
    elif national_id:
        identity = 90  # national id resolves to a known farmer
    else:
        identity = 70  # matched on phone only

    # ── fraud flags (heuristic) ──────────────────────────────────────────────
    fraud: list[str] = []
    declined = sum(1 for a in assessments if a.get("status") == "Declined")
    if n >= 3 and declined / n > 0.6:
        fraud.append("High proportion of declined applications")
    if data["found"] and not national_id and not phone:
        fraud.append("Identity asserted without phone or national ID")

    # ── verification status ──────────────────────────────────────────────────
    has_network = bool(data["cooperative"] or data["sacco"])
    if data["found"] and n >= 1 and has_network:
        verification = "Verified"
    elif data["found"]:
        verification = "Partially Verified"
    else:
        verification = "Unverified"

    # ── trust score ──────────────────────────────────────────────────────────
    score = (
        45 * repay
        + 20 * min(1.0, n / 3)              # track-record depth
        + 15 * (1 if has_network else 0)    # cooperative/SACCO embeddedness
        + 12 * (identity / 100)
        + 8 * (1 if data["found"] else 0)
    )
    score -= 15 * len(fraud)
    trust = _clamp(score)

    # ── timeline ─────────────────────────────────────────────────────────────
    timeline = [
        TimelineEvent(
            date=(a.get("createdAt") or "")[:10],
            event="Credit assessment",
            detail=f"readiness {a.get('readiness')}, {a.get('recommendation')} ({a.get('status')})"
            + (f", {a.get('purpose')}" if a.get("purpose") else ""),
        ).model_dump()
        for a in assessments
    ]

    # ── repayment summary ────────────────────────────────────────────────────
    band = "strong" if repay >= 0.7 else "moderate" if repay >= 0.45 else "weak"
    repayment_summary = (
        f"Repayment behaviour is {band} (score {repay:.2f}). "
        f"{n} historical assessment(s) on record; "
        f"{sum(1 for a in assessments if a.get('status')=='Approved')} approved, {declined} declined."
        if data["found"]
        else "No repayment history found in the network for this farmer."
    )

    # ── confidence level ─────────────────────────────────────────────────────
    confidence = "High" if (data["found"] and n >= 2 and identity >= 80) else "Medium" if data["found"] else "Low"

    # ── recommendations ──────────────────────────────────────────────────────
    recs: list[str] = []
    if not data["found"]:
        recs.append("No portable history yet - verify identity and run a first on-site assessment.")
    if not has_network and data["found"]:
        recs.append("Encourage cooperative/SACCO membership to strengthen the trust network.")
    if repay < 0.7 and data["found"]:
        recs.append("Offer a smaller starter facility and build repayment history before scaling.")
    if fraud:
        recs.append("Escalate for manual fraud review before disbursing.")
    if not recs:
        recs.append("Eligible for streamlined approval - strong, verified trust profile.")

    # ── explanation (WHY - never just a number) ──────────────────────────────
    explanation = explain(
        system=(
            "You are the Farmer Trust Agent. Explain a farmer's trust profile to a "
            "lender clearly and fairly. Use ONLY the facts given. Never cite gender, "
            "age or land ownership. 2-4 sentences."
        ),
        prompt=(
            f"Trust score {trust}/100. Identity confidence {identity}. Verification {verification}. "
            f"Repayment {repay:.2f} ({band}). Assessments on record: {n}. "
            f"Cooperative: {data['cooperative']}. SACCO: {data['sacco']}. "
            f"Fraud flags: {fraud or 'none'}. Explain WHY this trust score was assigned."
        ),
        fallback=(
            f"This farmer's trust score of {trust}/100 reflects {band} repayment behaviour "
            f"({repay:.2f}), {n} prior assessment(s), {verification.lower()} status, and "
            f"{'membership in a cooperative/SACCO' if has_network else 'no cooperative network on record'}. "
            f"Identity confidence is {identity}/100"
            + (f". Fraud flags: {', '.join(fraud)}." if fraud else " with no fraud flags.")
        ),
    )

    report = TrustReport(
        farmerId=fid or "unknown",
        trustScore=trust,
        identityConfidence=identity,
        verificationStatus=verification,
        repaymentBehaviourSummary=repayment_summary,
        knownFraudFlags=fraud,
        historicalTimeline=timeline,
        confidenceLevel=confidence,
        recommendations=recs,
        explanation=explanation,
        dataSources=sources,
    )
    return report.model_dump()
