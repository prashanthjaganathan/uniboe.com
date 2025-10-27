"""
Chat service package.

Exports the ChatService class and singleton getter function.
"""

from backend.core.services.chat.chat_service import (
    ChatService,
    get_chat_service,
    ConversationNotFoundError,
    UnauthorizedError,
    InvalidParticipantError,
)

__all__ = [
    "ChatService",
    "get_chat_service",
    "ConversationNotFoundError",
    "UnauthorizedError",
    "InvalidParticipantError",
]

