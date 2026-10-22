"""Model-provider factory for agents."""

from __future__ import annotations

from agent_framework.openai import OpenAIChatCompletionClient

from matchmind.config import settings


def build_chat_client(model: str | None = None) -> OpenAIChatCompletionClient:
    """Build a chat-completions client.

    DeepSeek's Responses API currently mishandles tool-call outputs in the
    Agent Framework adapter, so agents use Chat Completions, which is verified
    to work with MCP and function tools.
    """
    provider = settings.llm_provider.lower()
    if provider == "deepseek":
        if not settings.deepseek_api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is not configured")
        return OpenAIChatCompletionClient(
            model=model or settings.deepseek_model,
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
    if provider == "foundry":
        if not settings.foundry_project_endpoint or not settings.foundry_model:
            raise RuntimeError("FOUNDRY_PROJECT_ENDPOINT and FOUNDRY_MODEL are required")
        from agent_framework.foundry import FoundryChatClient

        return FoundryChatClient(
            project_endpoint=settings.foundry_project_endpoint,
            model=model or settings.foundry_model,
        )
    raise RuntimeError(f"unsupported LLM_PROVIDER: {settings.llm_provider}")
