"""Central configuration, loaded from environment / .env."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # Featherless AI (OpenAI-compatible)
    featherless_api_key: str = ""
    featherless_base_url: str = "https://api.featherless.ai/v1"
    featherless_model: str = "mistralai/Mistral-7B-Instruct-v0.3"

    # App
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    model_dir: str = "artifacts"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def model_path(self) -> Path:
        return BASE_DIR / self.model_dir / "model.json"

    @property
    def feature_meta_path(self) -> Path:
        return BASE_DIR / self.model_dir / "feature_meta.json"

    @property
    def neo4j_enabled(self) -> bool:
        return bool(self.neo4j_password)

    @property
    def featherless_enabled(self) -> bool:
        return bool(self.featherless_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
