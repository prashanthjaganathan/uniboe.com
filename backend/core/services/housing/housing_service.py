"""
Housing service layer.

Handles all housing listing operations, including creation, retrieval,
updating, deletion, search, and likes.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from backend.core.models.housing import (
    HousingLikeResponse,
    HousingListingCreate,
    HousingListingResponse,
    HousingListingUpdate,
    HousingListResponse,
    HousingSearchFilters,
)
from backend.db import supabase


class ListingNotFoundError(Exception):
    """Raised when a housing listing is not found."""


class UnauthorizedError(Exception):
    """Raised when a user is not authorized to perform an action."""


class ValidationError(Exception):
    """Raised for data validation errors within the service."""


class HousingService:
    """
    Service for managing housing listings and likes.
    """

    async def upload_housing_media(
        self, user_id: UUID, files: List[Tuple[bytes, str, str]]
    ) -> Dict[str, Any]:
        """
        Upload image files for housing listings to Supabase Storage.

        Args:
            user_id: ID of the user uploading files
            files: List of tuples (file_content, content_type, filename)

        Returns:
            Dict containing image_urls and count

        Raises:
            ValidationError: If file validation fails or upload fails
        """
        try:
            # Validate file count (max 10 images for housing)
            if len(files) > 10:
                raise ValidationError("Maximum 10 images allowed per listing")

            # Allowed MIME types (images only)
            allowed_types = {
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
            }

            image_urls = []
            uploaded_paths = []

            for file_content, content_type, filename in files:
                # Validate MIME type
                if content_type not in allowed_types:
                    raise ValidationError(
                        f"File type '{content_type}' not allowed. "
                        f"Supported: images (jpg, png, gif, webp)"
                    )

                # Validate file size (10MB max)
                max_size = 10 * 1024 * 1024  # 10MB
                if len(file_content) > max_size:
                    raise ValidationError(f"File '{filename}' exceeds 10MB limit")

                # Generate unique filename
                file_ext = filename.split(".")[-1] if "." in filename else "jpg"
                unique_filename = f"{uuid4()}.{file_ext}"

                # Storage path: user_id/filename
                storage_path = f"{user_id}/{unique_filename}"

                try:
                    # Upload to Supabase Storage
                    supabase.storage.from_("housing-images").upload(
                        path=storage_path,
                        file=file_content,
                        file_options={"content-type": content_type},
                    )

                    # Get public URL
                    public_url = supabase.storage.from_("housing-images").get_public_url(
                        storage_path
                    )

                    image_urls.append(public_url)
                    uploaded_paths.append(storage_path)

                except Exception as upload_error:
                    # Cleanup: delete any already uploaded files
                    for path in uploaded_paths:
                        try:
                            supabase.storage.from_("housing-images").remove([path])
                        except Exception:
                            pass

                    raise ValidationError(f"Upload failed for '{filename}': {str(upload_error)}")

            return {
                "image_urls": image_urls,
                "count": len(image_urls),
            }

        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Housing media upload failed: {str(e)}")

    async def delete_housing_media(self, user_id: UUID, image_url: str) -> bool:
        """
        Delete a housing image file from Supabase Storage.

        Args:
            user_id: ID of the user (must own the file)
            image_url: Public URL of the image file

        Returns:
            bool: True if successful

        Raises:
            UnauthorizedError: If user doesn't own the file
            ValidationError: If deletion fails
        """
        try:
            # Extract storage path from URL
            if f"housing-images/{user_id}/" not in image_url:
                raise UnauthorizedError("You can only delete your own housing images")

            path_parts = image_url.split("housing-images/")
            if len(path_parts) < 2:
                raise ValidationError("Invalid image URL")

            storage_path = path_parts[1].split("?")[0]

            # Delete from storage
            supabase.storage.from_("housing-images").remove([storage_path])

            return True

        except (UnauthorizedError, ValidationError):
            raise
        except Exception as e:
            raise ValidationError(f"Failed to delete housing image: {str(e)}")

    async def create_listing(
        self, user_id: UUID, listing_data: HousingListingCreate
    ) -> Dict[str, Any]:
        """
        Create a new housing listing.

        Args:
            user_id: The ID of the user creating the listing.
            listing_data: The data for the new listing.

        Returns:
            A dictionary representing the created listing with user information.

        Raises:
            ValidationError: If listing data is invalid.
            Exception: For other database errors.
        """
        try:
            listing_to_insert = {
                "user_id": str(user_id),
                "title": listing_data.title,
                "description": listing_data.description,
                "address": listing_data.address,
                "city": listing_data.city,
                "state": listing_data.state,
                "zip_code": listing_data.zip_code,
                "price": listing_data.price,
                "bedrooms": listing_data.bedrooms,
                "bathrooms": listing_data.bathrooms,
                "square_feet": listing_data.square_feet,
                "available_from": (
                    listing_data.available_from.isoformat() if listing_data.available_from else None
                ),
                "available_until": (
                    listing_data.available_until.isoformat()
                    if listing_data.available_until
                    else None
                ),
                "property_type": listing_data.property_type,
                "amenities": listing_data.amenities,
                "images": listing_data.images,
                "contact_email": listing_data.contact_email,
                "contact_phone": listing_data.contact_phone,
                "is_active": True,
            }

            response = supabase.table("housing_listings").insert(listing_to_insert).execute()

            if not response.data:
                raise ValidationError("Failed to create listing: No data returned.")

            created_listing = response.data[0]

            # Fetch user info for the response
            user_info = await self._get_user_profile_for_listing(user_id)

            return self._format_listing_response(created_listing, user_info, is_liked=False)

        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError(f"Error creating listing: {e}")

    async def get_listings(
        self,
        filters: Optional[HousingSearchFilters] = None,
        current_user_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Dict[str, Any]:
        """
        Get paginated list of active housing listings with optional filters.

        Args:
            filters: Optional search filters.
            current_user_id: The ID of the current authenticated user (optional).
            page: The page number to retrieve (1-indexed).
            page_size: The number of listings per page.
            sort_by: Field to sort by (created_at, price, like_count, view_count).
            sort_order: Sort order (asc or desc).

        Returns:
            A dictionary containing the list of listings, total count, and pagination info.

        Raises:
            Exception: For database errors.
        """
        try:
            # Base query for active listings with user and university info
            query = (
                supabase.table("housing_listings")
                .select(
                    "*, profiles!housing_listings_user_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("is_active", True)
            )

            # Apply filters
            if filters:
                if filters.min_price is not None:
                    query = query.gte("price", filters.min_price)
                if filters.max_price is not None:
                    query = query.lte("price", filters.max_price)
                if filters.bedrooms is not None:
                    query = query.eq("bedrooms", filters.bedrooms)
                if filters.bathrooms is not None:
                    query = query.eq("bathrooms", filters.bathrooms)
                if filters.property_type:
                    query = query.eq("property_type", filters.property_type)
                if filters.city:
                    query = query.ilike("city", f"%{filters.city}%")
                if filters.state:
                    query = query.ilike("state", f"%{filters.state}%")
                if filters.amenities and len(filters.amenities) > 0:
                    # Check if listing has all specified amenities
                    query = query.contains("amenities", filters.amenities)
                if filters.available_from:
                    # Listing should be available from this date or later
                    query = query.gte("available_from", filters.available_from.isoformat())

            # Get total count for pagination
            count_query = query
            count_response = count_query.execute()
            total_count = len(count_response.data) if count_response.data else 0

            # Apply sorting
            desc = sort_order.lower() == "desc"
            query = query.order(sort_by, desc=desc)

            # Apply pagination
            offset = (page - 1) * page_size
            query = query.range(offset, offset + page_size - 1)

            listings_response = query.execute()

            if not listings_response.data:
                return HousingListResponse(
                    listings=[], total=0, page=page, page_size=page_size, has_more=False
                ).model_dump()

            # Format listings
            listings_list = []
            for listing_data in listings_response.data:
                user_info = self._format_user_profile_for_listing(listing_data.pop("profiles"))

                # Check if current user liked this listing
                is_liked = False
                if current_user_id:
                    like_check = (
                        supabase.table("housing_likes")
                        .select("id")
                        .eq("listing_id", listing_data["id"])
                        .eq("user_id", str(current_user_id))
                        .execute()
                    )
                    is_liked = bool(like_check.data)

                listings_list.append(
                    self._format_listing_response(listing_data, user_info, is_liked)
                )

            has_more = (page * page_size) < total_count

            return HousingListResponse(
                listings=[HousingListingResponse(**listing) for listing in listings_list],
                total=total_count,
                page=page,
                page_size=page_size,
                has_more=has_more,
            ).model_dump()

        except Exception as e:
            raise Exception(f"Error fetching listings: {e}")

    async def get_listing_by_id(
        self, listing_id: UUID, current_user_id: Optional[UUID] = None, increment_views: bool = True
    ) -> Dict[str, Any]:
        """
        Get a single listing by its ID.

        Args:
            listing_id: The ID of the listing to retrieve.
            current_user_id: The ID of the current authenticated user (optional).
            increment_views: Whether to increment the view count.

        Returns:
            A dictionary representing the listing with user information and like status.

        Raises:
            ListingNotFoundError: If the listing is not found or not active.
            Exception: For other database errors.
        """
        try:
            response = (
                supabase.table("housing_listings")
                .select(
                    "*, profiles!housing_listings_user_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("id", str(listing_id))
                .eq("is_active", True)
                .execute()
            )

            if not response.data:
                raise ListingNotFoundError(f"Listing with ID {listing_id} not found or not active.")

            listing_data = response.data[0]

            # Increment view count if requested
            if increment_views:
                supabase.table("housing_listings").update(
                    {"view_count": listing_data["view_count"] + 1}
                ).eq("id", str(listing_id)).execute()
                listing_data["view_count"] += 1

            user_info = self._format_user_profile_for_listing(listing_data.pop("profiles"))

            # Check if current user liked this listing
            is_liked = False
            if current_user_id:
                like_check = (
                    supabase.table("housing_likes")
                    .select("id")
                    .eq("listing_id", listing_data["id"])
                    .eq("user_id", str(current_user_id))
                    .execute()
                )
                is_liked = bool(like_check.data)

            return self._format_listing_response(listing_data, user_info, is_liked)

        except ListingNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error fetching listing {listing_id}: {e}")

    async def get_user_listings(
        self,
        user_id: UUID,
        current_user_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
        include_inactive: bool = False,
    ) -> Dict[str, Any]:
        """
        Get all listings by a specific user.

        Args:
            user_id: The ID of the user whose listings to retrieve.
            current_user_id: The ID of the current authenticated user (optional).
            page: The page number to retrieve (1-indexed).
            page_size: The number of listings per page.
            include_inactive: Whether to include inactive listings (only if viewing own).

        Returns:
            A dictionary containing the list of listings, total count, and pagination info.

        Raises:
            Exception: For database errors.
        """
        try:
            # Base query for user's listings with user and university info
            query = (
                supabase.table("housing_listings")
                .select(
                    "*, profiles!housing_listings_user_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("user_id", str(user_id))
            )

            # Only show inactive listings if user is viewing their own
            if not include_inactive or (current_user_id and current_user_id != user_id):
                query = query.eq("is_active", True)

            # Get total count
            count_response = query.execute()
            total_count = len(count_response.data) if count_response.data else 0

            # Apply sorting and pagination
            query = query.order("created_at", desc=True)
            offset = (page - 1) * page_size
            query = query.range(offset, offset + page_size - 1)

            listings_response = query.execute()

            if not listings_response.data:
                return HousingListResponse(
                    listings=[], total=0, page=page, page_size=page_size, has_more=False
                ).model_dump()

            # Format listings
            listings_list = []
            for listing_data in listings_response.data:
                user_info = self._format_user_profile_for_listing(listing_data.pop("profiles"))

                # Check if current user liked this listing
                is_liked = False
                if current_user_id:
                    like_check = (
                        supabase.table("housing_likes")
                        .select("id")
                        .eq("listing_id", listing_data["id"])
                        .eq("user_id", str(current_user_id))
                        .execute()
                    )
                    is_liked = bool(like_check.data)

                listings_list.append(
                    self._format_listing_response(listing_data, user_info, is_liked)
                )

            has_more = (page * page_size) < total_count

            return HousingListResponse(
                listings=[HousingListingResponse(**listing) for listing in listings_list],
                total=total_count,
                page=page,
                page_size=page_size,
                has_more=has_more,
            ).model_dump()

        except Exception as e:
            raise Exception(f"Error fetching listings for user {user_id}: {e}")

    async def update_listing(
        self, listing_id: UUID, user_id: UUID, update_data: HousingListingUpdate
    ) -> Dict[str, Any]:
        """
        Update an existing listing.

        Args:
            listing_id: The ID of the listing to update.
            user_id: The ID of the user attempting to update the listing (for authorization).
            update_data: The data to update the listing with.

        Returns:
            A dictionary representing the updated listing.

        Raises:
            ListingNotFoundError: If the listing is not found.
            UnauthorizedError: If the user does not own the listing.
            ValidationError: If update data is invalid.
            Exception: For other database errors.
        """
        try:
            # Check if listing exists and belongs to user
            existing_listing_response = (
                supabase.table("housing_listings")
                .select("user_id")
                .eq("id", str(listing_id))
                .execute()
            )

            if not existing_listing_response.data:
                raise ListingNotFoundError(f"Listing with ID {listing_id} not found.")

            if existing_listing_response.data[0]["user_id"] != str(user_id):
                raise UnauthorizedError("You are not authorized to update this listing.")

            # Prepare update payload, excluding None values
            update_payload = {}
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if value is not None:
                    # Convert date objects to ISO format strings
                    if field in ["available_from", "available_until"] and value:
                        update_payload[field] = value.isoformat()
                    else:
                        update_payload[field] = value

            if not update_payload:
                raise ValidationError("No valid fields provided for update.")

            response = (
                supabase.table("housing_listings")
                .update(update_payload)
                .eq("id", str(listing_id))
                .execute()
            )

            if not response.data:
                raise ValidationError("Failed to update listing: No data returned.")

            updated_listing = response.data[0]

            # Fetch user info for the response
            user_info = await self._get_user_profile_for_listing(user_id)

            # Check like status
            is_liked = False
            like_check = (
                supabase.table("housing_likes")
                .select("id")
                .eq("listing_id", updated_listing["id"])
                .eq("user_id", str(user_id))
                .execute()
            )
            is_liked = bool(like_check.data)

            return self._format_listing_response(updated_listing, user_info, is_liked)

        except (ListingNotFoundError, UnauthorizedError, ValidationError):
            raise
        except Exception as e:
            raise Exception(f"Error updating listing {listing_id}: {e}")

    async def delete_listing(self, listing_id: UUID, user_id: UUID) -> bool:
        """
        Soft delete a listing (set is_active = False).

        Args:
            listing_id: The ID of the listing to delete.
            user_id: The ID of the user attempting to delete the listing (for authorization).

        Returns:
            True if the listing was successfully deleted.

        Raises:
            ListingNotFoundError: If the listing is not found.
            UnauthorizedError: If the user does not own the listing.
            Exception: For other database errors.
        """
        try:
            # Check if listing exists and belongs to user
            existing_listing_response = (
                supabase.table("housing_listings")
                .select("user_id")
                .eq("id", str(listing_id))
                .execute()
            )

            if not existing_listing_response.data:
                raise ListingNotFoundError(f"Listing with ID {listing_id} not found.")

            if existing_listing_response.data[0]["user_id"] != str(user_id):
                raise UnauthorizedError("You are not authorized to delete this listing.")

            # Soft delete: set is_active = False
            response = (
                supabase.table("housing_listings")
                .update({"is_active": False})
                .eq("id", str(listing_id))
                .execute()
            )

            if not response.data:
                raise Exception("Failed to delete listing: No data returned.")

            return True

        except (ListingNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error deleting listing {listing_id}: {e}")

    async def activate_listing(self, listing_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Activate a listing (set is_active = True).

        Args:
            listing_id: The ID of the listing to activate.
            user_id: The ID of the user attempting to activate the listing.

        Returns:
            A dictionary representing the activated listing.

        Raises:
            ListingNotFoundError: If the listing is not found.
            UnauthorizedError: If the user does not own the listing.
            Exception: For other database errors.
        """
        try:
            # Check if listing exists and belongs to user
            existing_listing_response = (
                supabase.table("housing_listings")
                .select("user_id")
                .eq("id", str(listing_id))
                .execute()
            )

            if not existing_listing_response.data:
                raise ListingNotFoundError(f"Listing with ID {listing_id} not found.")

            if existing_listing_response.data[0]["user_id"] != str(user_id):
                raise UnauthorizedError("You are not authorized to activate this listing.")

            # Set is_active = True
            response = (
                supabase.table("housing_listings")
                .update({"is_active": True})
                .eq("id", str(listing_id))
                .select(
                    "*, profiles!housing_listings_user_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .execute()
            )

            if not response.data:
                raise Exception("Failed to activate listing: No data returned.")

            updated_listing = response.data[0]
            user_info = self._format_user_profile_for_listing(updated_listing.pop("profiles"))

            return self._format_listing_response(updated_listing, user_info, False)

        except (ListingNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise Exception(f"Error activating listing {listing_id}: {e}")

    async def deactivate_listing(self, listing_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Deactivate a listing (set is_active = False).

        Args:
            listing_id: The ID of the listing to deactivate.
            user_id: The ID of the user attempting to deactivate the listing.

        Returns:
            A dictionary representing the deactivated listing.

        Raises:
            ListingNotFoundError: If the listing is not found.
            UnauthorizedError: If the user does not own the listing.
            Exception: For other database errors.
        """
        return await self.delete_listing(listing_id, user_id)

    async def like_listing(self, listing_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Like a listing. If the user has already liked the listing, returns the existing like.

        Args:
            listing_id: The ID of the listing to like.
            user_id: The ID of the user liking the listing.

        Returns:
            A dictionary representing the like entry with user information.

        Raises:
            ListingNotFoundError: If the listing does not exist or is not active.
            Exception: For other database errors.
        """
        try:
            # Check if listing exists and is active
            listing_check = (
                supabase.table("housing_listings")
                .select("id, is_active")
                .eq("id", str(listing_id))
                .execute()
            )

            if not listing_check.data:
                raise ListingNotFoundError(f"Listing with ID {listing_id} not found.")

            if not listing_check.data[0]["is_active"]:
                raise ListingNotFoundError(f"Listing with ID {listing_id} is not active.")

            # Check if already liked
            existing_like_response = (
                supabase.table("housing_likes")
                .select("*")
                .eq("listing_id", str(listing_id))
                .eq("user_id", str(user_id))
                .execute()
            )

            if existing_like_response.data:
                # Return existing like
                existing_like = existing_like_response.data[0]
                user_info = await self._get_user_profile_for_like(user_id)
                return HousingLikeResponse(
                    id=UUID(existing_like["id"]),
                    listing_id=UUID(existing_like["listing_id"]),
                    user_id=UUID(existing_like["user_id"]),
                    created_at=datetime.fromisoformat(existing_like["created_at"]),
                    user=user_info,
                ).model_dump()

            # Insert new like
            like_to_insert = {
                "listing_id": str(listing_id),
                "user_id": str(user_id),
            }
            response = supabase.table("housing_likes").insert(like_to_insert).execute()

            if not response.data:
                raise Exception("Failed to like listing: No data returned.")

            # Get current like count and increment it
            current_listing = (
                supabase.table("housing_listings")
                .select("like_count")
                .eq("id", str(listing_id))
                .execute()
            )
            if current_listing.data:
                current_count = current_listing.data[0].get("like_count", 0)
                supabase.table("housing_listings").update({"like_count": current_count + 1}).eq(
                    "id", str(listing_id)
                ).execute()

            created_like = response.data[0]
            user_info = await self._get_user_profile_for_like(user_id)

            return HousingLikeResponse(
                id=UUID(created_like["id"]),
                listing_id=UUID(created_like["listing_id"]),
                user_id=UUID(created_like["user_id"]),
                created_at=datetime.fromisoformat(created_like["created_at"]),
                user=user_info,
            ).model_dump()

        except ListingNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error liking listing {listing_id}: {e}")

    async def unlike_listing(self, listing_id: UUID, user_id: UUID) -> bool:
        """
        Unlike a listing.

        Args:
            listing_id: The ID of the listing to unlike.
            user_id: The ID of the user unliking the listing.

        Returns:
            True if the like was successfully removed.

        Raises:
            Exception: For database errors.
        """
        try:
            # Delete the like entry
            (
                supabase.table("housing_likes")
                .delete()
                .eq("listing_id", str(listing_id))
                .eq("user_id", str(user_id))
                .execute()
            )

            # Get current like count and decrement it (ensure it doesn't go below 0)
            current_listing = (
                supabase.table("housing_listings")
                .select("like_count")
                .eq("id", str(listing_id))
                .execute()
            )
            if current_listing.data:
                current_count = current_listing.data[0].get("like_count", 0)
                new_count = max(0, current_count - 1)  # Ensure it doesn't go negative
                supabase.table("housing_listings").update({"like_count": new_count}).eq(
                    "id", str(listing_id)
                ).execute()

            return True

        except Exception as e:
            raise Exception(f"Error unliking listing {listing_id}: {e}")

    async def get_listing_likes(
        self, listing_id: UUID, page: int = 1, page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Get all users who liked a specific listing.

        Args:
            listing_id: The ID of the listing.
            page: The page number to retrieve (1-indexed).
            page_size: The number of likes per page.

        Returns:
            A dictionary containing the list of likes with user details,
            total count, and pagination info.

        Raises:
            ListingNotFoundError: If the listing does not exist.
            Exception: For other database errors.
        """
        try:
            # Check if listing exists
            listing_check = (
                supabase.table("housing_listings").select("id").eq("id", str(listing_id)).execute()
            )

            if not listing_check.data:
                raise ListingNotFoundError(f"Listing with ID {listing_id} not found.")

            # Query likes with user profile information
            likes_query = (
                supabase.table("housing_likes")
                .select(
                    "*, profiles!housing_likes_user_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("listing_id", str(listing_id))
                .order("created_at", desc=True)
            )

            # Get total count
            count_response = likes_query.execute()
            total_count = len(count_response.data) if count_response.data else 0

            # Apply pagination
            offset = (page - 1) * page_size
            likes_query = likes_query.range(offset, offset + page_size - 1)

            likes_response = likes_query.execute()

            if not likes_response.data:
                return {
                    "likes": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "has_more": False,
                }

            # Format likes
            likes_list = []
            for like_data in likes_response.data:
                profile_data = like_data.pop("profiles")
                user_info = {
                    "id": UUID(profile_data["id"]),
                    "full_name": profile_data["full_name"],
                    "profile_picture_url": profile_data["profile_picture_url"],
                    "university_name": (
                        profile_data["universities"]["name"]
                        if profile_data.get("universities")
                        else None
                    ),
                }
                likes_list.append(
                    HousingLikeResponse(
                        id=UUID(like_data["id"]),
                        listing_id=UUID(like_data["listing_id"]),
                        user_id=UUID(like_data["user_id"]),
                        created_at=datetime.fromisoformat(like_data["created_at"]),
                        user=user_info,
                    )
                )

            has_more = (page * page_size) < total_count

            return {
                "likes": [like.model_dump() for like in likes_list],
                "total": total_count,
                "page": page,
                "page_size": page_size,
                "has_more": has_more,
            }

        except ListingNotFoundError:
            raise
        except Exception as e:
            raise Exception(f"Error fetching likes for listing {listing_id}: {e}")

    async def search_by_location(
        self, query: str, current_user_id: Optional[UUID] = None, page: int = 1, page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Search listings by location (city, state, or address).

        Args:
            query: The search query string.
            current_user_id: The ID of the current authenticated user (optional).
            page: The page number to retrieve (1-indexed).
            page_size: The number of listings per page.

        Returns:
            A dictionary containing the list of matching listings and pagination info.

        Raises:
            Exception: For database errors.
        """
        try:
            # Search in city, state, and address fields (case-insensitive)
            f"%{query}%"

            # We need to use OR logic, so we'll fetch all active listings first
            # and then filter in Python (Supabase doesn't support OR in select)
            listings_response = (
                supabase.table("housing_listings")
                .select(
                    "*, profiles!housing_listings_user_id_fkey("
                    "id, full_name, profile_picture_url, universities(name)"
                    ")"
                )
                .eq("is_active", True)
                .execute()
            )

            if not listings_response.data:
                return HousingListResponse(
                    listings=[], total=0, page=page, page_size=page_size, has_more=False
                ).model_dump()

            # Filter by location in Python
            query_lower = query.lower()
            filtered_listings = [
                listing
                for listing in listings_response.data
                if (
                    query_lower in listing["city"].lower()
                    or query_lower in listing["state"].lower()
                    or query_lower in listing["address"].lower()
                )
            ]

            total_count = len(filtered_listings)

            # Apply pagination
            offset = (page - 1) * page_size
            paginated_listings = filtered_listings[offset : offset + page_size]

            # Format listings
            listings_list = []
            for listing_data in paginated_listings:
                user_info = self._format_user_profile_for_listing(listing_data.pop("profiles"))

                # Check if current user liked this listing
                is_liked = False
                if current_user_id:
                    like_check = (
                        supabase.table("housing_likes")
                        .select("id")
                        .eq("listing_id", listing_data["id"])
                        .eq("user_id", str(current_user_id))
                        .execute()
                    )
                    is_liked = bool(like_check.data)

                listings_list.append(
                    self._format_listing_response(listing_data, user_info, is_liked)
                )

            has_more = (page * page_size) < total_count

            return HousingListResponse(
                listings=[HousingListingResponse(**listing) for listing in listings_list],
                total=total_count,
                page=page,
                page_size=page_size,
                has_more=has_more,
            ).model_dump()

        except Exception as e:
            raise Exception(f"Error searching listings by location: {e}")

    # Helper methods

    async def _get_user_profile_for_listing(self, user_id: UUID) -> Dict[str, Any]:
        """Helper to fetch user profile for listing responses."""
        response = (
            supabase.table("profiles")
            .select("id, full_name, profile_picture_url, universities(name)")
            .eq("id", str(user_id))
            .execute()
        )

        if not response.data:
            return {
                "id": str(user_id),
                "full_name": "Unknown User",
                "profile_picture_url": None,
                "university_name": None,
            }

        return self._format_user_profile_for_listing(response.data[0])

    async def _get_user_profile_for_like(self, user_id: UUID) -> Dict[str, Any]:
        """Helper to fetch user profile for like responses."""
        response = (
            supabase.table("profiles")
            .select("id, full_name, profile_picture_url, universities(name)")
            .eq("id", str(user_id))
            .execute()
        )

        if not response.data:
            return {
                "id": str(user_id),
                "full_name": "Unknown User",
                "profile_picture_url": None,
                "university_name": None,
            }

        profile_data = response.data[0]
        return {
            "id": UUID(profile_data["id"]),
            "full_name": profile_data["full_name"],
            "profile_picture_url": profile_data["profile_picture_url"],
            "university_name": (
                profile_data["universities"]["name"] if profile_data.get("universities") else None
            ),
        }

    def _format_user_profile_for_listing(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format profile data for inclusion in listing responses."""
        university_name = (
            profile_data["universities"]["name"] if profile_data.get("universities") else None
        )
        return {
            "id": UUID(profile_data["id"]),
            "full_name": profile_data["full_name"],
            "profile_picture_url": profile_data["profile_picture_url"],
            "university_name": university_name,
        }

    def _safe_parse_datetime(self, datetime_str: str) -> datetime:
        """
        Safely parse datetime strings, handling malformed microseconds.

        Some timestamps from Supabase may have 4-digit microseconds instead of 6,
        which causes fromisoformat to fail. This function normalizes them.
        """
        import re

        # Fix microseconds: if there are 4 digits, pad with zeros to make 6
        # Pattern: matches timestamps like '2025-11-11T00:17:33.7562+00:00'
        pattern = r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{4})([+-]\d{2}:\d{2})"
        match = re.match(pattern, datetime_str)

        if match:
            # Pad microseconds to 6 digits
            date_part, microseconds, timezone = match.groups()
            microseconds_padded = microseconds.ljust(6, "0")
            datetime_str = f"{date_part}.{microseconds_padded}{timezone}"

        return datetime.fromisoformat(datetime_str)

    def _safe_parse_date(self, date_str: str):
        """
        Safely parse date strings, handling malformed timestamps.
        """
        import re
        from datetime import date

        # If it's a full datetime string (with time component), extract just the date
        if "T" in date_str:
            # Extract just the date part before the 'T'
            date_str = date_str.split("T")[0]

        try:
            return date.fromisoformat(date_str)
        except ValueError:
            # If it still fails, try to parse and fix it
            pattern = r"(\d{4}-\d{2}-\d{2})"
            match = re.match(pattern, date_str)
            if match:
                return date.fromisoformat(match.group(1))
            # If all else fails, return None
            return None

    def _format_listing_response(
        self, listing_data: Dict[str, Any], user_info: Dict[str, Any], is_liked: bool
    ) -> Dict[str, Any]:
        """Format listing data for API response."""

        # Parse dates
        available_from = None
        if listing_data.get("available_from"):
            if isinstance(listing_data["available_from"], str):
                try:
                    available_from = self._safe_parse_date(listing_data["available_from"])
                except (ValueError, AttributeError):
                    # If parsing fails, skip this field
                    available_from = None
            else:
                available_from = listing_data["available_from"]

        available_until = None
        if listing_data.get("available_until"):
            if isinstance(listing_data["available_until"], str):
                try:
                    available_until = self._safe_parse_date(listing_data["available_until"])
                except (ValueError, AttributeError):
                    # If parsing fails, skip this field
                    available_until = None
            else:
                available_until = listing_data["available_until"]

        return {
            "id": UUID(listing_data["id"]),
            "user_id": UUID(listing_data["user_id"]),
            "title": listing_data["title"],
            "description": listing_data.get("description"),
            "address": listing_data["address"],
            "city": listing_data["city"],
            "state": listing_data["state"],
            "zip_code": listing_data.get("zip_code"),
            "price": listing_data["price"],
            "bedrooms": listing_data.get("bedrooms"),
            "bathrooms": listing_data.get("bathrooms"),
            "square_feet": listing_data.get("square_feet"),
            "available_from": available_from,
            "available_until": available_until,
            "property_type": listing_data["property_type"],
            "amenities": listing_data.get("amenities", []),
            "images": listing_data.get("images", []),
            "contact_email": listing_data.get("contact_email"),
            "contact_phone": listing_data.get("contact_phone"),
            "is_active": listing_data.get("is_active", True),
            "view_count": listing_data.get("view_count", 0),
            "like_count": listing_data.get("like_count", 0),
            "created_at": (
                self._safe_parse_datetime(listing_data["created_at"])
                if isinstance(listing_data["created_at"], str)
                else listing_data["created_at"]
            ),
            "updated_at": (
                self._safe_parse_datetime(listing_data["updated_at"])
                if isinstance(listing_data["updated_at"], str)
                else listing_data["updated_at"]
            ),
            "user": user_info,
            "is_liked_by_current_user": is_liked,
        }


# Global service instance
_housing_service_instance: Optional[HousingService] = None


def get_housing_service() -> HousingService:
    """
    Get or create the global HousingService instance.

    Returns:
        HousingService: The global service instance.
    """
    global _housing_service_instance
    if _housing_service_instance is None:
        _housing_service_instance = HousingService()
    return _housing_service_instance
