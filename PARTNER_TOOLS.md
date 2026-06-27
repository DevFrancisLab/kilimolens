# KilimoLens — Partner Tool Usage

Track: **Mercy Corps AgriFin — Agricultural Finance**
Brief: *The Invisible Farmer: Graph AI Credit Scoring at Africa's Last Mile.*

This document shows, for each partner tool, **where** it is used, **why** we chose
it, and **how** it works in the solution — per the tech-partner bounty criteria.

---

## 🟢 Neo4j — knowledge graph **and** system of record

**Where**
- The entire data layer. Every farmer, cooperative, SACCO, county, crop and
  assessment is stored in Neo4j (Aura).
- The credit model's **graph features** (cooperative network strength, peer
  repayment behaviour).
- The dashboard's Applications, AI Assessments, Farmer Profiles and Overview KPIs
  are served by **Cypher queries** — API responses carry `"source": "neo4j"`.
- The Knowledge Graph explorer page.
- **GraphRAG "Ask KilimoLens" assistant** — a Vector + Cypher retriever: each
  Assessment node carries a vector embedding; a question is embedded, semantically
  matched against a Neo4j **vector index**, and the matches are enriched by graph
  traversal (cooperative, SACCO, county, crops) before the LLM answers.

**Why**
Credit risk at the last mile is fundamentally a **network** problem. Smallholders
are invisible to traditional scoring because they lack collateral and formal
history — but they are richly connected: cooperative co-members, peer guarantors,
shared SACCOs, repayment behaviour of their group. A graph database models these
relationships natively, and lets us derive trust signals that a tabular DB cannot.

**How**
- Graph model:
  `(:Farmer)-[:MEMBER_OF]->(:Cooperative)`, `-[:SAVES_WITH]->(:Sacco)`,
  `-[:LOCATED_IN]->(:County)`, `-[:GROWS]->(:Crop)`, `-[:HAS_ASSESSMENT]->(:Assessment)`.
- On every `/assess`, the farmer and relationships are `MERGE`d and a full
  `Assessment` node is written and **embedded** into a Neo4j vector index.
- `cooperativeNetworkStrength` / `peerRepaymentScore` are computed by traversing
  to co-members and guarantors and averaging their repayment standing — these feed
  directly into the XGBoost credit-readiness score.
- GraphRAG retrieval: `db.index.vector.queryNodes(...)` for semantic search, then
  `MATCH` traversal for connected context (the Vector + Cypher pattern from the
  Neo4j GenAI workshop).
- Code: `backend/app/graph/` (`client.py`, `repository.py`, `assistant.py`).

---

## 🟣 Gemini 2.5 Flash — explainable, multilingual farmer communication

**Where**
- The explainable-AI layer that turns the model's SHAP drivers into language a
  loan officer and a farmer can act on.
- Generates the farmer-facing SMS/USSD message in **English and Kiswahili**.
- API responses carry `"explanation.source": "gemini"`.

**Why**
The brief requires decisions farmers can understand, delivered over SMS/USSD in
**local languages**. That is exactly an LLM task: translate model internals (SHAP
contributions, graph features) into fair, plain-language guidance and localise it.
Gemini 2.5 Flash is fast and low-cost, and is reached through its
OpenAI-compatible endpoint, which keeps the explanation layer swappable.

**How**
- LangChain `ChatOpenAI` pointed at the Gemini OpenAI-compatible endpoint
  (`https://generativelanguage.googleapis.com/v1beta/openai/`).
- The prompt is grounded **strictly** in the model's own drivers and scores, and
  is instructed never to cite protected attributes (gender, age, land ownership) —
  preserving the fairness design.
- Returns: loan-officer summary, strengths, risks, next steps, and the farmer
  message in English + Kiswahili.
- Code: `backend/app/explain/explainer.py`. A deterministic template is the
  fallback when no key is configured, so the API never breaks.

---

## 🔵 Lovable — product UI

**Where**
- The entire React/TanStack Start frontend was built on Lovable's stack
  (`@lovable.dev/vite-tanstack-config`), then extended with the live dashboard,
  auth, and backend integration.

**Why**
Lovable let us stand up a polished, branded lending dashboard quickly so effort
could go into the AI/data layer rather than UI scaffolding.

**How**
- `frontend/` is a Lovable-generated TanStack Start app; we added the assessment
  wizard, role-based dashboard, knowledge-graph explorer and API client on top.

---

## 🟠 Masumi — two independent, monetised AI agents

**Where** — `masumi-agents/` (two standalone services, NOT part of KilimoLens):
- **Farmer Trust Agent** — sells a portable, explainable Farmer Trust Report.
- **Cooperative Intelligence Agent** — sells a Cooperative Reputation Report.

**Why** — Today every lender re-verifies the same farmer/cooperative from zero.
Masumi lets that work be done once and **sold on demand** between agents. These are
genuinely independent services any lender can discover and hire — KilimoLens is
just one consumer. This is a real agent-economy use case, not a bolt-on.

**How** — Each agent implements the **MIP-003 Agentic Service API**
(`/availability`, `/input_schema`, `/start_job`, `/status`, `/provide_input`) and
integrates the **Masumi Payment Service** (via the `masumi` SDK): a job only runs
after on-chain payment is confirmed, then the result hash settles the escrow.
Every job keeps an audit trail. Reports are explainable (Gemini) and draw on the
Neo4j knowledge graph. A mock payment provider lets the full flow run offline for
demos. See `masumi-agents/README.md` for architecture, sequence diagram and tested
example requests/responses.

---

## Verifying tool usage live

```bash
curl localhost:8000/api/health
# -> neo4j.enabled:true, gemini.enabled:true

curl localhost:8000/api/stats          # source computed by Cypher in Neo4j
curl "localhost:8000/api/assessments"  # "source":"neo4j"
```
