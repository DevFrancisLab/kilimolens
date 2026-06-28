"""SQLite-backed persistence for assessments and farmers.

This is the system of record that powers the dashboard's Applications, AI
Assessments, Farmer Profiles, Overview KPIs and Knowledge Graph — independent of
whether Neo4j is configured. Every call to /assess writes a row here.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from app.config import BASE_DIR, get_settings

_LOCK = threading.Lock()


def _db_path() -> Path:
    settings = get_settings()
    d = BASE_DIR / settings.model_dir
    d.mkdir(exist_ok=True)
    return d / "kilimolens.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# Map model recommendation -> lending workflow status.
_STATUS = {"Approve": "Approved", "Further Review": "Under Review", "Decline": "Declined"}


def init_db() -> None:
    with _LOCK, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS assessments (
              id TEXT PRIMARY KEY,
              farmer_id TEXT NOT NULL,
              farmer_name TEXT,
              phone TEXT,
              county TEXT,
              gender TEXT,
              loan_amount REAL,
              purpose TEXT,
              readiness INTEGER,
              confidence INTEGER,
              recommendation TEXT,
              status TEXT,
              model_version TEXT,
              created_at TEXT,
              request_json TEXT,
              result_json TEXT
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_assess_farmer ON assessments(farmer_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_assess_created ON assessments(created_at)")


def save_assessment(farmer_id: str, request_payload: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    personal = request_payload.get("personal", {}) or {}
    farm = request_payload.get("farm", {}) or {}
    assessment_id = uuid.uuid4().hex[:12]
    created = _now_iso()
    rec = result["recommendation"]
    row = {
        "id": assessment_id,
        "farmer_id": farmer_id,
        "farmer_name": personal.get("fullName") or "Unknown Farmer",
        "phone": personal.get("phone") or "",
        "county": (personal.get("county") or farm.get("county") or "").strip(),
        "gender": personal.get("gender") or "",
        "loan_amount": _to_float(personal.get("loanAmountRequested")),
        "purpose": personal.get("purposeOfLoan") or "",
        "readiness": result["creditReadinessScore"],
        "confidence": result["confidenceScore"],
        "recommendation": rec,
        "status": _STATUS.get(rec, "Under Review"),
        "model_version": result.get("modelVersion", ""),
        "created_at": created,
        "request_json": json.dumps(request_payload),
        "result_json": json.dumps(result),
    }
    with _LOCK, _connect() as conn:
        conn.execute(
            f"INSERT INTO assessments ({','.join(row)}) VALUES ({','.join('?' for _ in row)})",
            list(row.values()),
        )
    return {"id": assessment_id, "createdAt": created, "status": row["status"]}


def save_loan_application(
    *,
    reference: str,
    phone: str,
    amount: float,
    categories: list[str],
    language: str,
    source: str = "USSD",
    status: str = "Pending Assessment",
) -> dict[str, Any]:
    """Create a new loan application from a low-touch channel (e.g. USSD).

    Writes a row into the SAME ``assessments`` store the dashboard's New Loan
    Application list reads, populating only the fields a channel like USSD can
    collect and leaving the rest empty. No credit scoring is run — the
    application is pending the loan officer's site visit. The schema is NOT
    changed: channel-specific fields (reference, source, language, requested
    categories) are kept in the JSON payload.

    Each call inserts a new application (the reference is its id); it never
    updates a previous one.
    """
    from app.graph.repository import farmer_id  # local import avoids an import cycle

    created = _now_iso()
    category_label = ", ".join(categories)
    payload = {
        "personal": {
            "phone": phone,
            "loanAmountRequested": str(int(amount)),
            "purposeOfLoan": category_label,
        },
        "channel": {
            "source": source,
            "preferredLanguage": language,
            "applicationReference": reference,
            "requestedCategories": categories,
        },
    }
    result = {
        "applicationReference": reference,
        "applicationSource": source,
        "preferredLanguage": language,
        "requestedCategories": categories,
        "amountRequested": amount,
        "status": status,
        # Audit trail — created/updated timestamps live in the JSON payload so the
        # table schema is unchanged. The loan officer's completion appends to this.
        "createdAt": created,
        "updatedAt": created,
        "audit": [{"event": "ussd_submitted", "source": source, "at": created}],
    }
    row = {
        "id": reference,
        "farmer_id": farmer_id(payload),
        "farmer_name": "",
        "phone": phone,
        "county": "",
        "gender": "",
        "loan_amount": float(amount),
        "purpose": category_label,
        "readiness": None,
        "confidence": None,
        "recommendation": None,
        "status": status,
        "model_version": "",
        "created_at": created,
        "request_json": json.dumps(payload),
        "result_json": json.dumps(result),
    }
    with _LOCK, _connect() as conn:
        conn.execute(
            f"INSERT INTO assessments ({','.join(row)}) VALUES ({','.join('?' for _ in row)})",
            list(row.values()),
        )
    return {
        "id": reference,
        "reference": reference,
        "createdAt": created,
        "status": status,
        # Returned so callers can mirror the same payload/result into Neo4j.
        "requestPayload": payload,
        "resultPayload": result,
    }


def update_application(
    application_id: str,
    *,
    request_json: str,
    result_json: str,
    farmer_id: str,
    farmer_name: str,
    phone: str,
    county: str,
    gender: str,
    loan_amount: float,
    purpose: str,
    readiness: Optional[int],
    confidence: Optional[int],
    recommendation: Optional[str],
    status: str,
    model_version: str,
) -> Optional[dict[str, Any]]:
    """Update an existing loan application in place (e.g. a loan officer
    completing a USSD-originated application during the site visit).

    ``created_at`` is preserved (audit timestamp); the caller is responsible for
    keeping the channel metadata and audit trail inside ``result_json``. Returns
    ``None`` if the application does not exist — never inserts a new row.
    """
    with _LOCK, _connect() as conn:
        existing = conn.execute(
            "SELECT created_at FROM assessments WHERE id = ?", (application_id,)
        ).fetchone()
        if not existing:
            return None
        created = existing["created_at"]
        conn.execute(
            """
            UPDATE assessments SET
              farmer_id = ?, farmer_name = ?, phone = ?, county = ?, gender = ?,
              loan_amount = ?, purpose = ?, readiness = ?, confidence = ?,
              recommendation = ?, status = ?, model_version = ?,
              request_json = ?, result_json = ?
            WHERE id = ?
            """,
            (
                farmer_id, farmer_name, phone, county, gender, loan_amount, purpose,
                readiness, confidence, recommendation, status, model_version,
                request_json, result_json, application_id,
            ),
        )
    return {"id": application_id, "createdAt": created, "status": status}


def update_application_status(
    application_id: str, *, status: str, result_json: str
) -> Optional[dict[str, Any]]:
    """Light update of an application's status and result JSON only (e.g. a loan
    officer recording an approve/decline decision — no re-scoring). Returns None
    if the application is not in the SQLite mirror."""
    with _LOCK, _connect() as conn:
        row = conn.execute(
            "SELECT created_at FROM assessments WHERE id = ?", (application_id,)
        ).fetchone()
        if not row:
            return None
        conn.execute(
            "UPDATE assessments SET status = ?, result_json = ? WHERE id = ?",
            (status, result_json, application_id),
        )
    return {"id": application_id, "status": status, "createdAt": row["created_at"]}


def _summary(r: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": r["id"],
        "farmerId": r["farmer_id"],
        "farmerName": r["farmer_name"],
        "phone": r["phone"],
        "county": r["county"],
        "loanAmount": r["loan_amount"],
        "purpose": r["purpose"],
        "readiness": r["readiness"],
        "confidence": r["confidence"],
        "recommendation": r["recommendation"],
        "status": r["status"],
        "createdAt": r["created_at"],
    }


def list_assessments(limit: int = 100) -> list[dict[str, Any]]:
    with _LOCK, _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM assessments ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_summary(r) for r in rows]


def get_assessment(assessment_id: str) -> Optional[dict[str, Any]]:
    with _LOCK, _connect() as conn:
        r = conn.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,)).fetchone()
    if not r:
        return None
    summary = _summary(r)
    summary["result"] = json.loads(r["result_json"])
    summary["request"] = json.loads(r["request_json"])
    return summary


def list_farmers() -> list[dict[str, Any]]:
    """One row per farmer, using their most recent assessment."""
    with _LOCK, _connect() as conn:
        rows = conn.execute(
            """
            SELECT a.* FROM assessments a
            JOIN (
              SELECT farmer_id, MAX(created_at) AS mx
              FROM assessments GROUP BY farmer_id
            ) latest ON a.farmer_id = latest.farmer_id AND a.created_at = latest.mx
            ORDER BY a.created_at DESC
            """
        ).fetchall()
        counts = {
            row["farmer_id"]: row["n"]
            for row in conn.execute(
                "SELECT farmer_id, COUNT(*) AS n FROM assessments GROUP BY farmer_id"
            ).fetchall()
        }
    out = []
    for r in rows:
        s = _summary(r)
        s["assessmentCount"] = counts.get(r["farmer_id"], 1)
        out.append(s)
    return out


def get_farmer(farmer_id: str) -> Optional[dict[str, Any]]:
    with _LOCK, _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM assessments WHERE farmer_id = ? ORDER BY created_at DESC", (farmer_id,)
        ).fetchall()
    if not rows:
        return None
    latest = rows[0]
    request = json.loads(latest["request_json"])
    history = [
        {
            "id": r["id"],
            "createdAt": r["created_at"],
            "readiness": r["readiness"],
            "confidence": r["confidence"],
            "recommendation": r["recommendation"],
            "status": r["status"],
        }
        for r in rows
    ]
    return {
        "farmerId": farmer_id,
        "profile": request,
        "latest": json.loads(latest["result_json"]),
        "summary": _summary(latest),
        "history": history,
    }


def stats() -> dict[str, Any]:
    with _LOCK, _connect() as conn:
        total = conn.execute("SELECT COUNT(*) AS n FROM assessments").fetchone()["n"]
        farmers = conn.execute(
            "SELECT COUNT(DISTINCT farmer_id) AS n FROM assessments"
        ).fetchone()["n"]
        by_status = {
            row["status"]: row["n"]
            for row in conn.execute(
                "SELECT status, COUNT(*) AS n FROM assessments GROUP BY status"
            ).fetchall()
        }
        avg_row = conn.execute(
            "SELECT AVG(readiness) AS r, AVG(confidence) AS c FROM assessments"
        ).fetchone()
        amount = conn.execute(
            "SELECT SUM(loan_amount) AS s FROM assessments WHERE status = 'Approved'"
        ).fetchone()["s"]
        by_county = [
            {"county": row["county"] or "Unknown", "count": row["n"]}
            for row in conn.execute(
                "SELECT county, COUNT(*) AS n FROM assessments GROUP BY county ORDER BY n DESC LIMIT 8"
            ).fetchall()
        ]
    approved = by_status.get("Approved", 0)
    return {
        "totalAssessments": total,
        "totalFarmers": farmers,
        "pending": by_status.get("Under Review", 0),
        "approved": approved,
        "declined": by_status.get("Declined", 0),
        "approvalRate": round(approved / total * 100, 1) if total else 0,
        "avgReadiness": round(avg_row["r"] or 0),
        "avgConfidence": round(avg_row["c"] or 0),
        "approvedLoanValue": round(amount or 0),
        "byCounty": by_county,
    }


def farmer_graph(farmer_id: str) -> dict[str, Any]:
    """Build a knowledge-graph neighborhood from the farmer's stored profile —
    works without Neo4j. Nodes: farmer, county, cooperative, sacco, crops."""
    farmer = get_farmer(farmer_id)
    if not farmer:
        return {"nodes": [], "edges": [], "source": "store"}
    p = farmer["profile"]
    personal = p.get("personal", {}) or {}
    farm = p.get("farm", {}) or {}
    community = p.get("community", {}) or {}

    nodes = [{"id": farmer_id, "label": "Farmer", "name": personal.get("fullName") or "Farmer"}]
    edges = []

    def add(node_type: str, name: str, rel: str):
        if not name or not str(name).strip():
            return
        nid = f"{node_type}:{name}"
        nodes.append({"id": nid, "label": node_type, "name": str(name).strip()})
        edges.append({"source": farmer_id, "target": nid, "rel": rel})

    add("County", personal.get("county") or farm.get("county"), "LOCATED_IN")
    coop = community.get("cooperativeMembership") or (
        "Cooperative" if str(community.get("cooperative", "")).lower() == "yes" else ""
    )
    add("Cooperative", coop, "MEMBER_OF")
    add("Sacco", community.get("selectedSacco") or community.get("saccoMembership"), "SAVES_WITH")
    for crop in str(farm.get("mainCrops", "")).replace(";", ",").split(","):
        add("Crop", crop.strip(), "GROWS")

    return {"nodes": nodes, "edges": edges, "source": "store"}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        s = str(value or "").replace(",", "").strip()
        return float(s) if s else default
    except (ValueError, TypeError):
        return default
