"""D0 configuration tests. No network or secrets required."""

from matchmind.config import Settings


def test_settings_defaults() -> None:
    config = Settings(_env_file=None)
    assert config.llm_provider == "deepseek"
    assert config.deepseek_base_url == "https://api.deepseek.com"
    assert config.deepseek_model == "deepseek-flash"
    assert config.demo_mode == "replay"
    assert config.max_llm_calls_per_match == 60


def test_settings_env_override(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "foundry")
    monkeypatch.setenv("DEMO_MODE", "live")
    config = Settings(_env_file=None)
    assert config.llm_provider == "foundry"
    assert config.demo_mode == "live"
