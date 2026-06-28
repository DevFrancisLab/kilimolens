"""Knowledge-graph ingestion and feature derivation.

Graph model
-----------
(:Farmer {id, name, gender, age, ...})
  -[:LOCATED_IN]->        (:County {name})
  -[:MEMBER_OF]->         (:Cooperative {name})
  -[:SAVES_WITH]->        (:Sacco {name})
  -[:GROWS]->             (:Crop {name})
  -[:GUARANTEES]->        (:Farmer)            // peer guarantee
  -[:HAS_ASSESSMENT]->    (:Assessment {date, readiness, confidence, recommendation})

Graph features
--------------
cooperativeNetworkStrength : how embedded the farmer is in repaying networks
                             (cooperative size + members' repayment + sacco tenure)
peerRepaymentScore         : average repayment standing of co-op peers / guarantors
"""
from __future__ import annotations

import hashlib
import json
from typing import Any, Optional

from app.graph.client import GraphClient


def farmer_id(payload: dict[str, Any]) -> str:
    personal = payload.get("personal", {}) or {}
    raw = (personal.get("nationalId") or "").strip() or (personal.get("phone") or "").strip()
    if not raw:
        raw = (personal.get("fullName") or "anonymous").strip().lower()
    return "F" + hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


_REPAY = {"poor": 0.0, "fair": 0.5, "good": 1.0}


def _repay_score(payload: dict[str, Any]) -> float:
    val = (payload.get("finance", {}) or {}).get("repaymentHistory", "Good")
    return _REPAY.get(str(val).strip().lower(), 0.5)


class GraphRepository:
    def __init__(self, client: Optional[GraphClient] = None) -> None:
        self.client = client or GraphClient.instance()

    @property
    def enabled(self) -> bool:
        return self.client.enabled

    # ── ingestion ──────────────────────────────────────────────────────────
    def upsert_farmer(self, payload: dict[str, Any]) -> str:
        fid = farmer_id(payload)
        if not self.enabled:
            return fid

        personal = payload.get("personal", {}) or {}
        farm = payload.get("farm", {}) or {}
        community = payload.get("community", {}) or {}

        crops = [
            c.strip()
            for c in str(farm.get("mainCrops", "")).replace(";", ",").split(",")
            if c.strip()
        ]
        coop = (community.get("cooperativeMembership") or "").strip() or (
            "Cooperative" if str(community.get("cooperative", "")).lower() == "yes" else ""
        )
        sacco = (community.get("selectedSacco") or community.get("saccoMembership") or "").strip()

        self.client.run(
            """
            MERGE (f:Farmer {id: $id})
            SET f.name = $name, f.gender = $gender, f.phone = $phone,
                f.repaymentScore = $repay, f.areaHa = $area, f.updatedAt = timestamp()
            WITH f
            FOREACH (_ IN CASE WHEN $county <> '' THEN [1] ELSE [] END |
              MERGE (c:County {name: $county}) MERGE (f)-[:LOCATED_IN]->(c))
            FOREACH (_ IN CASE WHEN $coop <> '' THEN [1] ELSE [] END |
              MERGE (co:Cooperative {name: $coop}) MERGE (f)-[:MEMBER_OF]->(co))
            FOREACH (_ IN CASE WHEN $sacco <> '' THEN [1] ELSE [] END |
              MERGE (s:Sacco {name: $sacco}) MERGE (f)-[:SAVES_WITH]->(s))
            """,
            id=fid,
            name=personal.get("fullName", ""),
            gender=personal.get("gender", ""),
            phone=personal.get("phone", ""),
            repay=_repay_score(payload),
            area=_to_float(farm.get("areaHa")),
            county=(personal.get("county") or farm.get("county") or "").strip(),
            coop=coop,
            sacco=sacco,
        )
        for crop in crops:
            self.client.run(
                "MATCH (f:Farmer {id:$id}) MERGE (c:Crop {name:$crop}) MERGE (f)-[:GROWS]->(c)",
                id=fid,
                crop=crop,
            )
        return fid

    def record_assessment(
        self,
        fid: str,
        result: dict[str, Any],
        meta: dict[str, Any],
        payload: dict[str, Any],
    ) -> None:
        """Persist a full Assessment node in Neo4j (the system of record).

        `meta` carries the shared id/createdAt/status so Neo4j and the SQLite
        fallback agree on identity. The complete request/result are stored as
        JSON so detail views can be served straight from the graph.
        """
        if not self.enabled:
            return
        personal = payload.get("personal", {}) or {}
        farm = payload.get("farm", {}) or {}
        self.client.run(
            """
            MATCH (f:Farmer {id:$id})
            CREATE (a:Assessment {
              id: $aid, createdAt: $createdAt, date: timestamp(),
              farmerName: $name, county: $county, phone: $phone,
              loanAmount: $loan, purpose: $purpose,
              readiness: $readiness, confidence: $confidence,
              recommendation: $rec, status: $status, modelVersion: $ver,
              requestJson: $reqJson, resultJson: $resJson
            })
            MERGE (f)-[:HAS_ASSESSMENT]->(a)
            """,
            id=fid,
            aid=meta["id"],
            createdAt=meta["createdAt"],
            name=personal.get("fullName") or "Unknown Farmer",
            county=(personal.get("county") or farm.get("county") or "").strip(),
            phone=personal.get("phone") or "",
            loan=_to_float(personal.get("loanAmountRequested")),
            purpose=personal.get("purposeOfLoan") or "",
            readiness=result["creditReadinessScore"],
            confidence=result["confidenceScore"],
            rec=result["recommendation"],
            status=meta["status"],
            ver=result["modelVersion"],
            reqJson=json.dumps(payload),
            resJson=json.dumps(result),
        )

        # Embed the assessment for Vector + Cypher GraphRAG (best-effort).
        try:
            from app.graph import assistant

            summary = {
                "farmerName": personal.get("fullName") or "Unknown Farmer",
                "county": (personal.get("county") or farm.get("county") or "").strip(),
                "loanAmount": _to_float(personal.get("loanAmountRequested")),
                "purpose": personal.get("purposeOfLoan") or "",
                "status": meta["status"],
            }
            assistant.embed_assessment(meta["id"], assistant.assessment_text(result, summary))
        except Exception as exc:  # never block scoring
            print(f"[repository] embedding skipped: {exc}")

    # ── dashboard reads (Neo4j as system of record) ─────────────────────────
    @staticmethod
    def _summary_from_node(a: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": a.get("id"),
            "farmerId": a.get("farmerId"),
            "farmerName": a.get("farmerName"),
            "phone": a.get("phone", ""),
            "county": a.get("county", ""),
            "loanAmount": a.get("loanAmount", 0) or 0,
            "purpose": a.get("purpose", ""),
            "readiness": a.get("readiness", 0),
            "confidence": a.get("confidence", 0),
            "recommendation": a.get("recommendation", ""),
            "status": a.get("status", ""),
            "createdAt": a.get("createdAt", ""),
        }

    def list_assessments(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = self.client.run(
            """
            MATCH (f:Farmer)-[:HAS_ASSESSMENT]->(a:Assessment)
            RETURN a{.*, farmerId: f.id} AS a
            ORDER BY a.createdAt DESC LIMIT $limit
            """,
            limit=limit,
        )
        return [self._summary_from_node(r["a"]) for r in rows]

    def get_assessment(self, assessment_id: str) -> Optional[dict[str, Any]]:
        rows = self.client.run(
            """
            MATCH (f:Farmer)-[:HAS_ASSESSMENT]->(a:Assessment {id:$aid})
            RETURN a{.*, farmerId: f.id} AS a LIMIT 1
            """,
            aid=assessment_id,
        )
        if not rows:
            return None
        a = rows[0]["a"]
        summary = self._summary_from_node(a)
        summary["result"] = json.loads(a.get("resultJson") or "{}")
        summary["request"] = json.loads(a.get("requestJson") or "{}")
        return summary

    def get_latest_application_by_phone(self, phone: str) -> Optional[dict[str, Any]]:
        """Latest assessment/application for a phone number (matched on the last
        9 subscriber digits). Lets the USSD status check survive an ephemeral
        SQLite reset, since Neo4j is durable."""
        tail = "".join(c for c in (phone or "") if c.isdigit())[-9:]
        if not tail:
            return None
        rows = self.client.run(
            """
            MATCH (f:Farmer)-[:HAS_ASSESSMENT]->(a:Assessment)
            WHERE replace(replace(coalesce(a.phone,''), '+', ''), ' ', '') ENDS WITH $tail
            RETURN a{.*, farmerId: f.id} AS a
            ORDER BY a.createdAt DESC LIMIT 1
            """,
            tail=tail,
        )
        if not rows:
            return None
        a = rows[0]["a"]
        return {
            "id": a.get("id"),
            "status": a.get("status", ""),
            "createdAt": a.get("createdAt", ""),
            "result": json.loads(a.get("resultJson") or "{}"),
        }

    def update_status(self, assessment_id: str, *, status: str, result_json: str) -> bool:
        """Light update of an Assessment node's status + resultJson (e.g. a loan
        officer's approve/decline decision). Returns True if a node was updated."""
        if not self.enabled:
            return False
        rows = self.client.run(
            """
            MATCH (a:Assessment {id:$aid})
            SET a.status = $status, a.resultJson = $res, a.updatedAt = timestamp()
            RETURN a.id AS id
            """,
            aid=assessment_id,
            status=status,
            res=result_json,
        )
        return bool(rows)

    def update_assessment(
        self,
        assessment_id: str,
        *,
        result: dict[str, Any],
        meta: dict[str, Any],
        payload: dict[str, Any],
    ) -> bool:
        """Update an existing Assessment node in place (e.g. a loan officer
        completing a USSD application). Returns True if a node was updated."""
        if not self.enabled:
            return False
        personal = payload.get("personal", {}) or {}
        farm = payload.get("farm", {}) or {}
        rows = self.client.run(
            """
            MATCH (a:Assessment {id:$aid})
            SET a.farmerName=$name, a.county=$county, a.phone=$phone,
                a.loanAmount=$loan, a.purpose=$purpose,
                a.readiness=$readiness, a.confidence=$confidence,
                a.recommendation=$rec, a.status=$status, a.modelVersion=$ver,
                a.requestJson=$reqJson, a.resultJson=$resJson, a.updatedAt=timestamp()
            RETURN a.id AS id
            """,
            aid=assessment_id,
            name=personal.get("fullName") or "Unknown Farmer",
            county=(personal.get("county") or farm.get("county") or "").strip(),
            phone=personal.get("phone") or "",
            loan=_to_float(personal.get("loanAmountRequested")),
            purpose=personal.get("purposeOfLoan") or "",
            readiness=result["creditReadinessScore"],
            confidence=result["confidenceScore"],
            rec=result["recommendation"],
            status=meta["status"],
            ver=result["modelVersion"],
            reqJson=json.dumps(payload),
            resJson=json.dumps(result),
        )
        return bool(rows)

    def list_farmers(self) -> list[dict[str, Any]]:
        rows = self.client.run(
            """
            MATCH (f:Farmer)-[:HAS_ASSESSMENT]->(a:Assessment)
            WITH f, a ORDER BY a.createdAt DESC
            WITH f, collect(a) AS assessments
            WITH f, assessments[0] AS latest, size(assessments) AS n
            RETURN latest{.*, farmerId: f.id} AS a, n
            ORDER BY latest.createdAt DESC
            """
        )
        out = []
        for r in rows:
            s = self._summary_from_node(r["a"])
            s["assessmentCount"] = r["n"]
            out.append(s)
        return out

    def get_farmer(self, fid: str) -> Optional[dict[str, Any]]:
        rows = self.client.run(
            """
            MATCH (f:Farmer {id:$id})-[:HAS_ASSESSMENT]->(a:Assessment)
            RETURN a{.*, farmerId: f.id} AS a ORDER BY a.createdAt DESC
            """,
            id=fid,
        )
        if not rows:
            return None
        nodes = [r["a"] for r in rows]
        latest = nodes[0]
        return {
            "farmerId": fid,
            "profile": json.loads(latest.get("requestJson") or "{}"),
            "latest": json.loads(latest.get("resultJson") or "{}"),
            "summary": self._summary_from_node(latest),
            "history": [
                {
                    "id": a.get("id"),
                    "createdAt": a.get("createdAt"),
                    "readiness": a.get("readiness"),
                    "confidence": a.get("confidence"),
                    "recommendation": a.get("recommendation"),
                    "status": a.get("status"),
                }
                for a in nodes
            ],
        }

    def stats(self) -> dict[str, Any]:
        agg = self.client.run(
            """
            MATCH (a:Assessment)
            RETURN count(a) AS total,
                   avg(a.readiness) AS avgR, avg(a.confidence) AS avgC,
                   sum(CASE WHEN a.status='Approved' THEN 1 ELSE 0 END) AS approved,
                   sum(CASE WHEN a.status='Under Review' THEN 1 ELSE 0 END) AS pending,
                   sum(CASE WHEN a.status='Declined' THEN 1 ELSE 0 END) AS declined,
                   sum(CASE WHEN a.status='Approved' THEN a.loanAmount ELSE 0 END) AS approvedValue
            """
        )
        farmers = self.client.run("MATCH (f:Farmer) RETURN count(f) AS n")
        by_county = self.client.run(
            """
            MATCH (a:Assessment)
            WITH coalesce(a.county,'') AS county, count(a) AS n
            RETURN CASE WHEN county='' THEN 'Unknown' ELSE county END AS county, n
            ORDER BY n DESC LIMIT 8
            """
        )
        r = agg[0] if agg else {}
        total = r.get("total", 0) or 0
        approved = r.get("approved", 0) or 0
        return {
            "totalAssessments": total,
            "totalFarmers": (farmers[0]["n"] if farmers else 0),
            "pending": r.get("pending", 0) or 0,
            "approved": approved,
            "declined": r.get("declined", 0) or 0,
            "approvalRate": round(approved / total * 100, 1) if total else 0,
            "avgReadiness": round(r.get("avgR") or 0),
            "avgConfidence": round(r.get("avgC") or 0),
            "approvedLoanValue": round(r.get("approvedValue") or 0),
            "byCounty": [{"county": x["county"], "count": x["n"]} for x in by_county],
        }

    # ── feature derivation ─────────────────────────────────────────────────
    def graph_features(self, fid: str, payload: dict[str, Any]) -> dict[str, Any]:
        if self.enabled:
            rows = self.client.run(
                """
                MATCH (f:Farmer {id:$id})
                OPTIONAL MATCH (f)-[:MEMBER_OF]->(co:Cooperative)<-[:MEMBER_OF]-(peer:Farmer)
                WITH f, co, collect(DISTINCT peer) AS peers
                OPTIONAL MATCH (f)-[:GUARANTEES|:SAVES_WITH]->()<-[:GUARANTEES|:SAVES_WITH]-(g:Farmer)
                WITH f, co, peers, collect(DISTINCT g) AS guarantors
                WITH f, co,
                     [p IN peers WHERE p.id <> f.id] AS peers,
                     [g IN guarantors WHERE g.id <> f.id] AS guarantors
                RETURN
                  size(peers) AS coopSize,
                  reduce(s = 0.0, p IN peers | s + coalesce(p.repaymentScore, 0.5)) AS peerRepaySum,
                  size(guarantors) AS guarantorCount,
                  reduce(s = 0.0, g IN guarantors | s + coalesce(g.repaymentScore, 0.5)) AS guarRepaySum,
                  exists((f)-[:SAVES_WITH]->(:Sacco)) AS hasSacco,
                  exists((f)-[:MEMBER_OF]->(:Cooperative)) AS hasCoop
                """,
                id=fid,
            )
            if rows:
                r = rows[0]
                coop_size = int(r.get("coopSize") or 0)
                peer_avg = (r["peerRepaySum"] / coop_size) if coop_size else _repay_score(payload)
                guar_count = int(r.get("guarantorCount") or 0)
                guar_avg = (r["guarRepaySum"] / guar_count) if guar_count else peer_avg
                strength = _network_strength(
                    bool(r.get("hasCoop")), bool(r.get("hasSacco")), coop_size, peer_avg
                )
                peer_repay = round(0.5 * peer_avg + 0.5 * guar_avg, 4)
                return {
                    "cooperativeNetworkStrength": round(strength, 4),
                    "peerRepaymentScore": peer_repay,
                    "cooperativeSize": coop_size,
                    "source": "neo4j",
                }
        return self._derived_features(payload)

    @staticmethod
    def _derived_features(payload: dict[str, Any]) -> dict[str, Any]:
        """Fallback when Neo4j is unavailable — estimate from the form alone."""
        community = payload.get("community", {}) or {}
        has_coop = str(community.get("cooperative", "")).lower() == "yes" or bool(
            (community.get("cooperativeMembership") or "").strip()
        )
        has_sacco = bool((community.get("selectedSacco") or community.get("saccoMembership") or "").strip())
        years = _to_float(community.get("yearsInSacco"))
        peers = _to_float(community.get("peerGuarantees"))
        repay = _repay_score(payload)
        strength = (
            0.40 * (1 if has_coop else 0)
            + 0.30 * (1 if has_sacco else 0)
            + 0.15 * min(1.0, years / 10)
            + 0.15 * min(1.0, peers / 4)
        )
        peer_repay = 0.5 * repay + 0.5 * strength
        return {
            "cooperativeNetworkStrength": round(min(1.0, strength), 4),
            "peerRepaymentScore": round(min(1.0, peer_repay), 4),
            "cooperativeSize": 0,
            "source": "derived",
        }

    # ── read for the knowledge-graph explorer UI ───────────────────────────
    def neighborhood(self, fid: str) -> dict[str, Any]:
        if not self.enabled:
            return {"nodes": [], "edges": [], "source": "derived"}
        rows = self.client.run(
            """
            MATCH (f:Farmer {id:$id})-[r]->(n)
            WHERE NOT n:Assessment
            RETURN f.id AS source, f.name AS farmerName, type(r) AS rel,
                   labels(n)[0] AS label, coalesce(n.name, n.id) AS target
            """,
            id=fid,
        )
        farmer_name = rows[0]["farmerName"] if rows else "Farmer"
        nodes = {fid: {"id": fid, "label": "Farmer", "name": farmer_name}}
        edges = []
        for row in rows:
            tid = f"{row['label']}:{row['target']}"
            nodes[tid] = {"id": tid, "label": row["label"], "name": row["target"]}
            edges.append({"source": fid, "target": tid, "rel": row["rel"]})
        return {"nodes": list(nodes.values()), "edges": edges, "source": "neo4j"}


def _network_strength(has_coop: bool, has_sacco: bool, coop_size: int, peer_avg: float) -> float:
    return min(
        1.0,
        0.30 * (1 if has_coop else 0)
        + 0.20 * (1 if has_sacco else 0)
        + 0.25 * min(1.0, coop_size / 25)
        + 0.25 * peer_avg,
    )


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        s = str(value or "").replace(",", "").strip()
        return float(s) if s else default
    except (ValueError, TypeError):
        return default
