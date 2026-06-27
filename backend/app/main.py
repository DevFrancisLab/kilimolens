"""KilimoLens API — explainable graph-AI credit scoring for smallholder farmers."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import store
from app.api.routes import router
from app.config import get_settings
from app.crud import messaging as messaging_db
from app.graph.client import GraphClient
from app.ml.scorer import CreditScorer
from app.routers import sms_router, ussd_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm singletons so the first request isn't slow, and ensure the DB exists.
    store.init_db()
    messaging_db.init_messaging_db()
    CreditScorer.instance()
    GraphClient.instance()
    yield
    GraphClient.instance().close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="KilimoLens API",
        description="Explainable graph-AI credit scoring for Africa's smallholder farmers.",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api")
    # Africa's Talking channels. USSD callback is at POST /ussd (the URL you
    # register in the Africa's Talking dashboard); SMS callbacks under /api/sms.
    app.include_router(ussd_router)
    app.include_router(sms_router, prefix="/api")

    @app.get("/")
    def root() -> dict:
        return {"service": "KilimoLens API", "docs": "/docs", "health": "/api/health"}

    return app


app = create_app()
