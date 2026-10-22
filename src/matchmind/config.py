"""Application settings loaded from environment variables / .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration.

    The defaults are safe for local demo mode: no network calls and no secrets.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Model provider
    llm_provider: str = "deepseek"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-flash"
    deepseek_model_deep: str = "deepseek-v4-pro"

    # Optional Microsoft Foundry production path
    foundry_project_endpoint: str = ""
    foundry_model: str = ""

    # App
    app_env: str = "dev"
    log_level: str = "INFO"
    demo_mode: str = "replay"  # replay | live
    match_data_dir: str = "./data/demo"
    audit_db_path: str = "./data/audit.sqlite3"
    public_base_url: str = "http://localhost:8000"

    # Optional Azure production path
    applicationinsights_connection_string: str = ""
    azure_cosmos_endpoint: str = ""
    azure_cosmos_database: str = "matchmind"
    azure_key_vault_uri: str = ""

    # Safety / budget
    max_llm_calls_per_match: int = 60
    max_cost_usd_per_match: float = 2.0
    llm_timeout_seconds: int = 20


settings = Settings()
