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
