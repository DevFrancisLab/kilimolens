"""Train the Credit Readiness model on synthetic smallholder-farmer data.

There is no real labelled lending dataset shipped with the challenge, so we
generate a synthetic population whose repayment outcome is driven by the same
behavioural / alternative-data signals KilimoLens is designed to reward
(repayment history, mobile-money activity, cooperative & peer networks, climate
resilience) plus noise. XGBoost then *learns* those relationships rather than us
hard-coding them, which gives us genuine SHAP attributions for the explainer.

Run:  python -m app.ml.train
Saves: artifacts/model.json, artifacts/feature_meta.json
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import xgboost as xgb
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.features import FEATURE_ORDER

RNG = np.random.default_rng(42)
N = 8000


def _sample_population(n: int) -> np.ndarray:
    """Draw n farmers as a matrix in FEATURE_ORDER column order."""
    cols: dict[str, np.ndarray] = {
        "farm_area_ha": np.clip(RNG.gamma(2.0, 1.1, n), 0.1, 15),
        "num_main_crops": RNG.integers(1, 5, n).astype(float),
        "years_of_farming": np.clip(RNG.normal(10, 6, n), 0, 45),
        "savings_kes": np.clip(RNG.gamma(1.6, 9000, n), 0, 400_000),
        "avg_monthly_income_kes": np.clip(RNG.gamma(2.2, 7000, n), 800, 200_000),
        "outstanding_loans_kes": np.clip(RNG.gamma(1.2, 9000, n) * RNG.binomial(1, 0.5, n), 0, 300_000),
        "existing_debt_flag": RNG.binomial(1, 0.35, n).astype(float),
        "mobile_money_activity": RNG.integers(0, 3, n).astype(float),
        "repayment_history": RNG.choice([0, 1, 2], n, p=[0.18, 0.32, 0.50]).astype(float),
        "previous_loans_flag": RNG.binomial(1, 0.55, n).astype(float),
        "cooperative_member": RNG.binomial(1, 0.55, n).astype(float),
        "sacco_member": RNG.binomial(1, 0.45, n).astype(float),
        "years_in_sacco": np.clip(RNG.normal(3, 3, n), 0, 25),
        "peer_guarantees_count": RNG.poisson(1.2, n).astype(float),
        "crop_diversification": RNG.integers(0, 3, n).astype(float),
        "drought_resistant": RNG.integers(0, 3, n).astype(float),
        "water_harvesting_flag": RNG.binomial(1, 0.4, n).astype(float),
        "soil_conservation_flag": RNG.binomial(1, 0.55, n).astype(float),
        "irrigation": RNG.choice([0, 1, 2], n, p=[0.6, 0.25, 0.15]).astype(float),
        "climate_training": RNG.integers(0, 3, n).astype(float),
        "livelihood_diversification_flag": RNG.binomial(1, 0.5, n).astype(float),
        "alt_income_flag": RNG.binomial(1, 0.5, n).astype(float),
    }
    # Graph features correlate with cooperative / sacco / peer participation.
    base_network = (
        0.4 * cols["cooperative_member"]
        + 0.3 * cols["sacco_member"]
        + 0.15 * np.clip(cols["years_in_sacco"] / 10, 0, 1)
        + 0.15 * np.clip(cols["peer_guarantees_count"] / 4, 0, 1)
    )
    cols["coop_network_strength"] = np.clip(base_network + RNG.normal(0, 0.08, n), 0, 1)
    cols["peer_repayment_score"] = np.clip(
        0.5 * (cols["repayment_history"] / 2)
        + 0.5 * cols["coop_network_strength"]
        + RNG.normal(0, 0.1, n),
        0,
        1,
    )
    return np.column_stack([cols[f] for f in FEATURE_ORDER]), cols


def _label(cols: dict[str, np.ndarray], n: int) -> np.ndarray:
    """Latent credit-readiness propensity → repayment outcome (1 = repaid)."""
    income = np.log1p(cols["avg_monthly_income_kes"]) / np.log1p(200_000)
    savings = np.log1p(cols["savings_kes"]) / np.log1p(400_000)
    debt_burden = cols["outstanding_loans_kes"] / (cols["avg_monthly_income_kes"] + 1)

    z = (
        -3.6
        + 1.7 * (cols["repayment_history"] / 2)
        + 0.9 * (cols["mobile_money_activity"] / 2)
        + 0.8 * cols["coop_network_strength"]
        + 0.9 * cols["peer_repayment_score"]
        + 0.7 * savings
        + 0.6 * income
        + 0.5 * cols["previous_loans_flag"]
        + 0.4 * (cols["crop_diversification"] / 2)
        + 0.4 * (cols["drought_resistant"] / 2)
        + 0.3 * cols["water_harvesting_flag"]
        + 0.3 * cols["soil_conservation_flag"]
        + 0.3 * (cols["climate_training"] / 2)
        + 0.25 * cols["alt_income_flag"]
        + 0.2 * (cols["irrigation"] / 2)
        - 0.9 * np.clip(debt_burden, 0, 4) / 4
        - 0.5 * cols["existing_debt_flag"]
    )
    z += RNG.normal(0, 0.45, n)  # irreducible noise
    prob = 1 / (1 + np.exp(-z))
    return RNG.binomial(1, prob).astype(int)


def train() -> dict:
    X, cols = _sample_population(N)
    y = _label(cols, N)

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)

    model = xgb.XGBClassifier(
        n_estimators=350,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=1.2,
        min_child_weight=3,
        objective="binary:logistic",
        eval_metric="auc",
        random_state=7,
        n_jobs=4,
    )
    model.fit(X_tr, y_tr)

    auc = roc_auc_score(y_te, model.predict_proba(X_te)[:, 1])
    base_rate = float(y.mean())

    artifacts = Path(__file__).resolve().parent.parent.parent / "artifacts"
    artifacts.mkdir(exist_ok=True)
    model.save_model(str(artifacts / "model.json"))

    meta = {
        "feature_order": FEATURE_ORDER,
        "model_version": "kilimolens-xgb-v1",
        "n_samples": N,
        "test_auc": round(float(auc), 4),
        "base_repayment_rate": round(base_rate, 4),
        "trained_on": "synthetic-smallholder-v1",
    }
    (artifacts / "feature_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"Trained. Test AUC={auc:.4f}  base_rate={base_rate:.3f}  -> {artifacts}")
    return meta


if __name__ == "__main__":
    train()
