# KilimoLens API — container image (deterministic build for Render/any host).
# Python is pinned here, so the host's default version is irrelevant.
FROM python:3.11-slim

# libgomp1 is required by xgboost (OpenMP) at runtime on slim images.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# App source.
COPY . .

# Train the synthetic XGBoost model into artifacts/. Non-fatal: if it fails the
# API still runs on the transparent heuristic fallback.
RUN python -m app.ml.train || echo "model training skipped; using heuristic fallback"

# Render injects $PORT at runtime; default to 8000 for local `docker run`.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips=*"]
