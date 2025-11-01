"""
Chat service package.

Exports the ChatService class and singleton getter function.
"""

from backend.core.services.chat.chat_service import (
    ChatService,
    ConversationNotFoundError,
    InvalidParticipantError,
    UnauthorizedError,
    get_chat_service,
)

__all__ = [
    "ChatService",
    "get_chat_service",
    "ConversationNotFoundError",
    "UnauthorizedError",
    "InvalidParticipantError",
]
