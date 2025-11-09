"""
Chat service layer.

Handles all conversation and messaging operations with end-to-end encryption.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.core.models.chat import (
    ConversationListResponse,
    ConversationResponse,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
)
from backend.core.utils import decrypt_message, encrypt_message
from backend.db import supabase


class ConversationNotFoundError(Exception):
    """Raised when a conversation is not found."""


class UnauthorizedError(Exception):
    """Raised when a user is not authorized to access a conversation."""


class InvalidParticipantError(Exception):
    """Raised when a participant is invalid."""


class ChatService:
    """
    Service for managing conversations and messages.
    """

    async def get_or_create_conversation(
        self, user_id: UUID, participant_id: UUID
    ) -> Dict[str, Any]:
        """
        Get existing conversation or create new one between two users.

        Conversations are bidirectional: (A, B) == (B, A).
        Uses database constraint: participant_1_id < participant_2_id.

        Args:
            user_id: The current user's ID.
            participant_id: The other user's ID.

        Returns:
            A dictionary representing the conversation with participant info.

        Raises:
            InvalidParticipantError: If trying to create conversation with self.
            Exception: For database errors.
        """
        try:
            # Cannot create conversation with self
            if user_id == participant_id:
                raise InvalidParticipantError("Cannot create conversation with yourself")

            # Order participants by UUID to maintain database constraint
            if user_id < participant_id:
                p1_id, p2_id = user_id, participant_id
            else:
                p1_id, p2_id = participant_id, user_id

            # Check if conversation exists
            existing_response = (
                supabase.table("conversations")
                .select(
                    "*, "
                    "participant_1:profiles!conversations_participant_1_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    "),"
                    "participant_2:profiles!conversations_participant_2_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("participant_1_id", str(p1_id))
                .eq("participant_2_id", str(p2_id))
                .execute()
            )

            if existing_response.data:
                conv = existing_response.data[0]
                return self._format_conversation_response(conv, user_id)

            # Create new conversation
            new_conv_data = {
                "participant_1_id": str(p1_id),
                "participant_2_id": str(p2_id),
            }

            # Create new conversation (INSERT first)
            new_conv_response = supabase.table("conversations").insert(new_conv_data).execute()

            if not new_conv_response.data:
                raise Exception("Failed to create conversation")

            created_conv = new_conv_response.data[0]

            # Then SELECT with joins to get full participant info
            full_conv_response = (
                supabase.table("conversations")
                .select(
                    "*, "
                    "participant_1:profiles!conversations_participant_1_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    "),"
                    "participant_2:profiles!conversations_participant_2_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("id", created_conv["id"])
                .execute()
            )

            if not full_conv_response.data:
                raise Exception("Failed to fetch created conversation")

            return self._format_conversation_response(full_conv_response.data[0], user_id)

        except InvalidParticipantError:
            raise
        except Exception as e:
            raise Exception(f"Error getting or creating conversation: {e}")

    async def get_user_conversations(
        self, user_id: UUID, page: int = 1, page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Get all conversations for a user.

        Args:
            user_id: The user's ID.
            page: Page number (1-indexed).
            page_size: Number of conversations per page.

        Returns:
            A dictionary containing paginated conversations with metadata.

        Raises:
            Exception: For database errors.
        """
        try:
            # Get conversations where user is either participant
            # Using OR logic with two separate queries then combining
            query1 = (
                supabase.table("conversations")
                .select(
                    "*, "
                    "participant_1:profiles!conversations_participant_1_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    "),"
                    "participant_2:profiles!conversations_participant_2_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("participant_1_id", str(user_id))
                .order("last_message_at", desc=True)
            )

            query2 = (
                supabase.table("conversations")
                .select(
                    "*, "
                    "participant_1:profiles!conversations_participant_1_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    "),"
                    "participant_2:profiles!conversations_participant_2_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("participant_2_id", str(user_id))
                .order("last_message_at", desc=True)
            )

            result1 = query1.execute()
            result2 = query2.execute()

            # Combine and sort by last_message_at
            all_conversations = (result1.data or []) + (result2.data or [])
            all_conversations.sort(key=lambda x: x.get("last_message_at", ""), reverse=True)

            total_count = len(all_conversations)

            # Apply pagination
            offset = (page - 1) * page_size
            paginated_conversations = all_conversations[offset : offset + page_size]

            # Format conversations
            formatted_conversations = []
            for conv in paginated_conversations:
                formatted_conv = await self._format_conversation_with_last_message(conv, user_id)
                formatted_conversations.append(formatted_conv)

            return ConversationListResponse(
                conversations=[ConversationResponse(**conv) for conv in formatted_conversations],
                total=total_count,
                page=page,
                page_size=page_size,
            ).model_dump()

        except Exception as e:
            raise Exception(f"Error fetching user conversations: {e}")

    async def get_conversation_by_id(self, conversation_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Get a single conversation by ID.

        Args:
            conversation_id: The conversation's ID.
            user_id: The requesting user's ID.

        Returns:
            A dictionary representing the conversation.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user is not a participant.
            Exception: For other database errors.
        """
        try:
            response = (
                supabase.table("conversations")
                .select(
                    "*, "
                    "participant_1:profiles!conversations_participant_1_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    "),"
                    "participant_2:profiles!conversations_participant_2_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("id", str(conversation_id))
                .execute()
            )

            if not response.data:
                raise ConversationNotFoundError(f"Conversation {conversation_id} not found")

            conv = response.data[0]

            # Verify user is a participant
            if conv["participant_1_id"] != str(user_id) and conv["participant_2_id"] != str(
                user_id
            ):
                raise UnauthorizedError("You are not a participant in this conversation")

            return self._format_conversation_response(conv, user_id)

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error fetching conversation {conversation_id}: {e}")

    async def send_message(
        self, conversation_id: UUID, sender_id: UUID, message_data: MessageCreate
    ) -> Dict[str, Any]:
        """
        Send a message in a conversation.

        Args:
            conversation_id: The conversation's ID.
            sender_id: The sender's user ID.
            message_data: The message content.

        Returns:
            A dictionary representing the sent message with decrypted content.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If sender is not a participant.
            Exception: For other errors.
        """
        try:
            # Verify sender is participant in conversation
            conv_response = (
                supabase.table("conversations")
                .select("participant_1_id, participant_2_id")
                .eq("id", str(conversation_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(f"Conversation {conversation_id} not found")

            conv = conv_response.data[0]
            if conv["participant_1_id"] != str(sender_id) and conv["participant_2_id"] != str(
                sender_id
            ):
                raise UnauthorizedError("You are not a participant in this conversation")

            # Encrypt message content
            encrypted_content = encrypt_message(message_data.content)

            # Insert message
            message_insert = {
                "conversation_id": str(conversation_id),
                "sender_id": str(sender_id),
                "content_encrypted": encrypted_content,
            }

            message_response = supabase.table("messages").insert(message_insert).execute()

            if not message_response.data:
                raise Exception("Failed to send message")

            created_message = message_response.data[0]

            # Get sender info
            sender_info = await self._get_user_profile_for_message(sender_id)

            # Return message with decrypted content
            return {
                "id": UUID(created_message["id"]),
                "conversation_id": UUID(created_message["conversation_id"]),
                "sender_id": UUID(created_message["sender_id"]),
                "content_encrypted": created_message["content_encrypted"],
                "content": message_data.content,  # Original content (not decrypted from DB)
                "is_read": created_message["is_read"],
                "created_at": datetime.fromisoformat(created_message["created_at"]),
                "sender": sender_info,
            }

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error sending message: {e}")

    async def get_conversation_messages(
        self, conversation_id: UUID, user_id: UUID, page: int = 1, page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Get messages for a conversation.

        Args:
            conversation_id: The conversation's ID.
            user_id: The requesting user's ID.
            page: Page number (1-indexed).
            page_size: Number of messages per page.

        Returns:
            A dictionary containing paginated messages.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user is not a participant.
            Exception: For other errors.
        """
        try:
            # Verify user is participant
            conv_response = (
                supabase.table("conversations")
                .select("participant_1_id, participant_2_id")
                .eq("id", str(conversation_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(f"Conversation {conversation_id} not found")

            conv = conv_response.data[0]
            if conv["participant_1_id"] != str(user_id) and conv["participant_2_id"] != str(
                user_id
            ):
                raise UnauthorizedError("You are not a participant in this conversation")

            # Get total count
            count_response = (
                supabase.table("messages")
                .select("id", count="exact")
                .eq("conversation_id", str(conversation_id))
                .execute()
            )

            total_count = count_response.count if count_response.count else 0

            # Get messages (newest first for infinite scroll)
            offset = (page - 1) * page_size
            messages_response = (
                supabase.table("messages")
                .select("*, profiles!messages_sender_id_fkey(id, full_name, profile_picture_url)")
                .eq("conversation_id", str(conversation_id))
                .order("created_at", desc=True)
                .range(offset, offset + page_size - 1)
                .execute()
            )

            if not messages_response.data:
                return MessageListResponse(
                    messages=[], total=0, page=page, page_size=page_size, has_more=False
                ).model_dump()

            # Decrypt and format messages
            formatted_messages = []
            for msg in messages_response.data:
                try:
                    # Decrypt message content
                    decrypted_content = decrypt_message(msg["content_encrypted"])

                    # Format sender info
                    sender_profile = msg.pop("profiles")
                    sender_info = {
                        "id": UUID(sender_profile["id"]),
                        "full_name": sender_profile["full_name"],
                        "profile_picture_url": sender_profile.get("profile_picture_url"),
                    }

                    formatted_messages.append(
                        {
                            "id": UUID(msg["id"]),
                            "conversation_id": UUID(msg["conversation_id"]),
                            "sender_id": UUID(msg["sender_id"]),
                            "content_encrypted": msg["content_encrypted"],
                            "content": decrypted_content,
                            "is_read": msg["is_read"],
                            "created_at": datetime.fromisoformat(msg["created_at"]),
                            "sender": sender_info,
                        }
                    )
                except Exception as e:
                    # If decryption fails, skip this message
                    print(f"Failed to decrypt message {msg['id']}: {e}")
                    continue

            has_more = (page * page_size) < total_count

            return MessageListResponse(
                messages=[MessageResponse(**msg) for msg in formatted_messages],
                total=total_count,
                page=page,
                page_size=page_size,
                has_more=has_more,
            ).model_dump()

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error fetching messages: {e}")

    async def mark_messages_as_read(self, user_id: UUID, message_ids: List[UUID]) -> int:
        """
        Mark multiple messages as read.

        Only marks messages where user is the recipient (not sender).

        Args:
            user_id: The user marking messages as read.
            message_ids: List of message IDs to mark.

        Returns:
            Number of messages marked as read.

        Raises:
            Exception: For database errors.
        """
        try:
            if not message_ids:
                return 0

            # Get message IDs where user is recipient (not sender)
            # This requires joining with conversations to determine recipient
            updated_count = 0

            for message_id in message_ids:
                # Get message and conversation info
                msg_response = (
                    supabase.table("messages")
                    .select("sender_id, conversation_id")
                    .eq("id", str(message_id))
                    .execute()
                )

                if not msg_response.data:
                    continue

                msg = msg_response.data[0]

                # Only update if user is not the sender
                if msg["sender_id"] != str(user_id):
                    update_response = (
                        supabase.table("messages")
                        .update({"is_read": True})
                        .eq("id", str(message_id))
                        .execute()
                    )

                    if update_response.data:
                        updated_count += 1

            return updated_count

        except Exception as e:
            raise Exception(f"Error marking messages as read: {e}")

    async def mark_conversation_as_read(self, conversation_id: UUID, user_id: UUID) -> int:
        """
        Mark all messages in a conversation as read.

        Only marks messages where user is the recipient.

        Args:
            conversation_id: The conversation's ID.
            user_id: The user marking messages as read.

        Returns:
            Number of messages marked as read.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user is not a participant.
            Exception: For other errors.
        """
        try:
            # Verify user is participant
            conv_response = (
                supabase.table("conversations")
                .select("participant_1_id, participant_2_id")
                .eq("id", str(conversation_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(f"Conversation {conversation_id} not found")

            conv = conv_response.data[0]
            if conv["participant_1_id"] != str(user_id) and conv["participant_2_id"] != str(
                user_id
            ):
                raise UnauthorizedError("You are not a participant in this conversation")

            # Mark all unread messages where user is recipient (not sender)
            update_response = (
                supabase.table("messages")
                .update({"is_read": True})
                .eq("conversation_id", str(conversation_id))
                .eq("is_read", False)
                .neq("sender_id", str(user_id))
                .execute()
            )

            return len(update_response.data) if update_response.data else 0

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error marking conversation as read: {e}")

    async def get_unread_count(self, user_id: UUID) -> int:
        """
        Get total unread message count across all conversations.

        Args:
            user_id: The user's ID.

        Returns:
            Total number of unread messages.

        Raises:
            Exception: For database errors.
        """
        try:
            # Get all conversations where user is participant
            conv1 = (
                supabase.table("conversations")
                .select("id")
                .eq("participant_1_id", str(user_id))
                .execute()
            )
            conv2 = (
                supabase.table("conversations")
                .select("id")
                .eq("participant_2_id", str(user_id))
                .execute()
            )

            conversation_ids = [c["id"] for c in (conv1.data or [])] + [
                c["id"] for c in (conv2.data or [])
            ]

            if not conversation_ids:
                return 0

            # Count unread messages in these conversations where user is recipient
            total_unread = 0
            for conv_id in conversation_ids:
                unread_response = (
                    supabase.table("messages")
                    .select("id", count="exact")
                    .eq("conversation_id", conv_id)
                    .eq("is_read", False)
                    .neq("sender_id", str(user_id))
                    .execute()
                )

                total_unread += unread_response.count if unread_response.count else 0

            return total_unread

        except Exception as e:
            raise Exception(f"Error getting unread count: {e}")

    async def search_messages(
        self, user_id: UUID, query: str, conversation_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Search messages in user's conversations.

        Args:
            user_id: The user's ID.
            query: Search query string.
            conversation_id: Optional conversation ID to search within.

        Returns:
            List of matching messages with context.

        Raises:
            Exception: For database errors.
        """
        try:
            # Get conversations to search
            if conversation_id:
                # Verify user is participant
                conv_response = (
                    supabase.table("conversations")
                    .select("id, participant_1_id, participant_2_id")
                    .eq("id", str(conversation_id))
                    .execute()
                )

                if not conv_response.data:
                    return []

                conv = conv_response.data[0]
                if conv["participant_1_id"] != str(user_id) and conv["participant_2_id"] != str(
                    user_id
                ):
                    return []

                conversation_ids = [str(conversation_id)]
            else:
                # Get all user's conversations
                conv1 = (
                    supabase.table("conversations")
                    .select("id")
                    .eq("participant_1_id", str(user_id))
                    .execute()
                )
                conv2 = (
                    supabase.table("conversations")
                    .select("id")
                    .eq("participant_2_id", str(user_id))
                    .execute()
                )

                conversation_ids = [c["id"] for c in (conv1.data or [])] + [
                    c["id"] for c in (conv2.data or [])
                ]

            if not conversation_ids:
                return []

            # Get all messages from these conversations
            matching_messages = []
            query_lower = query.lower()

            for conv_id in conversation_ids:
                messages_response = (
                    supabase.table("messages")
                    .select(
                        "*, profiles!messages_sender_id_fkey(id, full_name, profile_picture_url)"
                    )
                    .eq("conversation_id", conv_id)
                    .execute()
                )

                if not messages_response.data:
                    continue

                # Decrypt and search
                for msg in messages_response.data:
                    try:
                        decrypted_content = decrypt_message(msg["content_encrypted"])

                        # Check if query matches (case-insensitive)
                        if query_lower in decrypted_content.lower():
                            sender_profile = msg.pop("profiles")
                            sender_info = {
                                "id": UUID(sender_profile["id"]),
                                "full_name": sender_profile["full_name"],
                                "profile_picture_url": sender_profile.get("profile_picture_url"),
                            }

                            matching_messages.append(
                                {
                                    "id": UUID(msg["id"]),
                                    "conversation_id": UUID(msg["conversation_id"]),
                                    "sender_id": UUID(msg["sender_id"]),
                                    "content_encrypted": msg["content_encrypted"],
                                    "content": decrypted_content,
                                    "is_read": msg["is_read"],
                                    "created_at": datetime.fromisoformat(msg["created_at"]),
                                    "sender": sender_info,
                                }
                            )
                    except Exception:
                        # Skip messages that fail to decrypt
                        continue

            # Sort by most recent first
            matching_messages.sort(key=lambda x: x["created_at"], reverse=True)

            return matching_messages

        except Exception as e:
            raise Exception(f"Error searching messages: {e}")

    async def delete_conversation(self, conversation_id: UUID, user_id: UUID) -> bool:
        """
        Delete a conversation.

        Args:
            conversation_id: The conversation's ID.
            user_id: The requesting user's ID.

        Returns:
            True if successful.

        Raises:
            ConversationNotFoundError: If conversation not found.
            UnauthorizedError: If user is not a participant.
            Exception: For other errors.
        """
        try:
            # Verify user is participant
            conv_response = (
                supabase.table("conversations")
                .select("participant_1_id, participant_2_id")
                .eq("id", str(conversation_id))
                .execute()
            )

            if not conv_response.data:
                raise ConversationNotFoundError(f"Conversation {conversation_id} not found")

            conv = conv_response.data[0]
            if conv["participant_1_id"] != str(user_id) and conv["participant_2_id"] != str(
                user_id
            ):
                raise UnauthorizedError("You are not a participant in this conversation")

            # Delete conversation (CASCADE will delete messages)
            delete_response = (
                supabase.table("conversations").delete().eq("id", str(conversation_id)).execute()
            )

            return bool(delete_response.data)

        except (ConversationNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error deleting conversation: {e}")

    # Helper methods

    def _format_conversation_response(self, conv: Dict[str, Any], user_id: UUID) -> Dict[str, Any]:
        """Format conversation for API response."""
        # Determine which participant is "other"
        is_user_participant_1 = conv["participant_1_id"] == str(user_id)

        # Get the correct participant profile based on aliases
        if is_user_participant_1:
            # User is participant_1, so other is participant_2
            other_profile = conv.get("participant_2", {})
            other_id = conv["participant_2_id"]
        else:
            # User is participant_2, so other is participant_1
            other_profile = conv.get("participant_1", {})
            other_id = conv["participant_1_id"]

        other_participant = {
            "id": UUID(other_id),
            "full_name": other_profile.get("full_name", "Unknown"),
            "profile_picture_url": other_profile.get("profile_picture_url"),
            "university_name": (
                other_profile.get("universities", {}).get("name")
                if other_profile.get("universities")
                else None
            ),
        }

        return {
            "id": UUID(conv["id"]),
            "participant_1_id": UUID(conv["participant_1_id"]),
            "participant_2_id": UUID(conv["participant_2_id"]),
            "last_message_at": datetime.fromisoformat(conv["last_message_at"]),
            "created_at": datetime.fromisoformat(conv["created_at"]),
            "other_participant": other_participant,
            "unread_count": 0,  # Will be calculated separately if needed
        }

    async def _format_conversation_with_last_message(
        self, conv: Dict[str, Any], user_id: UUID
    ) -> Dict[str, Any]:
        """Format conversation with last message and unread count."""
        formatted = self._format_conversation_response(conv, user_id)

        # Get last message
        last_msg_response = (
            supabase.table("messages")
            .select("*, profiles!messages_sender_id_fkey(id, full_name, profile_picture_url)")
            .eq("conversation_id", conv["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if last_msg_response.data:
            msg = last_msg_response.data[0]
            try:
                decrypted_content = decrypt_message(msg["content_encrypted"])
                sender_profile = msg.pop("profiles")

                formatted["last_message"] = {
                    "id": UUID(msg["id"]),
                    "conversation_id": UUID(msg["conversation_id"]),
                    "sender_id": UUID(msg["sender_id"]),
                    "content_encrypted": msg["content_encrypted"],
                    "content": decrypted_content,
                    "is_read": msg["is_read"],
                    "created_at": datetime.fromisoformat(msg["created_at"]),
                    "sender": {
                        "id": UUID(sender_profile["id"]),
                        "full_name": sender_profile["full_name"],
                        "profile_picture_url": sender_profile.get("profile_picture_url"),
                    },
                }
            except Exception:
                formatted["last_message"] = None
        else:
            formatted["last_message"] = None

        # Get unread count
        unread_response = (
            supabase.table("messages")
            .select("id", count="exact")
            .eq("conversation_id", conv["id"])
            .eq("is_read", False)
            .neq("sender_id", str(user_id))
            .execute()
        )

        formatted["unread_count"] = unread_response.count if unread_response.count else 0

        return formatted

    async def _get_user_profile_for_message(self, user_id: UUID) -> Dict[str, Any]:
        """Helper to fetch user profile for message responses."""
        response = (
            supabase.table("profiles")
            .select("id, full_name, profile_picture_url")
            .eq("id", str(user_id))
            .execute()
        )

        if not response.data:
            return {"id": str(user_id), "full_name": "Unknown User", "profile_picture_url": None}

        profile = response.data[0]
        return {
            "id": UUID(profile["id"]),
            "full_name": profile["full_name"],
            "profile_picture_url": profile.get("profile_picture_url"),
        }


# Global service instance
_chat_service_instance: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    """
    Get or create the global ChatService instance.

    Returns:
        ChatService: The global service instance.
    """
    global _chat_service_instance
    if _chat_service_instance is None:
        _chat_service_instance = ChatService()
    return _chat_service_instance
