"""
Olive AI service layer.

Handles conversations with Groq LLM for the Olive AI assistant.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from groq import Groq

from backend.config import settings
from backend.db import supabase


class ConversationNotFoundError(Exception):
    """Raised when a conversation is not found."""


class UnauthorizedError(Exception):
    """Raised when a user is not authorized to access a conversation."""


class GroqAPIError(Exception):
    """Raised when Groq API call fails."""


class OliveService:
    """
    Service for managing Olive AI conversations and interactions.
    """

    def __init__(self):
        """Initialize Olive service with Groq client and default prompt."""
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.default_system_prompt = r"""
        You are Olive, an AI assistant for Uniboe - a student life platform.

        You help students with:
        - Student housing rights and laws
        - University life questions
        - General queries about student life
        - Finding roommates and apartments
        - Campus resources
        - Social events and activities

        Be helpful, friendly, and concise. Provide accurate information about
        student rights and regulations. If you're unsure about specific laws
        or regulations, advise students to check with official sources.

        Keep responses informative but not too lengthy.
        """

    async def chat(
        self,
        user_id: UUID,
        message: str,
        conversation_id: Optional[UUID] = None,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send message to Olive AI and get response.

        Creates new conversation if conversation_id is None.
        Saves both user and assistant messages to database.
        Retrieves conversation history for context.

        Args:
            user_id: The user's ID.
            message: The user's message.
            conversation_id: Optional conversation ID (creates new if None).
            system_prompt: Optional custom system prompt.

        Returns:
            A dictionary containing conversation_id, user_message, and assistant_message.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user doesn't own the conversation.
            GroqAPIError: If Groq API call fails.
            Exception: For other errors.
        """
        try:
            # Step 1: Get or create conversation
            if conversation_id is None:
                # Create new conversation
                conv_response = (
                    supabase.table("olive_conversations")
                    .insert({"user_id": str(user_id)})
                    .execute()
                )

                if not conv_response.data:
                    raise Exception("Failed to create conversation")

                conversation = conv_response.data[0]
                conversation_id = UUID(conversation["id"])
                is_new_conversation = True
            else:
                # Verify conversation exists and belongs to user
                conv_check = (
                    supabase.table("olive_conversations")
                    .select("*")
                    .eq("id", str(conversation_id))
                    .eq("user_id", str(user_id))
                    .execute()
                )

                if not conv_check.data:
                    raise UnauthorizedError("Conversation not found or unauthorized")

                is_new_conversation = False

            # Step 2: Save user message
            user_msg_response = (
                supabase.table("olive_messages")
                .insert(
                    {"conversation_id": str(conversation_id), "role": "user", "content": message}
                )
                .execute()
            )

            if not user_msg_response.data:
                raise Exception("Failed to save user message")

            user_message = user_msg_response.data[0]

            # Step 3: Get conversation history (last 10 messages for context)
            history_response = (
                supabase.table("olive_messages")
                .select("role, content")
                .eq("conversation_id", str(conversation_id))
                .order("created_at", desc=False)
                .limit(10)
                .execute()
            )

            # Step 4: Build messages for Groq
            messages = [{"role": "system", "content": system_prompt or self.default_system_prompt}]

            # Add history (excluding the just-added user message to avoid duplication)
            for msg in history_response.data[:-1]:  # Exclude last message (just added)
                messages.append({"role": msg["role"], "content": msg["content"]})

            # Add the current message
            messages.append({"role": "user", "content": message})

            # Step 5: Call Groq API
            assistant_response = await self._call_groq_api(messages)

            # Step 6: Save assistant message
            assistant_msg_response = (
                supabase.table("olive_messages")
                .insert(
                    {
                        "conversation_id": str(conversation_id),
                        "role": "assistant",
                        "content": assistant_response,
                    }
                )
                .execute()
            )

            if not assistant_msg_response.data:
                raise Exception("Failed to save assistant message")

            assistant_message = assistant_msg_response.data[0]

            # Step 7: Generate and save title for new conversations
            if is_new_conversation:
                title = await self._generate_title_from_message(message)
                supabase.table("olive_conversations").update({"title": title}).eq(
                    "id", str(conversation_id)
                ).execute()

            # Step 8: Return both messages
            return {
                "conversation_id": conversation_id,
                "user_message": user_message,
                "assistant_message": assistant_message,
            }

        except (ConversationNotFoundError, UnauthorizedError, GroqAPIError):
            raise
        except Exception as e:
            raise Exception(f"Chat error: {str(e)}")

    async def create_conversation(
        self, user_id: UUID, title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new Olive conversation.

        Args:
            user_id: The user's ID.
            title: Optional conversation title.

        Returns:
            A dictionary representing the created conversation.

        Raises:
            Exception: For database errors.
        """
        try:
            conv_data = {"user_id": str(user_id)}
            if title:
                conv_data["title"] = title

            response = supabase.table("olive_conversations").insert(conv_data).execute()

            if not response.data:
                raise Exception("Failed to create conversation")

            conversation = response.data[0]

            return {
                "id": UUID(conversation["id"]),
                "user_id": UUID(conversation["user_id"]),
                "title": conversation.get("title"),
                "created_at": datetime.fromisoformat(conversation["created_at"]),
                "message_count": 0,
                "last_message_at": None,
            }

        except Exception as e:
            raise Exception(f"Error creating conversation: {str(e)}")

    async def get_conversation(self, conversation_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Get conversation with all messages.

        Args:
            conversation_id: The conversation ID.
            user_id: The user's ID (for authorization).

        Returns:
            A dictionary containing conversation details and messages.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user doesn't own the conversation.
            Exception: For other database errors.
        """
        try:
            # Get conversation
            conv_response = (
                supabase.table("olive_conversations")
                .select("*")
                .eq("id", str(conversation_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(f"Conversation with ID {conversation_id} not found")

            conversation = conv_response.data[0]

            # Verify ownership
            if UUID(conversation["user_id"]) != user_id:
                raise UnauthorizedError("You don't have access to this conversation")

            # Get messages (ordered by created_at ASC - oldest first)
            messages_response = (
                supabase.table("olive_messages")
                .select("*")
                .eq("conversation_id", str(conversation_id))
                .order("created_at", desc=False)
                .execute()
            )

            messages = []
            for msg in messages_response.data:
                messages.append(
                    {
                        "id": UUID(msg["id"]),
                        "conversation_id": UUID(msg["conversation_id"]),
                        "role": msg["role"],
                        "content": msg["content"],
                        "created_at": datetime.fromisoformat(msg["created_at"]),
                    }
                )

            return {
                "id": UUID(conversation["id"]),
                "user_id": UUID(conversation["user_id"]),
                "title": conversation.get("title"),
                "created_at": datetime.fromisoformat(conversation["created_at"]),
                "messages": messages,
            }

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error fetching conversation: {str(e)}")

    async def get_user_conversations(
        self, user_id: UUID, page: int = 1, page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Get all conversations for a user.

        Args:
            user_id: The user's ID.
            page: Page number (1-indexed).
            page_size: Items per page.

        Returns:
            A dictionary containing paginated conversations.

        Raises:
            Exception: For database errors.
        """
        try:
            offset = (page - 1) * page_size

            # Get conversations
            conv_query = (
                supabase.table("olive_conversations")
                .select("*")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
            )

            # Get total count
            count_response = conv_query.execute()
            total_count = len(count_response.data) if count_response.data else 0

            # Apply pagination
            conv_response = conv_query.range(offset, offset + page_size - 1).execute()

            conversations = []
            for conv in conv_response.data:
                conv_id = conv["id"]

                # Get message count for this conversation
                msg_count_response = (
                    supabase.table("olive_messages")
                    .select("id", count="exact")
                    .eq("conversation_id", conv_id)
                    .execute()
                )

                message_count = msg_count_response.count if msg_count_response.count else 0

                # Get last message timestamp
                last_msg_response = (
                    supabase.table("olive_messages")
                    .select("created_at")
                    .eq("conversation_id", conv_id)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )

                last_message_at = None
                if last_msg_response.data:
                    last_message_at = datetime.fromisoformat(
                        last_msg_response.data[0]["created_at"]
                    )

                conversations.append(
                    {
                        "id": UUID(conv["id"]),
                        "user_id": UUID(conv["user_id"]),
                        "title": conv.get("title"),
                        "created_at": datetime.fromisoformat(conv["created_at"]),
                        "message_count": message_count,
                        "last_message_at": last_message_at,
                    }
                )

            return {
                "conversations": conversations,
                "total": total_count,
                "page": page,
                "page_size": page_size,
            }

        except Exception as e:
            raise Exception(f"Error fetching conversations: {str(e)}")

    async def update_conversation_title(
        self, conversation_id: UUID, user_id: UUID, title: str
    ) -> Dict[str, Any]:
        """
        Update conversation title.

        Args:
            conversation_id: The conversation ID.
            user_id: The user's ID (for authorization).
            title: The new title.

        Returns:
            A dictionary representing the updated conversation.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user doesn't own the conversation.
            Exception: For other database errors.
        """
        try:
            # Verify conversation exists and belongs to user
            conv_response = (
                supabase.table("olive_conversations")
                .select("*")
                .eq("id", str(conversation_id))
                .eq("user_id", str(user_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(
                    f"Conversation with ID {conversation_id} not found or unauthorized"
                )

            # Update title
            _ = (
                supabase.table("olive_conversations")
                .update({"title": title})
                .eq("id", str(conversation_id))
                .execute()
            )

            # Fetch the updated conversation to ensure we have the latest data
            conv_response = (
                supabase.table("olive_conversations")
                .select("*")
                .eq("id", str(conversation_id))
                .execute()
            )

            if not conv_response.data:
                raise Exception("Failed to fetch updated conversation")

            conversation = conv_response.data[0]

            # Get message count
            msg_count_response = (
                supabase.table("olive_messages")
                .select("id", count="exact")
                .eq("conversation_id", str(conversation_id))
                .execute()
            )

            message_count = msg_count_response.count if msg_count_response.count else 0

            # Get last message timestamp
            last_msg_response = (
                supabase.table("olive_messages")
                .select("created_at")
                .eq("conversation_id", str(conversation_id))
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            last_message_at = None
            if last_msg_response.data:
                last_message_at = datetime.fromisoformat(last_msg_response.data[0]["created_at"])

            return {
                "id": UUID(conversation["id"]),
                "user_id": UUID(conversation["user_id"]),
                "title": conversation.get("title"),
                "created_at": datetime.fromisoformat(conversation["created_at"]),
                "message_count": message_count,
                "last_message_at": last_message_at,
            }

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error updating conversation title: {str(e)}")

    async def delete_conversation(self, conversation_id: UUID, user_id: UUID) -> bool:
        """
        Delete conversation.

        CASCADE will automatically delete all messages.

        Args:
            conversation_id: The conversation ID.
            user_id: The user's ID (for authorization).

        Returns:
            True if successful.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user doesn't own the conversation.
            Exception: For other database errors.
        """
        try:
            # Verify conversation exists and belongs to user
            conv_response = (
                supabase.table("olive_conversations")
                .select("*")
                .eq("id", str(conversation_id))
                .eq("user_id", str(user_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(
                    f"Conversation with ID {conversation_id} not found or unauthorized"
                )

            # Delete conversation (messages will be deleted by CASCADE)
            delete_response = (
                supabase.table("olive_conversations")
                .delete()
                .eq("id", str(conversation_id))
                .execute()
            )

            if not delete_response.data:
                raise Exception("Failed to delete conversation")

            return True

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error deleting conversation: {str(e)}")

    async def _generate_title_from_message(self, message: str) -> str:
        """
        Generate conversation title from first message.

        Uses simple truncation for now. Could be enhanced to use Groq for summarization.

        Args:
            message: The first message in the conversation.

        Returns:
            A short title string.
        """
        # Simple approach: use first 50 chars
        if len(message) <= 50:
            return message
        return message[:47] + "..."

    async def _call_groq_api(
        self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 2000
    ) -> str:
        """
        Call Groq API to get AI response.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            temperature: Sampling temperature (0-2).
            max_tokens: Max tokens in response.

        Returns:
            The assistant's response text.

        Raises:
            GroqAPIError: If API call fails.
        """
        try:
            completion = self.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",  # or "llama-3.1-8b-instant" for faster
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=1,
                stream=False,
            )

            if not completion.choices:
                raise GroqAPIError("No response from Groq API")

            return completion.choices[0].message.content

        except Exception as e:
            raise GroqAPIError(f"Groq API error: {str(e)}")


# Global service instance
_olive_service_instance: Optional[OliveService] = None


def get_olive_service() -> OliveService:
    """
    Get or create the global OliveService instance.

    Returns:
        OliveService: The global service instance.
    """
    global _olive_service_instance
    if _olive_service_instance is None:
        _olive_service_instance = OliveService()
    return _olive_service_instance
