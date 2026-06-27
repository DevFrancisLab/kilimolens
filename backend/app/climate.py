"""Real climate intelligence via the Open-Meteo APIs (free, no API key).

Given a farm's coordinates (or county), returns annual rainfall, temperature,
a warming trend and derived drought/flood risk. Results are cached in-memory.
Falls back to county-level estimates when the network is unavailable, so the
endpoint always returns a usable payload.
"""
from __future__ import annotations

import threading
from datetime import date, timedelta
from typing import Any, Optional

import httpx

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

# Approximate centroids for the counties used in the app (lat, lon).
COUNTY_CENTROIDS: dict[str, tuple[float, float]] = {
    "embu": (-0.5310, 37.4575),
    "kisumu": (-0.0917, 34.7680),
    "mombasa": (-4.0435, 39.6682),
    "nakuru": (-0.3031, 36.0800),
    "uasin gishu": (0.5143, 35.2698),
    "nairobi": (-1.2921, 36.8219),
}
_DEFAULT = (-1.2921, 36.8219)  # Nairobi

_cache: dict[str, dict[str, Any]] = {}
_lock = threading.Lock()


def parse_coords(gps: str, county: str) -> tuple[float, float]:
    if gps:
        try:
            parts = [p.strip() for p in str(gps).replace(";", ",").split(",")]
            if len(parts) >= 2:
                lat, lon = float(parts[0]), float(parts[1])
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    return lat, lon
        except (ValueError, TypeError):
            pass
    return COUNTY_CENTROIDS.get(str(county or "").strip().lower(), _DEFAULT)


def get_climate(lat: float, lon: float, county: str = "") -> dict[str, Any]:
    key = f"{lat:.3f},{lon:.3f}"
    with _lock:
        if key in _cache:
            return _cache[key]

    try:
        data = _fetch_open_meteo(lat, lon)
        data["source"] = "open-meteo"
    except Exception as exc:  # network / API failure → derived estimate
        print(f"[climate] Open-Meteo unavailable, using estimate: {exc}")
        data = _estimate(lat, lon, county)
        data["source"] = "estimated"

    data["latitude"] = round(lat, 4)
    data["longitude"] = round(lon, 4)
    with _lock:
        _cache[key] = data
    return data


def _fetch_open_meteo(lat: float, lon: float) -> dict[str, Any]:
    end = date.today() - timedelta(days=5)  # archive lags a few days
    start_recent = end - timedelta(days=365)
    start_baseline = end - timedelta(days=365 * 5)

    with httpx.Client(timeout=20) as client:
        resp = client.get(
            ARCHIVE_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": start_baseline.isoformat(),
                "end_date": end.isoformat(),
                "daily": "precipitation_sum,temperature_2m_mean",
                "timezone": "auto",
            },
        )
        resp.raise_for_status()
        daily = resp.json()["daily"]

    days = daily["time"]
    precip = [p or 0.0 for p in daily["precipitation_sum"]]
    temps = [t for t in daily["temperature_2m_mean"] if t is not None]

    recent_cut = start_recent.isoformat()
    recent_precip = [p for d, p in zip(days, precip) if d >= recent_cut]
    annual_rainfall = round(sum(recent_precip))

    # 5-year average annual rainfall for a drought baseline.
    n_years = max(1, len(precip) / 365.0)
    avg_annual = sum(precip) / n_years
    drought_risk = _clamp(round((1 - annual_rainfall / avg_annual) * 100)) if avg_annual else 0

    avg_temp = round(sum(temps) / len(temps), 1) if temps else 0.0
    temp_trend = _temp_trend(days, daily["temperature_2m_mean"])

    # Flood risk from heaviest recent daily rainfall.
    max_daily = max(recent_precip) if recent_precip else 0
    flood_risk = "High" if max_daily > 80 else "Moderate" if max_daily > 40 else "Low"

    # Vegetation proxy (not satellite NDVI): scaled from rainfall adequacy.
    ndvi = round(_clamp01(0.2 + min(annual_rainfall, 1400) / 1400 * 0.6), 2)
    soil = (
        "Excellent" if annual_rainfall > 1000 else
        "Good" if annual_rainfall > 700 else
        "Fair" if annual_rainfall > 400 else "Poor"
    )

    return {
        "rainfallMmYr": annual_rainfall,
        "avgTempC": avg_temp,
        "tempTrendCPerDecade": temp_trend,
        "droughtRiskPct": drought_risk,
        "floodRisk": flood_risk,
        "ndviProxy": ndvi,
        "soilSuitability": soil,
    }


def _temp_trend(days: list[str], temps: list[Optional[float]]) -> float:
    """Least-squares slope of mean temperature, expressed in °C/decade."""
    pts = [(i, t) for i, t in enumerate(temps) if t is not None]
    if len(pts) < 2:
        return 0.0
    n = len(pts)
    sx = sum(x for x, _ in pts)
    sy = sum(y for _, y in pts)
    sxx = sum(x * x for x, _ in pts)
    sxy = sum(x * y for x, y in pts)
    denom = n * sxx - sx * sx
    if denom == 0:
        return 0.0
    slope_per_day = (n * sxy - sx * sy) / denom
    return round(slope_per_day * 365 * 10, 2)  # per decade


def _estimate(lat: float, lon: float, county: str) -> dict[str, Any]:
    """Deterministic county-based estimate when Open-Meteo is unreachable."""
    table = {
        "embu": (1050, 19.5), "kisumu": (1300, 23.0), "mombasa": (1040, 26.5),
        "nakuru": (900, 17.5), "uasin gishu": (1100, 17.0), "nairobi": (900, 19.0),
    }
    rainfall, temp = table.get(str(county or "").strip().lower(), (850, 21.0))
    return {
        "rainfallMmYr": rainfall,
        "avgTempC": temp,
        "tempTrendCPerDecade": 0.25,
        "droughtRiskPct": _clamp(round((1 - rainfall / 1100) * 100)),
        "floodRisk": "Moderate" if rainfall > 1100 else "Low",
        "ndviProxy": round(_clamp01(0.2 + min(rainfall, 1400) / 1400 * 0.6), 2),
        "soilSuitability": "Good" if rainfall > 700 else "Fair",
    }


def _clamp(v: int) -> int:
    return max(0, min(100, v))


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, v))
