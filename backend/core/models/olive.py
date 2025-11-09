"""
Olive AI Assistant data models.

Pydantic models for Olive AI chatbot conversations and messages.
"""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# Type for message role
MessageRole = Literal["user", "assistant"]


class OliveMessageCreate(BaseModel):
    """
    Olive message creation request model.

    Used to create new messages in Olive conversations.
    """

    content: str = Field(..., min_length=1, max_length=10000, description="Message content")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate content is not just whitespace."""
        if not v.strip():
            raise ValueError("Message content cannot be empty or just whitespace")
        return v.strip()

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"content": "What are student housing rights in New York?"}}


class OliveMessageResponse(BaseModel):
    """
    Olive message response model.

    Represents a single message in an Olive conversation.
    """

    id: UUID = Field(..., description="Message unique identifier")
    conversation_id: UUID = Field(..., description="Conversation ID")
    role: MessageRole = Field(..., description="Message role (user or assistant)")
    content: str = Field(..., description="Message content")
    created_at: datetime = Field(..., description="Message creation timestamp")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                "role": "user",
                "content": "What are student housing rights in New York?",
                "created_at": "2024-01-01T12:00:00Z",
            }
        }


class OliveConversationCreate(BaseModel):
    """
    Olive conversation creation request model.

    Used to create new Olive AI conversations.
    """

    title: Optional[str] = Field(
        None,
        max_length=200,
        description="Conversation title (auto-generated from first message if not provided)",
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate title is not just whitespace."""
        if v is not None and v.strip():
            return v.strip()
        return None

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"title": "Housing Rights Discussion"}}


class OliveConversationResponse(BaseModel):
    """
    Olive conversation response model.

    Represents a conversation in list views.
    """

    id: UUID = Field(..., description="Conversation unique identifier")
    user_id: UUID = Field(..., description="User ID who owns this conversation")
    title: Optional[str] = Field(None, description="Conversation title")
    created_at: datetime = Field(..., description="Conversation creation timestamp")
    message_count: int = Field(default=0, ge=0, description="Number of messages")
    last_message_at: Optional[datetime] = Field(None, description="Timestamp of last message")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "456e7890-e89b-12d3-a456-426614174111",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Housing Rights Discussion",
                "created_at": "2024-01-01T12:00:00Z",
                "message_count": 4,
                "last_message_at": "2024-01-01T12:05:00Z",
            }
        }


class OliveConversationListResponse(BaseModel):
    """
    Paginated Olive conversation list response model.

    Used for listing user's Olive conversations.
    """

    conversations: List[OliveConversationResponse] = Field(..., description="List of conversations")
    total: int = Field(..., ge=0, description="Total number of conversations")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Items per page")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "conversations": [
                    {
                        "id": "456e7890-e89b-12d3-a456-426614174111",
                        "user_id": "123e4567-e89b-12d3-a456-426614174000",
                        "title": "Housing Rights",
                        "created_at": "2024-01-01T12:00:00Z",
                        "message_count": 4,
                        "last_message_at": "2024-01-01T12:05:00Z",
                    }
                ],
                "total": 10,
                "page": 1,
                "page_size": 20,
            }
        }


class OliveConversationDetailResponse(BaseModel):
    """
    Detailed Olive conversation response model.

    Includes full conversation with all messages.
    """

    id: UUID = Field(..., description="Conversation unique identifier")
    user_id: UUID = Field(..., description="User ID who owns this conversation")
    title: Optional[str] = Field(None, description="Conversation title")
    created_at: datetime = Field(..., description="Conversation creation timestamp")
    messages: List[OliveMessageResponse] = Field(
        ..., description="All messages in the conversation"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "456e7890-e89b-12d3-a456-426614174111",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Housing Rights Discussion",
                "created_at": "2024-01-01T12:00:00Z",
                "messages": [
                    {
                        "id": "111e4567-e89b-12d3-a456-426614174000",
                        "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                        "role": "user",
                        "content": "What are student housing rights?",
                        "created_at": "2024-01-01T12:00:00Z",
                    },
                    {
                        "id": "222e4567-e89b-12d3-a456-426614174000",
                        "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                        "role": "assistant",
                        "content": "Student housing rights include...",
                        "created_at": "2024-01-01T12:00:01Z",
                    },
                ],
            }
        }


class OliveChatRequest(BaseModel):
    """
    Olive chat request model.

    Used to send messages to Olive AI and get responses.
    """

    message: str = Field(..., min_length=1, max_length=10000, description="User's message to Olive")
    conversation_id: Optional[UUID] = Field(
        None, description="Conversation ID (if None, creates new conversation)"
    )
    system_prompt: Optional[str] = Field(
        None, max_length=5000, description="Custom system prompt (optional)"
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate message is not just whitespace."""
        if not v.strip():
            raise ValueError("Message cannot be empty or just whitespace")
        return v.strip()

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt(cls, v: Optional[str]) -> Optional[str]:
        """Validate system prompt is not just whitespace."""
        if v is not None and v.strip():
            return v.strip()
        return None

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "message": "What are student housing rights in New York?",
                "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                "system_prompt": None,
            }
        }


class OliveChatResponse(BaseModel):
    """
    Olive chat response model.

    Contains both user message and AI assistant response.
    """

    conversation_id: UUID = Field(..., description="Conversation ID")
    user_message: OliveMessageResponse = Field(..., description="The user's message")
    assistant_message: OliveMessageResponse = Field(
        ..., description="Olive's AI-generated response"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                "user_message": {
                    "id": "111e4567-e89b-12d3-a456-426614174000",
                    "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                    "role": "user",
                    "content": "What are student housing rights in New York?",
                    "created_at": "2024-01-01T12:00:00Z",
                },
                "assistant_message": {
                    "id": "222e4567-e89b-12d3-a456-426614174000",
                    "conversation_id": "456e7890-e89b-12d3-a456-426614174111",
                    "role": "assistant",
                    "content": "In New York, student housing rights include...",
                    "created_at": "2024-01-01T12:00:01Z",
                },
            }
        }


class OliveConversationUpdateRequest(BaseModel):
    """
    Olive conversation update request model.

    Used to update conversation details like title.
    """

    title: Optional[str] = Field(None, max_length=200, description="Updated conversation title")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate title is not just whitespace."""
        if v is not None and v.strip():
            return v.strip()
        return None

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"title": "Updated Housing Rights Discussion"}}
