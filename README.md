# KilimoLens — Making the Invisible Farmer Visible

**Explainable Graph-AI credit scoring for Africa's smallholder farmers.**

Kenya AI Challenge · Mercy Corps AgriFin track — *The Invisible Farmer: Graph AI
Credit Scoring at Africa's Last Mile.*

---

## The problem

Smallholder farmers are routinely denied formal agricultural credit — not because
they are unreliable, but because lenders **can't see** their creditworthiness.
Traditional scoring leans on collateral, land titles and formal credit history, so
productive farmers (especially women, youth and persons with disabilities) stay
invisible, and the data that exists is scattered across cooperatives, mobile money,
farm records and lender databases. Farmers also rarely get an explanation they can
act on, and many can only be reached over SMS/USSD.

## The solution

KilimoLens turns fragmented agricultural, financial and climate data into lending
insights a financial institution can trust. It combines a **knowledge graph**,
**machine learning** and **explainable AI** so lenders decide fairly on real
evidence, while farmers get a clear explanation and concrete steps to improve their
credit readiness — on a web dashboard **and** over SMS/USSD, in English, Kiswahili
and local languages.

```
 Farmer + financial + climate data
        │
        ▼
  Neo4j knowledge graph ──▶ graph features (cooperative network, peer repayment)
        │                         │
        ▼                         ▼
  XGBoost model ───────▶ Credit Readiness Score + Confidence (+ SHAP drivers)
        │
        ▼
  Explainable AI (Gemini) ──▶ plain-language reasons + next steps (EN/SW)
        │
        ├──▶ Loan-officer dashboard (React)
        └──▶ Farmer over SMS / USSD (Africa's Talking)
```

---

## What's inside

| Capability | Description |
|------------|-------------|
| **Credit assessment** | XGBoost model → Credit Readiness + Confidence with **SHAP** explainability. Protected/collateral attributes (gender, age, land ownership) are **excluded** for fairness. |
| **Knowledge graph** | Neo4j is the system of record: farmers, cooperatives, SACCOs, counties, crops, assessments and their relationships. Powers graph-derived credit features and the dashboard. |
| **GraphRAG assistant** | "Ask KilimoLens" — natural-language questions answered by **Vector + Cypher** retrieval over Neo4j (semantic vector search + graph traversal). |
| **AI Advisory** | Two-way **SMS** advisory: every reply is AI-generated from the farmer's own assessment to help them improve/maintain credit readiness (EN + Kiswahili). |
| **AI form-fill** | Loan officers paste/upload farmer details (text, JSON, Excel, CSV, PDF, image); the agent fills each wizard section (Personal, Farm, Financial, Community, Climate) for review & confirm. |
| **M-Pesa OCR** | Upload an M-Pesa statement (PDF/photo); Gemini extracts a financial summary for the assessment. |
| **USSD + SMS channels** | Farmers with any phone apply for financing and check status over USSD; confirmations via SMS — in English, Kiswahili, Kikuyu, Kamba, Luo, Kalenjin, Luhya. |
| **Masumi agents** | Two independent, monetised AI services (separate repo folder) — see below. |

---

## Tech stack

- **Frontend** — React 19 + TanStack Start (built on Lovable), Vite, Tailwind; deploys to Vercel.
- **Backend** — FastAPI (async), Python 3.11; deploys to Render (Docker).
- **Graph DB** — Neo4j Aura (primary), with a local **SQLite** mirror as an offline fallback.
- **ML** — XGBoost + SHAP (scikit-learn, pandas, numpy).
- **LLM** — Google **Gemini 2.5 Flash** via LangChain (OpenAI-compatible endpoint); `gemini-embedding-001` for the vector index.
- **Channels** — Africa's Talking (USSD + SMS).
- **Agent economy** — Masumi Network (MIP-003 + Payment Service).

---

## Repository structure

```
kilimolens/
├── frontend/          React/TanStack dashboard (loan officers)
├── backend/           FastAPI API — scoring, graph, channels, AI modules
│   └── app/
│       ├── ml/          XGBoost training + scoring (SHAP)
│       ├── graph/       Neo4j client, repository, GraphRAG assistant
│       ├── explain/     Gemini explainability
│       ├── routers/     USSD, SMS, OCR, AI Advisory, extraction
│       ├── services/    assessment, Africa's Talking, form extraction
│       ├── repositories/ advisory conversation store
│       └── prompts/     advisory prompts
├── masumi-agents/     Two independent Masumi AI services (MIP-003)
├── samples/           Sample farmer data for testing the AI form-fill
├── PARTNER_TOOLS.md   Where/why/how each partner tool is used
└── README.md
```

Each area has its own README: [backend/README.md](backend/README.md),
[masumi-agents/README.md](masumi-agents/README.md), and tool usage in
[PARTNER_TOOLS.md](PARTNER_TOOLS.md).

---

## Getting started

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env            # fill Neo4j, Gemini and Africa's Talking creds
python -m app.ml.train            # trains the XGBoost model -> artifacts/
uvicorn app.main:app --reload --port 8000
```
> **Always run from `.venv`** — the deps (neo4j, xgboost, shap…) live there.
> Open http://localhost:8000/docs for the API, and `GET /api/health` to confirm
> `neo4j`, `model` and `gemini` are all enabled. Every external dependency degrades
> gracefully (SQLite fallback, deterministic explanation, heuristic model), so the
> API runs even before credentials are added.

### Frontend
```bash
cd frontend
npm install                       # or: bun install
npm run dev                       # http://localhost:5173
```
Set `VITE_API_URL` (default `http://localhost:8000/api`).

**Demo logins:** `asha@kilimolens.test` / `password` (Loan Officer),
`eliot@kilimolens.test` / `password` (Analyst), `admin@kilimolens.test` / `admin`.

---

## Key API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/assess` | Run the full credit assessment pipeline |
| GET | `/api/stats`, `/api/assessments`, `/api/farmers` | Dashboard data (Cypher-backed) |
| GET | `/api/farmers/{id}/graph` | Knowledge-graph neighborhood |
| POST | `/api/assistant/ask` | GraphRAG "Ask KilimoLens" (Vector + Cypher) |
| POST | `/api/extract/form` | AI form-fill (section + text/file) |
| POST | `/api/ocr/mpesa` | Extract an M-Pesa statement |
| POST | `/api/advisory/sms/webhook` | Inbound farmer SMS → AI advisory reply |
| POST | `/ussd` | Africa's Talking USSD callback |

---

## Masumi agents (independent services)

In [`masumi-agents/`](masumi-agents/) are two reusable AI services any lender can
discover and hire via the **Masumi Network** (MIP-003 + on-chain payment):

- **Farmer Trust Agent** — a portable, explainable farmer trust report.
- **Cooperative Intelligence Agent** — an explainable cooperative reputation report.

They are *not* part of KilimoLens; KilimoLens is one consumer that discovers them.

---

## Responsible & fair by design

- **Protected and collateral-proxy attributes are excluded from the model** —
  gender, age and land ownership never enter the feature vector. Scoring relies on
  behavioural and alternative data (repayment, mobile money, cooperative/peer
  networks, climate resilience).
- **Every score is explainable** — SHAP drivers ground the LLM explanation, which
  is instructed never to cite protected attributes.
- **Accessible** — web, SMS and USSD, in English, Kiswahili and local languages.

---

## Partner tools

Neo4j (knowledge graph + GraphRAG), Google Gemini (explainability + embeddings),
Lovable (frontend), and Masumi (independent agents). See
[PARTNER_TOOLS.md](PARTNER_TOOLS.md) for exactly where, why and how each is used.
