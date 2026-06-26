"""Load the trained XGBoost model and score a farmer: Credit Readiness Score,
Confidence Score, SHAP-based drivers, and the six dashboard dimension scores."""
from __future__ import annotations

import json
import threading
from typing import Any, Optional

import numpy as np

from app.config import get_settings
from app.ml.features import (
    FEATURE_LABELS,
    FEATURE_ORDER,
    build_feature_dict,
    data_completeness,
    humanize_value,
)


class CreditScorer:
    """Thread-safe singleton wrapper around the XGBoost booster + SHAP explainer."""

    _instance: Optional["CreditScorer"] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self.settings = get_settings()
        self.model = None
        self.explainer = None
        self.feature_order: list[str] = FEATURE_ORDER
        self.model_version = "untrained-heuristic"
        self.base_rate = 0.5
        self._load()

    @classmethod
    def instance(cls) -> "CreditScorer":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _load(self) -> None:
        path = self.settings.model_path
        if not path.exists():
            # No trained model yet — scorer falls back to a transparent heuristic.
            return
        try:
            import shap
            import xgboost as xgb

            booster = xgb.XGBClassifier()
            booster.load_model(str(path))
            self.model = booster
            self.explainer = shap.TreeExplainer(booster)
            if self.settings.feature_meta_path.exists():
                meta = json.loads(self.settings.feature_meta_path.read_text())
                self.feature_order = meta.get("feature_order", FEATURE_ORDER)
                self.model_version = meta.get("model_version", "kilimolens-xgb-v1")
                self.base_rate = meta.get("base_repayment_rate", 0.5)
        except Exception as exc:  # pragma: no cover - defensive
            print(f"[scorer] failed to load model, using heuristic: {exc}")
            self.model = None

    @property
    def ready(self) -> bool:
        return self.model is not None

    # ── public API ────────────────────────────────────────────────────────
    def score(
        self, payload: dict[str, Any], graph_features: Optional[dict[str, float]] = None
    ) -> dict[str, Any]:
        feats = build_feature_dict(payload)
        if graph_features:
            feats["coop_network_strength"] = float(graph_features.get("cooperativeNetworkStrength", 0.0))
            feats["peer_repayment_score"] = float(graph_features.get("peerRepaymentScore", 0.0))

        vector = np.array([[feats[f] for f in self.feature_order]], dtype=float)
        completeness = data_completeness(payload)

        if self.model is not None:
            prob = float(self.model.predict_proba(vector)[0, 1])
            drivers, dim_basis = self._shap_drivers(vector, feats)
        else:
            prob, drivers, dim_basis = self._heuristic(feats)

        readiness = int(round(prob * 100))
        confidence = self._confidence(prob, completeness)
        recommendation = (
            "Approve" if readiness >= 70 else "Further Review" if readiness >= 50 else "Decline"
        )
        dimensions = self._dimensions(feats, readiness, completeness)

        return {
            "creditReadinessScore": readiness,
            "confidenceScore": confidence,
            "recommendation": recommendation,
            "dimensionScores": dimensions,
            "drivers": drivers,
            "modelVersion": self.model_version,
            "_features": feats,
        }

    # ── internals ─────────────────────────────────────────────────────────
    def _shap_drivers(self, vector: np.ndarray, feats: dict[str, float]) -> tuple[list[dict], dict]:
        shap_values = self.explainer.shap_values(vector)
        contribs = np.array(shap_values)[0]
        order = np.argsort(np.abs(contribs))[::-1]
        drivers: list[dict] = []
        for idx in order[:6]:
            name = self.feature_order[idx]
            impact = float(contribs[idx])
            drivers.append(
                {
                    "feature": name,
                    "label": FEATURE_LABELS.get(name, name),
                    "impact": round(impact, 4),
                    "direction": "positive" if impact >= 0 else "negative",
                    "value": humanize_value(name, feats[name]),
                }
            )
        return drivers, {"shap": dict(zip(self.feature_order, contribs.tolist()))}

    def _heuristic(self, feats: dict[str, float]) -> tuple[float, list[dict], dict]:
        """Transparent fallback when no model file is present."""
        weights = {
            "repayment_history": 0.17,
            "mobile_money_activity": 0.10,
            "coop_network_strength": 0.10,
            "peer_repayment_score": 0.10,
            "previous_loans_flag": 0.07,
            "crop_diversification": 0.06,
            "drought_resistant": 0.05,
            "soil_conservation_flag": 0.04,
            "water_harvesting_flag": 0.04,
            "climate_training": 0.04,
            "alt_income_flag": 0.04,
        }
        norm = {
            "repayment_history": 2,
            "mobile_money_activity": 2,
            "crop_diversification": 2,
            "drought_resistant": 2,
            "climate_training": 2,
        }
        score = 0.30
        contribs: dict[str, float] = {}
        for f, w in weights.items():
            v = feats.get(f, 0.0)
            v = v / norm[f] if f in norm else min(v, 1.0)
            contribs[f] = w * v
            score += contribs[f]
        savings_boost = min(0.08, feats["savings_kes"] / 400_000)
        score += savings_boost
        contribs["savings_kes"] = savings_boost
        debt_pen = -min(0.12, feats["outstanding_loans_kes"] / (feats["avg_monthly_income_kes"] + 1) / 8)
        score += debt_pen
        contribs["outstanding_loans_kes"] = debt_pen
        prob = max(0.05, min(0.97, score))

        order = sorted(contribs.items(), key=lambda kv: abs(kv[1]), reverse=True)[:6]
        drivers = [
            {
                "feature": name,
                "label": FEATURE_LABELS.get(name, name),
                "impact": round(val, 4),
                "direction": "positive" if val >= 0 else "negative",
                "value": humanize_value(name, feats[name]),
            }
            for name, val in order
        ]
        return prob, drivers, {"shap": contribs}

    @staticmethod
    def _confidence(prob: float, completeness: float) -> int:
        """Confidence blends decision-boundary margin with data completeness."""
        margin = abs(prob - 0.5) * 2  # 0 at the boundary, 1 at the extremes
        conf = 0.55 * margin + 0.45 * completeness
        return int(round(max(0.4, min(0.99, conf)) * 100))

    @staticmethod
    def _dimensions(feats: dict[str, float], readiness: int, completeness: float) -> dict[str, int]:
        clamp = lambda v: int(max(0, min(100, round(v))))
        financial = clamp(
            45
            + 22 * (feats["repayment_history"] / 2)
            + 12 * (feats["mobile_money_activity"] / 2)
            + min(12, feats["savings_kes"] / 12000)
            - min(15, feats["outstanding_loans_kes"] / (feats["avg_monthly_income_kes"] + 1) * 4)
        )
        productivity = clamp(
            45
            + min(28, feats["farm_area_ha"] * 6)
            + 5 * feats["num_main_crops"]
            + 8 * (feats["irrigation"] / 2)
        )
        resilience = clamp(
            35
            + 18 * (feats["crop_diversification"] / 2)
            + 15 * (feats["drought_resistant"] / 2)
            + 12 * (feats["climate_training"] / 2)
            + 10 * feats["water_harvesting_flag"]
        )
        env_risk = clamp(
            70 - 22 * (1 - feats["soil_conservation_flag"]) - 16 * (1 - feats["water_harvesting_flag"])
            + 10 * (feats["irrigation"] / 2)
        )
        community = clamp(
            40
            + 22 * feats["cooperative_member"]
            + 14 * feats["sacco_member"]
            + 30 * feats["coop_network_strength"]
            + min(10, feats["peer_guarantees_count"] * 3)
        )
        data_conf = clamp(completeness * 100)
        return {
            "financial": financial,
            "productivity": productivity,
            "resilience": resilience,
            "envRisk": env_risk,
            "community": community,
            "dataConfidence": data_conf,
        }
