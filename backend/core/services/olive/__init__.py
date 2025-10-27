"""
Olive AI service package.

Exports the OliveService class and singleton getter function.
"""

from backend.core.services.olive.olive_service import (
    OliveService,
    get_olive_service,
    ConversationNotFoundError,
    UnauthorizedError,
    GroqAPIError,
)

__all__ = [
    "OliveService",
    "get_olive_service",
    "ConversationNotFoundError",
    "UnauthorizedError",
    "GroqAPIError",
]

