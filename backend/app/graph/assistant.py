"""GraphRAG "Ask the graph" assistant — Vector + Cypher retriever over the Neo4j
knowledge graph (the Neo4j GenAI workshop's graph-enhanced vector search pattern).

Flow:
  1. Each Assessment node carries a vector embedding of a text summary.
  2. A question is embedded and used for semantic vector search over those nodes
     (Neo4j vector index).
  3. From each matched node we TRAVERSE the graph (Cypher) to pull connected
     context — the farmer's cooperative, SACCO, county and crops.
  4. The enriched context is handed to the LLM to answer in plain language.

This combines vector similarity (find the *relevant* farmers) with graph traversal
(bring their *connected* context) — richer and more explainable than vector RAG
alone, and safer than letting the LLM author arbitrary Cypher.
"""
from __future__ import annotations

import json
from typing import Any

from app.config import get_settings
from app.graph.client import GraphClient

VECTOR_INDEX = "assessment_vec"

_ANSWER_PROMPT = """You are KilimoLens, helping a loan officer using a knowledge graph.
Answer the question using ONLY the retrieved farmer records below.

Question: {question}

Retrieved records (most semantically relevant first, with graph context):
{context}

Answer in 1-4 clear sentences. Cite concrete names/numbers from the records.
If nothing is relevant, say no matching farmers were found. Do not invent data."""


# ── embeddings ───────────────────────────────────────────────────────────────
def _embedder():
    from langchain_openai import OpenAIEmbeddings

    s = get_settings()
    return OpenAIEmbeddings(
        model=s.gemini_embedding_model,
        api_key=s.gemini_api_key,
        base_url=s.gemini_base_url,
        check_embedding_ctx_length=False,
    )


def _llm():
    from langchain_openai import ChatOpenAI

    s = get_settings()
    return ChatOpenAI(
        model=s.gemini_model, api_key=s.gemini_api_key, base_url=s.gemini_base_url,
        temperature=0.2, timeout=40,
    )


def assessment_text(result: dict[str, Any], summary: dict[str, Any]) -> str:
    """Human-readable text for an assessment — this is what gets embedded."""
    exp = (result or {}).get("explanation", {}) or {}
    parts = [
        f"Farmer {summary.get('farmerName','')} in {summary.get('county','')}.",
        f"Loan {summary.get('loanAmount','')} for {summary.get('purpose','')}.",
        f"Credit readiness {result.get('creditReadinessScore','')}, "
        f"confidence {result.get('confidenceScore','')}, "
        f"recommendation {result.get('recommendation','')}, status {summary.get('status','')}.",
        exp.get("summary", ""),
        "Strengths: " + "; ".join(exp.get("strengths", []) or []),
        "Risks: " + "; ".join(exp.get("risks", []) or []),
    ]
    return " ".join(p for p in parts if p).strip()


# ── index management ─────────────────────────────────────────────────────────
def ensure_vector_index(dims: int = 3072) -> None:
    client = GraphClient.instance()
    if not client.enabled:
        return
    client.run(
        f"""
        CREATE VECTOR INDEX {VECTOR_INDEX} IF NOT EXISTS
        FOR (a:Assessment) ON (a.embedding)
        OPTIONS {{ indexConfig: {{
          `vector.dimensions`: {dims},
          `vector.similarity_function`: 'cosine'
        }} }}
        """
    )


def embed_assessment(assessment_id: str, text: str) -> None:
    """Best-effort: embed an assessment's text and store it on the node."""
    client = GraphClient.instance()
    if not client.enabled:
        return
    try:
        vec = _embedder().embed_query(text)
        ensure_vector_index(len(vec))
        client.run(
            "MATCH (a:Assessment {id:$id}) SET a.text = $text, a.embedding = $vec",
            id=assessment_id, text=text, vec=vec,
        )
    except Exception as exc:  # never block scoring on embedding
        print(f"[assistant] embed failed for {assessment_id}: {exc}")


def backfill() -> dict[str, Any]:
    """Embed any Assessment nodes that don't yet have an embedding."""
    client = GraphClient.instance()
    if not client.enabled:
        return {"embedded": 0, "neo4j": False}
    rows = client.run(
        "MATCH (a:Assessment) WHERE a.embedding IS NULL "
        "RETURN a.id AS id, a.resultJson AS resultJson, a{.*} AS node"
    )
    embedder = _embedder()
    count = 0
    for r in rows:
        node = r["node"] or {}
        result = json.loads(r.get("resultJson") or "{}")
        summary = {
            "farmerName": node.get("farmerName", ""), "county": node.get("county", ""),
            "loanAmount": node.get("loanAmount", ""), "purpose": node.get("purpose", ""),
            "status": node.get("status", ""),
        }
        text = assessment_text(result, summary)
        try:
            vec = embedder.embed_query(text)
            if count == 0:
                ensure_vector_index(len(vec))
            client.run(
                "MATCH (a:Assessment {id:$id}) SET a.text=$text, a.embedding=$vec",
                id=r["id"], text=text, vec=vec,
            )
            count += 1
        except Exception as exc:
            print(f"[assistant] backfill failed for {r['id']}: {exc}")
    return {"embedded": count, "neo4j": True}


# ── retrieval ────────────────────────────────────────────────────────────────
def ask(question: str, k: int = 5) -> dict[str, Any]:
    settings = get_settings()
    question = (question or "").strip()
    if not question:
        return {"question": question, "answer": "Please ask a question.", "matches": [], "error": "empty"}
    if not settings.gemini_enabled:
        return {"question": question, "answer": "The assistant LLM is not configured.", "matches": [], "error": "llm_disabled"}

    client = GraphClient.instance()
    if not client.enabled:
        return {"question": question, "answer": "The knowledge graph (Neo4j) is not connected.", "matches": [], "error": "neo4j_disabled"}

    ensure_vector_index()
    try:
        qvec = _embedder().embed_query(question)
    except Exception as exc:
        return {"question": question, "answer": f"Could not embed the question: {exc}", "matches": [], "error": "embed_error"}

    # Vector search → graph traversal for connected context.
    try:
        matches = client.run(
            f"""
            CALL db.index.vector.queryNodes('{VECTOR_INDEX}', $k, $qvec) YIELD node, score
            MATCH (f:Farmer)-[:HAS_ASSESSMENT]->(node)
            OPTIONAL MATCH (f)-[:MEMBER_OF]->(co:Cooperative)
            OPTIONAL MATCH (f)-[:SAVES_WITH]->(sa:Sacco)
            OPTIONAL MATCH (f)-[:LOCATED_IN]->(c:County)
            OPTIONAL MATCH (f)-[:GROWS]->(cr:Crop)
            RETURN round(score, 3) AS score, f.id AS farmerId, f.name AS farmer,
                   node.readiness AS readiness, node.confidence AS confidence,
                   node.recommendation AS recommendation, node.status AS status,
                   node.loanAmount AS loanAmount, node.purpose AS purpose,
                   c.name AS county, co.name AS cooperative, sa.name AS sacco,
                   collect(DISTINCT cr.name) AS crops
            ORDER BY score DESC
            """,
            k=k, qvec=qvec,
        )
    except Exception as exc:
        return {"question": question, "answer": f"Vector search failed (is anything indexed yet?): {exc}", "matches": [], "error": "vector_error"}

    if not matches:
        return {"question": question, "answer": "No matching farmers were found in the knowledge graph.", "matches": [], "error": None}

    context = "\n".join(
        f"- {m['farmer']} ({m['county'] or 'n/a'}), coop: {m['cooperative'] or 'none'}, "
        f"sacco: {m['sacco'] or 'none'}, crops: {', '.join(m['crops']) or 'n/a'}; "
        f"readiness {m['readiness']}, recommendation {m['recommendation']}, status {m['status']} "
        f"[similarity {m['score']}]"
        for m in matches
    )
    try:
        answer = _llm().invoke(_ANSWER_PROMPT.format(question=question, context=context)).content.strip()
    except Exception:
        answer = "Here are the most relevant farmers from the knowledge graph."

    return {"question": question, "answer": answer, "matches": matches, "retriever": "vector+cypher", "error": None}
