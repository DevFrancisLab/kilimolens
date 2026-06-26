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

    def record_assessment(self, fid: str, result: dict[str, Any]) -> None:
        if not self.enabled:
            return
        self.client.run(
            """
            MATCH (f:Farmer {id:$id})
            CREATE (a:Assessment {
              date: timestamp(), readiness: $readiness,
              confidence: $confidence, recommendation: $rec, modelVersion: $ver
            })
            MERGE (f)-[:HAS_ASSESSMENT]->(a)
            """,
            id=fid,
            readiness=result["creditReadinessScore"],
            confidence=result["confidenceScore"],
            rec=result["recommendation"],
            ver=result["modelVersion"],
        )

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
            RETURN f.id AS source, type(r) AS rel, labels(n)[0] AS label,
                   coalesce(n.name, n.id) AS target
            """,
            id=fid,
        )
        nodes = {fid: {"id": fid, "label": "Farmer"}}
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
