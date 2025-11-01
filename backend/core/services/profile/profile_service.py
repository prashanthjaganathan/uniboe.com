"""
Profile service layer.

Handles all profile operations including get, update, search, and statistics.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from backend.core.models.profile import (
    ProfileListResponse,
    ProfileSearchRequest,
    ProfileStatsResponse,
    ProfileUpdate,
    PublicProfileResponse,
)
from backend.db import supabase


class ProfileNotFoundError(Exception):
    """Raised when a profile is not found."""


class UnauthorizedError(Exception):
    """Raised when a user is not authorized to perform an action."""


class ValidationError(Exception):
    """Raised for data validation errors."""


class ProfileService:
    """
    Service for managing user profiles.
    """

    async def get_profile_by_id(
        self, profile_id: UUID, viewer_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Get profile by ID.

        Returns full profile if viewing own profile, otherwise returns public profile.

        Args:
            profile_id: The profile ID to retrieve.
            viewer_id: The ID of the user viewing the profile (optional).

        Returns:
            A dictionary representing the profile (full or public).

        Raises:
            ProfileNotFoundError: If the profile is not found.
            Exception: For other database errors.
        """
        try:
            response = (
                supabase.table("profiles")
                .select("*, universities(id, name, domain, state)")
                .eq("id", str(profile_id))
                .execute()
            )

            if not response.data:
                raise ProfileNotFoundError(f"Profile with ID {profile_id} not found")

            profile_data = response.data[0]

            # Determine if this is own profile or public profile
            is_own_profile = viewer_id and viewer_id == profile_id

            return self._format_profile_response(profile_data, is_own_profile)

        except ProfileNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error fetching profile {profile_id}: {e}")

    async def get_current_user_profile(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get full profile for current user.

        Includes all fields including sensitive data.

        Args:
            user_id: The user's ID.

        Returns:
            A dictionary representing the complete profile.

        Raises:
            ProfileNotFoundError: If the profile is not found.
            Exception: For other database errors.
        """
        try:
            response = (
                supabase.table("profiles")
                .select("*, universities(id, name, domain, state)")
                .eq("id", str(user_id))
                .execute()
            )

            if not response.data:
                raise ProfileNotFoundError(f"Profile with ID {user_id} not found")

            profile_data = response.data[0]

            return self._format_profile_response(profile_data, is_own_profile=True)

        except ProfileNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error fetching current user profile: {e}")

    async def update_profile(self, user_id: UUID, update_data: ProfileUpdate) -> Dict[str, Any]:
        """
        Update user's profile.

        Only updates provided fields. Cannot update protected fields like
        id, email, university_id, university_email, is_verified, created_at.

        Args:
            user_id: The user's ID.
            update_data: The profile update data.

        Returns:
            A dictionary representing the updated profile.

        Raises:
            ProfileNotFoundError: If the profile is not found.
            ValidationError: If update data is invalid.
            Exception: For other database errors.
        """
        try:
            # Check if profile exists
            existing_profile = (
                supabase.table("profiles").select("id").eq("id", str(user_id)).execute()
            )

            if not existing_profile.data:
                raise ProfileNotFoundError(f"Profile with ID {user_id} not found")

            # Prepare update payload (exclude None values)
            update_payload = {}
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if value is not None:
                    update_payload[field] = value

            if not update_payload:
                raise ValidationError("No valid fields provided for update")

            # Update profile
            response = (
                supabase.table("profiles").update(update_payload).eq("id", str(user_id)).execute()
            )

            if not response.data:
                raise ValidationError("Failed to update profile: No data returned")

            # Fetch updated profile with university data
            updated_profile = await self.get_current_user_profile(user_id)

            return updated_profile

        except (ProfileNotFoundError, ValidationError):
            raise
        except Exception as e:
            raise Exception(f"Error updating profile: {e}")

    async def search_profiles(
        self, search_request: ProfileSearchRequest, viewer_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Search profiles by name, university, interests, etc.

        Args:
            search_request: The search criteria.
            viewer_id: The ID of the user performing the search (optional).

        Returns:
            A dictionary containing paginated public profiles.

        Raises:
            Exception: For database errors.
        """
        try:
            # Build query
            query = supabase.table("profiles").select(
                "id, full_name, bio, interests, profile_picture_url, "
                "graduation_year, major, university_id, university_email, "
                "is_verified, created_at, universities(id, name, domain, state)"
            )

            # Apply search query (search in name)
            if search_request.query:
                search_pattern = f"%{search_request.query}%"
                # Supabase Python client doesn't support .or_() directly like JS
                # We'll search by name first
                query = query.ilike("full_name", search_pattern)

            # Apply filters
            if search_request.university_id:
                query = query.eq("university_id", str(search_request.university_id))

            if search_request.interests and len(search_request.interests) > 0:
                # Check if profile interests overlap with search interests
                query = query.overlaps("interests", search_request.interests)

            if search_request.graduation_year:
                query = query.eq("graduation_year", search_request.graduation_year)

            # Exclude viewer's own profile
            if viewer_id:
                query = query.neq("id", str(viewer_id))

            # Get total count
            count_query = query
            count_response = count_query.execute()
            total_count = len(count_response.data) if count_response.data else 0

            # Apply pagination
            offset = (search_request.page - 1) * search_request.page_size
            query = query.range(offset, offset + search_request.page_size - 1)

            # Execute query
            profiles_response = query.execute()

            if not profiles_response.data:
                return ProfileListResponse(
                    profiles=[],
                    total=0,
                    page=search_request.page,
                    page_size=search_request.page_size,
                    has_more=False,
                ).model_dump()

            # Format profiles as public profiles
            formatted_profiles = []
            for profile_data in profiles_response.data:
                formatted_profile = self._format_profile_response(
                    profile_data, is_own_profile=False
                )
                formatted_profiles.append(formatted_profile)

            has_more = (search_request.page * search_request.page_size) < total_count

            return ProfileListResponse(
                profiles=[PublicProfileResponse(**profile) for profile in formatted_profiles],
                total=total_count,
                page=search_request.page,
                page_size=search_request.page_size,
                has_more=has_more,
            ).model_dump()

        except Exception as e:
            raise Exception(f"Error searching profiles: {e}")

    async def get_profile_stats(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get statistics for a user profile.

        Args:
            user_id: The user's ID.

        Returns:
            A dictionary containing profile statistics.

        Raises:
            ProfileNotFoundError: If the profile is not found.
            Exception: For other database errors.
        """
        try:
            # Check if profile exists and get joined_date
            profile_response = (
                supabase.table("profiles").select("created_at").eq("id", str(user_id)).execute()
            )

            if not profile_response.data:
                raise ProfileNotFoundError(f"Profile with ID {user_id} not found")

            joined_date = datetime.fromisoformat(profile_response.data[0]["created_at"])

            # Get posts count
            posts_response = (
                supabase.table("posts")
                .select("id", count="exact")
                .eq("user_id", str(user_id))
                .execute()
            )
            posts_count = posts_response.count if posts_response.count else 0

            # Get listings count (active only)
            listings_response = (
                supabase.table("housing_listings")
                .select("id", count="exact")
                .eq("user_id", str(user_id))
                .eq("is_active", True)
                .execute()
            )
            listings_count = listings_response.count if listings_response.count else 0

            # Get conversations count
            # User can be either participant_1 or participant_2
            conv1_response = (
                supabase.table("conversations")
                .select("id", count="exact")
                .eq("participant_1_id", str(user_id))
                .execute()
            )

            conv2_response = (
                supabase.table("conversations")
                .select("id", count="exact")
                .eq("participant_2_id", str(user_id))
                .execute()
            )

            connections_count = (conv1_response.count if conv1_response.count else 0) + (
                conv2_response.count if conv2_response.count else 0
            )

            return ProfileStatsResponse(
                posts_count=posts_count,
                listings_count=listings_count,
                connections_count=connections_count,
                joined_date=joined_date,
            ).model_dump()

        except ProfileNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error fetching profile stats: {e}")

    async def upload_profile_picture(
        self, user_id: UUID, file_path: str, file_bytes: bytes, content_type: str = "image/jpeg"
    ) -> str:
        """
        Upload profile picture to Supabase Storage.

        Args:
            user_id: The user's ID.
            file_path: The filename for the uploaded file.
            file_bytes: The file content as bytes.
            content_type: The MIME type of the file.

        Returns:
            The public URL of the uploaded image.

        Raises:
            Exception: For upload or database errors.
        """
        try:
            # Generate storage path
            storage_path = f"{user_id}/{file_path}"

            # Upload file to Supabase Storage
            _ = supabase.storage.from_("profile-pictures").upload(
                path=storage_path, file=file_bytes, file_options={"content-type": content_type}
            )

            # Get public URL
            public_url = supabase.storage.from_("profile-pictures").get_public_url(storage_path)

            # Update profile with new picture URL
            supabase.table("profiles").update({"profile_picture_url": public_url}).eq(
                "id", str(user_id)
            ).execute()

            return public_url

        except Exception as e:
            raise Exception(f"Error uploading profile picture: {e}")

    async def delete_profile_picture(self, user_id: UUID) -> bool:
        """
        Delete profile picture from Supabase Storage.

        Args:
            user_id: The user's ID.

        Returns:
            True if successful.

        Raises:
            Exception: For deletion or database errors.
        """
        try:
            # Get current profile picture URL
            profile_response = (
                supabase.table("profiles")
                .select("profile_picture_url")
                .eq("id", str(user_id))
                .execute()
            )

            if not profile_response.data:
                raise ProfileNotFoundError(f"Profile with ID {user_id} not found")

            profile_picture_url = profile_response.data[0].get("profile_picture_url")

            # If there's a profile picture, delete it from storage
            if profile_picture_url:
                # Extract storage path from URL
                # Assuming URL format: .../storage/v1/object/public/profile-pictures/{path}
                storage_path = f"{user_id}/"

                # Delete all files for this user (in case there are multiple)
                try:
                    supabase.storage.from_("profile-pictures").remove([storage_path])
                except Exception:
                    # Ignore storage deletion errors (file might not exist)
                    pass

            # Update profile to remove picture URL
            supabase.table("profiles").update({"profile_picture_url": None}).eq(
                "id", str(user_id)
            ).execute()

            return True

        except ProfileNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error deleting profile picture: {e}")

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Search user by email.

        Used for finding users to start conversations with.

        Args:
            email: The email address to search for.

        Returns:
            Public profile if found, None otherwise.

        Raises:
            Exception: For database errors.
        """
        try:
            response = (
                supabase.table("profiles")
                .select(
                    "id, full_name, bio, interests, profile_picture_url, "
                    "graduation_year, major, university_id, university_email, "
                    "is_verified, created_at, universities(id, name, domain, state)"
                )
                .or_(f"email.eq.{email},university_email.eq.{email}")
                .execute()
            )

            if not response.data:
                return None

            profile_data = response.data[0]

            return self._format_profile_response(profile_data, is_own_profile=False)

        except Exception as e:
            raise Exception(f"Error searching user by email: {e}")

    async def check_username_available(self, username: str) -> bool:
        """
        Check if username is available.

        This is a placeholder for future username feature.

        Args:
            username: The username to check.

        Returns:
            True if available (currently always True as usernames not implemented).
        """
        # Placeholder for future username feature
        # For now, always return True
        return True

    # Helper methods

    def _format_profile_response(
        self, profile_data: Dict[str, Any], is_own_profile: bool = False
    ) -> Dict[str, Any]:
        """
        Format profile data for API response.

        Args:
            profile_data: Raw profile data from database.
            is_own_profile: Whether this is the user's own profile.

        Returns:
            Formatted profile (full or public).
        """
        university_data = profile_data.get("universities")
        university_name = None
        university_id_value = profile_data.get("university_id")

        if university_data:
            university_name = university_data.get("name")

        # Parse UUID fields
        profile_id = UUID(profile_data["id"])
        university_id = UUID(university_id_value) if university_id_value else None

        # Parse datetime fields
        created_at = datetime.fromisoformat(profile_data["created_at"])
        updated_at = (
            datetime.fromisoformat(profile_data["updated_at"])
            if profile_data.get("updated_at")
            else created_at
        )

        # Ensure interests is a list
        interests = profile_data.get("interests", []) or []

        if is_own_profile:
            # Return full profile with all fields
            return {
                "id": profile_id,
                "email": profile_data.get("email", ""),
                "full_name": profile_data["full_name"],
                "university_id": university_id,
                "university_name": university_name,
                "university_email": profile_data["university_email"],
                "bio": profile_data.get("bio"),
                "interests": interests,
                "profile_picture_url": profile_data.get("profile_picture_url"),
                "phone_number": profile_data.get("phone_number"),
                "graduation_year": profile_data.get("graduation_year"),
                "major": profile_data.get("major"),
                "is_verified": profile_data.get("is_verified", False),
                "created_at": created_at,
                "updated_at": updated_at,
            }
        else:
            # Return public profile (exclude email and phone_number)
            return {
                "id": profile_id,
                "full_name": profile_data["full_name"],
                "university_id": university_id,
                "university_name": university_name,
                "university_email": profile_data["university_email"],
                "bio": profile_data.get("bio"),
                "interests": interests,
                "profile_picture_url": profile_data.get("profile_picture_url"),
                "graduation_year": profile_data.get("graduation_year"),
                "major": profile_data.get("major"),
                "is_verified": profile_data.get("is_verified", False),
                "created_at": created_at,
            }


# Global service instance
_profile_service_instance: Optional[ProfileService] = None


def get_profile_service() -> ProfileService:
    """
    Get or create the global ProfileService instance.

    Returns:
        ProfileService: The global service instance.
    """
    global _profile_service_instance
    if _profile_service_instance is None:
        _profile_service_instance = ProfileService()
    return _profile_service_instance
