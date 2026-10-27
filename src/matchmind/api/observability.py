"""Logging and optional Azure Monitor export for the API."""

from __future__ import annotations

import logging

from matchmind.config import settings


def configure_observability() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    if not settings.applicationinsights_connection_string:
        return
    from azure.monitor.opentelemetry import configure_azure_monitor

    configure_azure_monitor(
        connection_string=settings.applicationinsights_connection_string,
        logger_name="matchmind",
    )
