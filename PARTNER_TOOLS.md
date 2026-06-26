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
  `Assessment` node is written.
- `cooperativeNetworkStrength` / `peerRepaymentScore` are computed by traversing
  to co-members and guarantors and averaging their repayment standing — these feed
  directly into the XGBoost credit-readiness score.
- Code: `backend/app/graph/` (`client.py`, `repository.py`).

---

## 🟣 Featherless AI — explainable, multilingual farmer communication

**Where**
- The explainable-AI layer that turns the model's SHAP drivers into language a
  loan officer and a farmer can act on.
- Generates the farmer-facing SMS/USSD message in **English and Kiswahili**.
- API responses carry `"explanation.source": "featherless"`.

**Why**
The brief requires decisions farmers can understand, delivered over SMS/USSD in
**local languages**. That is exactly an LLM task: translate model internals (SHAP
contributions, graph features) into fair, plain-language guidance and localise it.
Featherless gives OpenAI-compatible access to open models, which keeps the
explanation layer swappable and affordable.

**How**
- LangChain `ChatOpenAI` pointed at the Featherless endpoint
  (`https://api.featherless.ai/v1`).
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

## ⚪ Masumi — evaluated, intentionally not forced

We reviewed Masumi (decentralised agent payments / identity). For an internal
lender credit-scoring tool it did not have a *meaningful* role in this build, and
the bounty rules explicitly warn against bolting a tool on "just so it appears."
A future fit: settling micro-payments to field agents/verifiers or issuing
verifiable farmer credit credentials — noted as a roadmap item, not claimed here.

---

## Verifying tool usage live

```bash
curl localhost:8000/api/health
# -> neo4j.enabled:true, featherless.enabled:true

curl localhost:8000/api/stats          # source computed by Cypher in Neo4j
curl "localhost:8000/api/assessments"  # "source":"neo4j"
```
