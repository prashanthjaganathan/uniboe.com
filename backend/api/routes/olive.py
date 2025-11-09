"""
Olive AI API routes.

Endpoints for chatting with Olive AI assistant and managing conversations.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.api.dependencies.auth import get_current_user
from backend.core.models.auth import UserResponse
from backend.core.models.olive import (
    OliveChatRequest,
    OliveChatResponse,
    OliveConversationCreate,
    OliveConversationDetailResponse,
    OliveConversationListResponse,
    OliveConversationResponse,
    OliveMessageResponse,
)
from backend.core.services.olive import (
    ConversationNotFoundError,
    GroqAPIError,
    OliveService,
    UnauthorizedError,
    get_olive_service,
)

# Create router
router = APIRouter(
    prefix="/olive",
    tags=["Olive AI"],
)


class TitleUpdateRequest(BaseModel):
    """Request model for updating conversation title."""

    title: str = Field(..., min_length=1, max_length=200, description="New conversation title")


@router.post(
    "/chat",
    response_model=OliveChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with Olive AI",
    description="Send a message to Olive AI assistant and get a response.",
)
async def chat_with_olive(
    chat_request: OliveChatRequest,
    current_user: UserResponse = Depends(get_current_user),
    olive_service: OliveService = Depends(get_olive_service),
) -> OliveChatResponse:
    """
    Chat with Olive AI assistant.

    If conversation_id is not provided, a new conversation will be created.
    The assistant provides help with:
    - Student housing rights and laws
    - University life questions
    - Finding roommates and apartments
    - Campus resources
    - General student queries

    Args:
        chat_request: Chat request with message and optional conversation_id.
        current_user: Authenticated user.
        olive_service: Olive service dependency.

    Returns:
        OliveChatResponse: Both user message and AI response.

    Raises:
        HTTPException 400: Invalid request data.
        HTTPException 401: Not authenticated.
        HTTPException 403: Not authorized for this conversation.
        HTTPException 503: AI service unavailable.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/olive/chat
        >>> Authorization: Bearer <token>
        >>> {
        >>>   "message": "What are student housing rights in New York?",
        >>>   "conversation_id": null
        >>> }
    """
    try:
        user_id = current_user.id

        result = await olive_service.chat(
            user_id=user_id,
            message=chat_request.message,
            conversation_id=chat_request.conversation_id,
            system_prompt=chat_request.system_prompt,
        )

        return OliveChatResponse(
            conversation_id=result["conversation_id"],
            user_message=OliveMessageResponse(**result["user_message"]),
            assistant_message=OliveMessageResponse(**result["assistant_message"]),
        )

    except GroqAPIError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again in a moment.",
        )
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        error_msg = str(e).lower()
        if "rate limit" in error_msg or "api" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service temporarily unavailable due to high demand.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat request: {str(e)}",
        )


@router.post(
    "/conversations",
    response_model=OliveConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new conversation",
    description="Create a new Olive AI conversation.",
)
async def create_conversation(
    conversation_data: OliveConversationCreate,
    current_user: UserResponse = Depends(get_current_user),
    olive_service: OliveService = Depends(get_olive_service),
) -> OliveConversationResponse:
    """
    Create a new Olive AI conversation.

    Title is optional and can be auto-generated from the first message.

    Args:
        conversation_data: Conversation creation data.
        current_user: Authenticated user.
        olive_service: Olive service dependency.

    Returns:
        OliveConversationResponse: Created conversation.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/olive/conversations
        >>> Authorization: Bearer <token>
        >>> {
        >>>   "title": "Housing Rights Discussion"
        >>> }
    """
    try:
        user_id = current_user.id

        conversation = await olive_service.create_conversation(
            user_id=user_id, title=conversation_data.title
        )

        return OliveConversationResponse(**conversation)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}",
        )


@router.get(
    "/conversations",
    response_model=OliveConversationListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's conversations",
    description="Get all Olive AI conversations for the current user.",
)
async def get_conversations(
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: UserResponse = Depends(get_current_user),
    olive_service: OliveService = Depends(get_olive_service),
) -> OliveConversationListResponse:
    """
    Get all Olive AI conversations for the current user.

    Conversations are ordered by most recent first.
    Includes message count and last message timestamp.

    Args:
        page: Page number (default 1).
        page_size: Items per page (default 20, max 100).
        current_user: Authenticated user.
        olive_service: Olive service dependency.

    Returns:
        OliveConversationListResponse: Paginated list of conversations.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/olive/conversations?page=1&page_size=20
        >>> Authorization: Bearer <token>
    """
    try:
        user_id = current_user.id

        conversations = await olive_service.get_user_conversations(
            user_id=user_id, page=page, page_size=page_size
        )

        return OliveConversationListResponse(
            conversations=[
                OliveConversationResponse(**conv) for conv in conversations["conversations"]
            ],
            total=conversations["total"],
            page=conversations["page"],
            page_size=conversations["page_size"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversations: {str(e)}",
        )


@router.get(
    "/conversations/{conversation_id}",
    response_model=OliveConversationDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get conversation details",
    description="Get a conversation with all its messages.",
)
async def get_conversation(
    conversation_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    olive_service: OliveService = Depends(get_olive_service),
) -> OliveConversationDetailResponse:
    """
    Get conversation with all messages.

    Messages are ordered chronologically (oldest first).
    User must own the conversation to access it.

    Args:
        conversation_id: Conversation unique identifier.
        current_user: Authenticated user.
        olive_service: Olive service dependency.

    Returns:
        OliveConversationDetailResponse: Conversation with all messages.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: Not authorized (not conversation owner).
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/olive/conversations/123e4567-e89b-12d3-a456-426614174000
        >>> Authorization: Bearer <token>
    """
    try:
        user_id = current_user.id

        conversation = await olive_service.get_conversation(
            conversation_id=conversation_id, user_id=user_id
        )

        return OliveConversationDetailResponse(**conversation)

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation: {str(e)}",
        )


@router.put(
    "/conversations/{conversation_id}/title",
    response_model=OliveConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update conversation title",
    description="Update the title of an Olive AI conversation.",
)
async def update_conversation_title(
    conversation_id: UUID,
    title_data: TitleUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    olive_service: OliveService = Depends(get_olive_service),
) -> OliveConversationResponse:
    """
    Update conversation title.

    User must own the conversation to update it.

    Args:
        conversation_id: Conversation unique identifier.
        title_data: New title data.
        current_user: Authenticated user.
        olive_service: Olive service dependency.

    Returns:
        OliveConversationResponse: Updated conversation.

    Raises:
        HTTPException 400: Invalid title data.
        HTTPException 401: Not authenticated.
        HTTPException 403: Not authorized (not conversation owner).
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> PUT /api/olive/conversations/123e4567-e89b-12d3-a456-426614174000/title
        >>> Authorization: Bearer <token>
        >>> {
        >>>   "title": "NYC Housing Rights"
        >>> }
    """
    try:
        user_id = current_user.id

        conversation = await olive_service.update_conversation_title(
            conversation_id=conversation_id, user_id=user_id, title=title_data.title
        )

        return OliveConversationResponse(**conversation)

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update conversation title: {str(e)}",
        )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation",
    description="Delete an Olive AI conversation and all its messages.",
)
async def delete_conversation(
    conversation_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    olive_service: OliveService = Depends(get_olive_service),
):
    """
    Delete conversation and all its messages.

    User must own the conversation to delete it.
    This action cannot be undone.

    Args:
        conversation_id: Conversation unique identifier.
        current_user: Authenticated user.
        olive_service: Olive service dependency.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: Not authorized (not conversation owner).
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> DELETE /api/olive/conversations/123e4567-e89b-12d3-a456-426614174000
        >>> Authorization: Bearer <token>
    """
    try:
        user_id = current_user.id

        await olive_service.delete_conversation(conversation_id=conversation_id, user_id=user_id)

        return None

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete conversation: {str(e)}",
        )
