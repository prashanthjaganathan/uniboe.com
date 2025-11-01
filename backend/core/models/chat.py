"""
Chat and messaging data models.

Pydantic models for conversations, messages, and chat-related operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MessageCreate(BaseModel):
    """
    Message creation request model.

    Content must not be empty or just whitespace.
    """

    content: str = Field(..., min_length=1, max_length=5000, description="Message content")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate content is not just whitespace."""
        if not v.strip():
            raise ValueError("Message content cannot be empty or just whitespace")
        return v.strip()

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {"content": "Hey! I saw your housing listing. Is it still available?"}
        }


class MessageResponse(BaseModel):
    """
    Message response model for API responses.

    Contains message information with decrypted content and sender details.
    """

    id: UUID = Field(..., description="Message unique identifier")
    conversation_id: UUID = Field(..., description="Conversation ID this message belongs to")
    sender_id: UUID = Field(..., description="Sender's user ID")
    content_encrypted: str = Field(..., description="Encrypted message content (for storage)")
    content: str = Field(..., description="Decrypted message content (for display)")
    is_read: bool = Field(default=False, description="Whether message has been read")
    created_at: datetime = Field(..., description="Message creation timestamp")
    sender: Dict[str, Any] = Field(..., description="Sender user information")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                "sender_id": "789e0123-e89b-12d3-a456-426614174222",
                "content_encrypted": "encrypted_base64_string",
                "content": "Hello! Thanks for reaching out about the listing.",
                "is_read": True,
                "created_at": "2024-01-01T12:00:00Z",
                "sender": {
                    "id": "789e0123-e89b-12d3-a456-426614174222",
                    "full_name": "John Doe",
                    "profile_picture_url": "https://example.com/profile.jpg",
                },
            }
        }


class ConversationCreate(BaseModel):
    """
    Conversation creation request model.

    Used to start a new conversation with another user.
    """

    participant_id: UUID = Field(..., description="The other user's ID to start conversation with")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"participant_id": "456e7890-e89b-12d3-a456-426614174111"}}


class ConversationResponse(BaseModel):
    """
    Conversation response model for API responses.

    Contains conversation information including participant details, last message, and unread count.
    """

    id: UUID = Field(..., description="Conversation unique identifier")
    participant_1_id: UUID = Field(..., description="First participant's user ID")
    participant_2_id: UUID = Field(..., description="Second participant's user ID")
    last_message_at: datetime = Field(..., description="Timestamp of last message")
    created_at: datetime = Field(..., description="Conversation creation timestamp")
    other_participant: Dict[str, Any] = Field(
        ..., description="Other participant's user information (name, profile pic, university)"
    )
    last_message: Optional[MessageResponse] = Field(
        None, description="Most recent message in the conversation"
    )
    unread_count: int = Field(
        default=0, ge=0, description="Number of unread messages for current user"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "participant_1_id": "789e0123-e89b-12d3-a456-426614174222",
                "participant_2_id": "456e7890-e89b-12d3-a456-426614174111",
                "last_message_at": "2024-01-01T12:30:00Z",
                "created_at": "2024-01-01T10:00:00Z",
                "other_participant": {
                    "id": "456e7890-e89b-12d3-a456-426614174111",
                    "full_name": "Jane Smith",
                    "profile_picture_url": "https://example.com/jane.jpg",
                    "university_name": "New York University",
                },
                "last_message": {
                    "id": "abc12345-e89b-12d3-a456-426614174333",
                    "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
                    "sender_id": "456e7890-e89b-12d3-a456-426614174111",
                    "content": "Hey, how are you?",
                    "is_read": False,
                    "created_at": "2024-01-01T12:30:00Z",
                },
                "unread_count": 3,
            }
        }


class ConversationListResponse(BaseModel):
    """
    Paginated conversation list response model.

    Used for listing all conversations for a user.
    """

    conversations: List[ConversationResponse] = Field(..., description="List of conversations")
    total: int = Field(..., ge=0, description="Total number of conversations")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of conversations per page")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "conversations": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "participant_1_id": "789e0123-e89b-12d3-a456-426614174222",
                        "participant_2_id": "456e7890-e89b-12d3-a456-426614174111",
                        "last_message_at": "2024-01-01T12:30:00Z",
                        "unread_count": 2,
                    }
                ],
                "total": 15,
                "page": 1,
                "page_size": 20,
            }
        }


class MessageListResponse(BaseModel):
    """
    Paginated message list response model.

    Used for listing messages within a conversation.
    """

    messages: List[MessageResponse] = Field(..., description="List of messages")
    total: int = Field(..., ge=0, description="Total number of messages")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of messages per page")
    has_more: bool = Field(..., description="Whether more messages are available")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "messages": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                        "sender_id": "789e0123-e89b-12d3-a456-426614174222",
                        "content": "Hello!",
                        "is_read": True,
                        "created_at": "2024-01-01T12:00:00Z",
                    }
                ],
                "total": 50,
                "page": 1,
                "page_size": 20,
                "has_more": True,
            }
        }


class MarkReadRequest(BaseModel):
    """
    Mark messages as read request model.

    Used to mark one or more messages as read.
    """

    message_ids: List[UUID] = Field(
        ..., min_length=1, description="List of message IDs to mark as read"
    )

    @field_validator("message_ids")
    @classmethod
    def validate_message_ids(cls, v: List[UUID]) -> List[UUID]:
        """Validate message_ids list is not empty."""
        if not v or len(v) == 0:
            raise ValueError("At least one message ID must be provided")
        return v

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "message_ids": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "456e7890-e89b-12d3-a456-426614174111",
                ]
            }
        }


class ChatSearchRequest(BaseModel):
    """
    Chat search request model.

    Used to search messages across all conversations or within a specific conversation.
    """

    query: str = Field(..., min_length=1, max_length=200, description="Search query string")
    conversation_id: Optional[UUID] = Field(
        None, description="Optional conversation ID to search within"
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate query is not just whitespace."""
        if not v.strip():
            raise ValueError("Search query cannot be empty or just whitespace")
        return v.strip()

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "query": "housing listing",
                "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
            }
        }


class EncryptionKey(BaseModel):
    """
    Encryption key model for message encryption.

    Contains the base64-encoded encryption key and creation timestamp.
    """

    key: str = Field(..., description="Base64 encoded encryption key")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Key creation timestamp"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "key": "base64_encoded_key_string_here",
                "created_at": "2024-01-01T10:00:00Z",
            }
        }


class MessageUpdateResponse(BaseModel):
    """
    Response model for message update operations (e.g., mark as read).

    Contains the updated message count and success status.
    """

    updated_count: int = Field(..., ge=0, description="Number of messages updated")
    message: str = Field(..., description="Success message")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {"updated_count": 3, "message": "Successfully marked 3 messages as read"}
        }


class ConversationDetailResponse(BaseModel):
    """
    Detailed conversation response model.

    Contains full conversation details including both participants.
    """

    id: UUID = Field(..., description="Conversation unique identifier")
    participant_1: Dict[str, Any] = Field(..., description="First participant's information")
    participant_2: Dict[str, Any] = Field(..., description="Second participant's information")
    last_message_at: datetime = Field(..., description="Timestamp of last message")
    created_at: datetime = Field(..., description="Conversation creation timestamp")
    total_messages: int = Field(default=0, ge=0, description="Total message count")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "participant_1": {
                    "id": "789e0123-e89b-12d3-a456-426614174222",
                    "full_name": "John Doe",
                    "profile_picture_url": "https://example.com/john.jpg",
                    "university_name": "NYU",
                },
                "participant_2": {
                    "id": "456e7890-e89b-12d3-a456-426614174111",
                    "full_name": "Jane Smith",
                    "profile_picture_url": "https://example.com/jane.jpg",
                    "university_name": "Columbia University",
                },
                "last_message_at": "2024-01-01T12:30:00Z",
                "created_at": "2024-01-01T10:00:00Z",
                "total_messages": 42,
            }
        }
