# KilimoLens API — Explainable Graph-AI Credit Scoring

Backend for KilimoLens: turns a smallholder farmer's scattered agricultural,
financial and climate data into a **Credit Readiness Score**, a **Confidence
Score**, and a **plain-language explanation** a loan officer and a farmer can
both act on.

Implements the architecture from the challenge brief:

```
 form  ─▶  Neo4j knowledge graph  ─▶  XGBoost model  ─▶  Explainable AI  ─▶  API
          (farmer / coop / sacco /     (readiness +        (LangChain +
           crop / peer networks)        confidence,         Featherless AI)
                                        SHAP drivers)
```

| Layer | Tech | File |
|-------|------|------|
| API | FastAPI | `app/main.py`, `app/api/routes.py` |
| Knowledge graph | Neo4j | `app/graph/` |
| ML model | XGBoost + SHAP | `app/ml/` |
| Explainable AI | LangChain + Featherless AI | `app/explain/explainer.py` |

### Designed to degrade gracefully
Every external dependency is optional so the API always returns a full result:
- **No Neo4j?** Graph features (cooperative network strength, peer repayment) are
  derived from the form instead (`graphFeatures.source = "derived"`).
- **No Featherless key?** A deterministic template produces the explanation
  (`explanation.source = "fallback"`).
- **No trained model file?** A transparent weighted heuristic is used.

Fill in the credentials and those layers light up automatically — no code change.

---

## Quick start

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

copy .env.example .env            # then edit .env with your credentials

python -m app.ml.train            # trains XGBoost on synthetic data -> artifacts/
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

> **Python 3.11 recommended.** `scikit-learn` is pinned to 1.5.2 and `numpy` to
> 1.26.4 for compatibility with the XGBoost sklearn wrapper and LangChain.

---

## Configuration (`.env`)

| Variable | Purpose |
|----------|---------|
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | Knowledge graph. Leave password blank to run without Neo4j. |
| `FEATHERLESS_API_KEY` | Enables LLM explanations via Featherless AI. |
| `FEATHERLESS_MODEL` | Model id, default `mistralai/Mistral-7B-Instruct-v0.3`. |
| `CORS_ORIGINS` | Comma-separated frontend origins. |

---

## Endpoints

### `POST /api/assess`
Body = the frontend assessment wizard form (`personal`, `farm`, `finance`,
`community`, `climate`). Returns:

```jsonc
{
  "farmerId": "F7c222fb2927d",
  "creditReadinessScore": 97,        // 0-100, XGBoost P(repay) * 100
  "confidenceScore": 74,             // boundary margin × data completeness
  "recommendation": "Approve",       // Approve | Further Review | Decline
  "dimensionScores": { "financial": 80, "productivity": 70, ... },
  "drivers": [                       // SHAP attributions, signed
    { "label": "Repayment history", "value": "Good", "direction": "positive", "impact": 0.54 }
  ],
  "graphFeatures": { "cooperativeNetworkStrength": 0.83, "source": "derived" },
  "explanation": {
    "summary": "...",                // for the loan officer
    "strengths": ["..."], "risks": ["..."],
    "farmerMessage": "...",          // plain language, SMS/USSD-ready
    "nextSteps": ["..."],
    "source": "fallback"
  },
  "modelVersion": "kilimolens-xgb-v1"
}
```

### `GET /api/health`
Reports model / Neo4j / Featherless availability.

### `GET /api/farmers/{id}/graph`
Knowledge-graph neighborhood for the graph-explorer UI.

---

## Fairness & responsible data use

- **Protected & collateral-proxy attributes are excluded from the model.**
  Gender, age and land *ownership* never enter the feature vector
  (`app/ml/features.py`). Scoring relies on behavioural and alternative data —
  repayment, mobile money, cooperative/peer networks, climate resilience —
  exactly as the brief requires for women, youth and PWD farmers.
- **Every score is explainable.** SHAP drivers ground the LLM explanation; the
  prompt forbids inventing facts or citing protected attributes.
- The `farmerMessage` field is written for SMS/USSD delivery in plain language.

---

## The model

`python -m app.ml.train` generates a synthetic smallholder population whose
repayment outcome is driven by the signals KilimoLens rewards, then trains an
XGBoost classifier (test AUC ≈ 0.73, balanced base rate ≈ 0.65). Swap in a real
labelled dataset by replacing `_sample_population` / `_label` in
`app/ml/train.py` — the rest of the pipeline is unchanged.
