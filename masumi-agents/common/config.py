"""Shared configuration for the Masumi agent services."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    # Masumi Payment Service
    payment_service_url: str = "http://localhost:3001/api/v1"
    payment_api_key: str = ""
    network: str = "Preprod"

    # Per-agent identity (registered separately on Masumi)
    farmer_trust_agent_identifier: str = ""
    farmer_trust_seller_vkey: str = ""
    farmer_trust_price_lovelace: int = 2_000_000

    coop_intel_agent_identifier: str = ""
    coop_intel_seller_vkey: str = ""
    coop_intel_price_lovelace: int = 2_500_000

    # Data substrate (read-only Neo4j) + Gemini
    neo4j_uri: str = ""
    neo4j_user: str = ""
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    gemini_model: str = "gemini-2.5-flash"

    @property
    def masumi_enabled(self) -> bool:
        return bool(self.payment_api_key)

    @property
    def neo4j_enabled(self) -> bool:
        return bool(self.neo4j_password and self.neo4j_uri)

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
