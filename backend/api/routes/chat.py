"""
Chat API routes.

Endpoints for managing conversations and encrypted messages.
"""

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.api.dependencies.auth import get_current_user
from backend.core.models.auth import UserResponse
from backend.core.models.chat import (
    ConversationCreate,
    ConversationListResponse,
    ConversationResponse,
    MarkReadRequest,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
)
from backend.core.services.chat import (
    ChatService,
    ConversationNotFoundError,
    InvalidParticipantError,
    UnauthorizedError,
    get_chat_service,
)

# Create router
router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or get conversation",
    description="Create a new conversation or get existing one between two users.",
)
async def create_or_get_conversation(
    conversation_data: ConversationCreate,
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> ConversationResponse:
    """
    Create a new conversation or get existing one.

    Conversations are bidirectional: if a conversation exists between User A and User B,
    it will be returned regardless of who initiates. Cannot create conversation with yourself.

    Args:
        conversation_data: Contains participant_id (the other user).
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        ConversationResponse: The conversation (existing or newly created).

    Raises:
        HTTPException 400: If trying to create conversation with self.
        HTTPException 401: Not authenticated.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/chat/conversations
        >>> {
        >>>   "participant_id": "456e7890-e89b-12d3-a456-426614174111"
        >>> }
    """
    user_id = current_user.id

    # Validate not messaging self
    if user_id == conversation_data.participant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create conversation with yourself",
        )

    try:
        conversation = await chat_service.get_or_create_conversation(
            user_id=user_id, participant_id=conversation_data.participant_id
        )
        return ConversationResponse(**conversation)

    except InvalidParticipantError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}",
        )


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's conversations",
    description="Get all conversations for the current user, ordered by most recent message.",
)
async def get_conversations(
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> ConversationListResponse:
    """
    Get all conversations for the current user.

    Includes last message preview, unread count, and other participant info.
    Ordered by most recent message first.

    Args:
        page: Page number (default 1).
        page_size: Items per page (default 20, max 100).
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        ConversationListResponse: Paginated list of conversations.

    Example:
        >>> GET /api/chat/conversations?page=1&page_size=20
    """
    try:
        conversations = await chat_service.get_user_conversations(
            user_id=current_user.id, page=page, page_size=page_size
        )
        return ConversationListResponse(
            conversations=[ConversationResponse(**conv) for conv in conversations["conversations"]],
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
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get conversation by ID",
    description="Get a single conversation with full details.",
)
async def get_conversation(
    conversation_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> ConversationResponse:
    """
    Get a single conversation by ID.

    User must be a participant in the conversation.

    Args:
        conversation_id: Conversation unique identifier.
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        ConversationResponse: The conversation with full details.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: User is not a participant in this conversation.
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/chat/conversations/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        conversation = await chat_service.get_conversation_by_id(
            conversation_id=conversation_id, user_id=current_user.id
        )
        return ConversationResponse(**conversation)

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation: {str(e)}",
        )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message",
    description="Send a message in a conversation. Message will be encrypted.",
)
async def send_message(
    conversation_id: UUID,
    message_data: MessageCreate,
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> MessageResponse:
    """
    Send a message in a conversation.

    Message content is automatically encrypted before storage.
    User must be a participant in the conversation.

    Args:
        conversation_id: Conversation unique identifier.
        message_data: Message content.
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        MessageResponse: The sent message with decrypted content.

    Raises:
        HTTPException 400: Invalid message data.
        HTTPException 401: Not authenticated.
        HTTPException 403: User is not a participant in this conversation.
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/chat/conversations/123e4567-e89b-12d3-a456-426614174000/messages
        >>> {
        >>>   "content": "Hey! Is your listing still available?"
        >>> }
    """
    try:
        message = await chat_service.send_message(
            conversation_id=conversation_id, sender_id=current_user.id, message_data=message_data
        )
        return MessageResponse(**message)

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}",
        )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessageListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get conversation messages",
    description="Get all messages in a conversation, ordered newest first.",
)
async def get_messages(
    conversation_id: UUID,
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(50, ge=1, le=100, description="Messages per page (max 100)"),
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> MessageListResponse:
    """
    Get messages for a conversation.

    Messages are ordered newest first (DESC) for infinite scroll.
    All messages are automatically decrypted. User must be a participant.

    Args:
        conversation_id: Conversation unique identifier.
        page: Page number (default 1).
        page_size: Messages per page (default 50, max 100).
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        MessageListResponse: Paginated list of messages with decrypted content.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: User is not a participant in this conversation.
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/chat/conversations/123e4567-e89b-12d3-a456-426614174000/messages?page=1
    """
    try:
        messages = await chat_service.get_conversation_messages(
            conversation_id=conversation_id, user_id=current_user.id, page=page, page_size=page_size
        )
        return MessageListResponse(
            messages=[MessageResponse(**msg) for msg in messages["messages"]],
            total=messages["total"],
            page=messages["page"],
            page_size=messages["page_size"],
            has_more=messages["has_more"],
        )

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch messages: {str(e)}",
        )


@router.post(
    "/messages/mark-read",
    status_code=status.HTTP_200_OK,
    summary="Mark messages as read",
    description="Mark multiple messages as read.",
)
async def mark_messages_read(
    mark_read_data: MarkReadRequest,
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> dict:
    """
    Mark multiple messages as read.

    Only marks messages where the current user is the recipient (not sender).

    Args:
        mark_read_data: Contains list of message IDs to mark as read.
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        dict: Count of messages marked and success message.

    Example:
        >>> POST /api/chat/messages/mark-read
        >>> {
        >>>   "message_ids": [
        >>>     "123e4567-e89b-12d3-a456-426614174000",
        >>>     "456e7890-e89b-12d3-a456-426614174111"
        >>>   ]
        >>> }

        Response:
        {
          "count": 2,
          "message": "Successfully marked 2 messages as read"
        }
    """
    try:
        count = await chat_service.mark_messages_as_read(
            user_id=current_user.id, message_ids=mark_read_data.message_ids
        )
        return {
            "count": count,
            "message": f"Successfully marked {count} message{'s' if count != 1 else ''} as read",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark messages as read: {str(e)}",
        )


@router.post(
    "/conversations/{conversation_id}/mark-read",
    status_code=status.HTTP_200_OK,
    summary="Mark conversation as read",
    description="Mark all messages in a conversation as read.",
)
async def mark_conversation_read(
    conversation_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> dict:
    """
    Mark all messages in a conversation as read.

    Only marks messages where the current user is the recipient.
    User must be a participant in the conversation.

    Args:
        conversation_id: Conversation unique identifier.
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        dict: Count of messages marked and success message.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: User is not a participant in this conversation.
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/chat/conversations/123e4567-e89b-12d3-a456-426614174000/mark-read

        Response:
        {
          "count": 5,
          "message": "Successfully marked 5 messages as read"
        }
    """
    try:
        count = await chat_service.mark_conversation_as_read(
            conversation_id=conversation_id, user_id=current_user.id
        )
        return {
            "count": count,
            "message": f"Successfully marked {count} message{'s' if count != 1 else ''} as read",
        }

    except ConversationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark conversation as read: {str(e)}",
        )


@router.get(
    "/unread-count",
    status_code=status.HTTP_200_OK,
    summary="Get unread message count",
    description="Get total unread message count across all conversations.",
)
async def get_unread_count(
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> dict:
    """
    Get total unread message count across all conversations.

    Only counts messages where the current user is the recipient.

    Args:
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        dict: Total unread message count.

    Example:
        >>> GET /api/chat/unread-count

        Response:
        {
          "unread_count": 12
        }
    """
    try:
        unread_count = await chat_service.get_unread_count(user_id=current_user.id)
        return {"unread_count": unread_count}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get unread count: {str(e)}",
        )


@router.get(
    "/search",
    response_model=List[MessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Search messages",
    description="Search messages in user's conversations.",
)
async def search_messages(
    q: str = Query(..., min_length=1, description="Search query"),
    conversation_id: UUID = Query(None, description="Optional conversation ID to search within"),
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> List[MessageResponse]:
    """
    Search messages in user's conversations.

    Searches decrypted message content (case-insensitive).
    Can search across all conversations or within a specific conversation.

    Args:
        q: Search query string (required).
        conversation_id: Optional conversation ID to search within.
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Returns:
        List[MessageResponse]: Matching messages, ordered by most recent first.

    Example:
        >>> GET /api/chat/search?q=apartment
        >>> GET /api/chat/search?q=apartment&conversation_id=123e4567-e89b-12d3-a456-426614174000
    """
    try:
        messages = await chat_service.search_messages(
            user_id=current_user.id, query=q, conversation_id=conversation_id
        )
        return [MessageResponse(**msg) for msg in messages]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search messages: {str(e)}",
        )


@router.get(
    "/users/search",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Quick user search for chat",
    description="""Quick search for users by name to start a conversation.
    Optimized for autocomplete.""",
)
async def search_users_for_chat(
    q: str = Query(..., min_length=1, max_length=100, description="Search query (user name)"),
    limit: int = Query(10, ge=1, le=50, description="Max results to return (default 10, max 50)"),
    current_user: UserResponse = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """
    Quick search for users by name to start conversations.

    Optimized for autocomplete/typeahead functionality.
    Searches by full name (case-insensitive).
    Excludes the current user from results.

    Args:
        q: Search query string (min 1 character).
        limit: Maximum number of results (default 10, max 50).
        current_user: Authenticated user.

    Returns:
        List[Dict]: List of matching users with basic info (id, name, university, profile picture).

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/chat/users/search?q=john&limit=10

        Response:
        [
          {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "full_name": "John Doe",
            "university_name": "New York University",
            "profile_picture_url": "https://example.com/pic.jpg",
            "university_email": "john.doe@nyu.edu"
          }
        ]
    """
    try:
        from backend.db import supabase

        # Search users by name (case-insensitive)
        # Join profiles with universities table using university_id
        response = (
            supabase.table("profiles")
            .select(
                """id, full_name, profile_picture_url, university_email, university_id,
                universities!profiles_university_id_fkey(name)"""
            )
            .ilike("full_name", f"%{q}%")
            .neq("id", str(current_user.id))  # Exclude current user
            .order("full_name")
            .limit(limit)
            .execute()
        )

        # Transform results to simple format
        users = []
        for profile in response.data:
            user_data = {
                "id": profile["id"],
                "full_name": profile["full_name"],
                "university_name": (
                    profile["universities"]["name"] if profile.get("universities") else None
                ),
                "profile_picture_url": profile.get("profile_picture_url"),
                "university_email": profile.get("university_email"),
            }
            users.append(user_data)

        return users

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search users: {str(e)}",
        )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation",
    description="Delete a conversation and all its messages.",
)
async def delete_conversation(
    conversation_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    """
    Delete a conversation and all its messages.

    User must be a participant in the conversation.
    This action cannot be undone.

    Args:
        conversation_id: Conversation unique identifier.
        current_user: Authenticated user.
        chat_service: Chat service dependency.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: User is not a participant in this conversation.
        HTTPException 404: Conversation not found.
        HTTPException 500: Server error.

    Example:
        >>> DELETE /api/chat/conversations/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        await chat_service.delete_conversation(
            conversation_id=conversation_id, user_id=current_user.id
        )
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
