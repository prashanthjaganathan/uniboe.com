"""
Feed service.

Handles all post and like operations including CRUD, feed generation, and engagement.
"""

from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from backend.core.models.feed import PostCreate, PostUpdate
from backend.db import supabase


class PostNotFoundError(Exception):
    """Raised when a post is not found."""


class UnauthorizedError(Exception):
    """Raised when user is not authorized to perform an action."""


class ValidationError(Exception):
    """Raised when validation fails."""


class FeedService:
    """
    Service for handling feed operations.

    Manages posts, likes, and feed generation with proper authorization checks.
    """

    async def create_post(self, user_id: UUID, post_data: PostCreate) -> Dict[str, Any]:
        """
        Create a new post.

        Args:
            user_id: ID of the user creating the post
            post_data: Post creation data

        Returns:
            Dict containing the created post with user information

        Raises:
            ValidationError: If post data is invalid

        Example:
            >>> service = FeedService()
            >>> post = await service.create_post(user_id, post_data)
            >>> print(post["content"])
        """
        try:
            # Prepare post data for insertion
            insert_data = {
                "user_id": str(user_id),
                "content": post_data.content,
                "media_urls": post_data.media_urls or [],
                "media_types": post_data.media_types or [],
            }

            # Insert post into database
            response = supabase.table("posts").insert(insert_data).execute()

            if not response.data or len(response.data) == 0:
                raise ValidationError("Failed to create post")

            created_post = response.data[0]

            # Fetch the post with user info
            return await self.get_post_by_id(UUID(created_post["id"]), user_id)

        except Exception as e:
            if isinstance(e, (ValidationError, PostNotFoundError)):
                raise
            raise ValidationError(f"Failed to create post: {str(e)}")

    async def upload_media(
        self, user_id: UUID, files: List[Tuple[bytes, str, str]]
    ) -> Dict[str, Any]:
        """
        Upload media files to Supabase Storage.

        Args:
            user_id: ID of the user uploading files
            files: List of tuples (file_content, content_type, filename)

        Returns:
            Dict containing media_urls, media_types, and count

        Raises:
            ValidationError: If file validation fails or upload fails

        Example:
            >>> service = FeedService()
            >>> files = [(content, "image/jpeg", "photo.jpg")]
            >>> result = await service.upload_media(user_id, files)
            >>> print(result["media_urls"])
        """
        try:
            # Validate file count
            if len(files) > 5:
                raise ValidationError("Maximum 5 files allowed per post")

            # Allowed MIME types
            allowed_images = {
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
            }
            allowed_videos = {
                "video/mp4",
                "video/quicktime",
                "video/x-msvideo",
                "video/avi",
            }
            allowed_types = allowed_images | allowed_videos

            media_urls = []
            media_types = []
            uploaded_paths = []  # Track paths for cleanup on error

            for file_content, content_type, filename in files:
                # Validate MIME type
                if content_type not in allowed_types:
                    raise ValidationError(
                        f"File type '{content_type}' not allowed. "
                        f"Supported: images (jpg, png, gif, webp) and videos (mp4, mov, avi)"
                    )

                # Validate file size (50MB max)
                max_size = 50 * 1024 * 1024  # 50MB
                if len(file_content) > max_size:
                    raise ValidationError(f"File '{filename}' exceeds 50MB limit")

                # Generate unique filename
                file_ext = filename.split(".")[-1] if "." in filename else "jpg"
                unique_filename = f"{uuid4()}.{file_ext}"

                # Storage path: user_id/filename
                storage_path = f"{user_id}/{unique_filename}"

                try:
                    # Upload to Supabase Storage
                    supabase.storage.from_("post-media").upload(
                        path=storage_path,
                        file=file_content,
                        file_options={"content-type": content_type},
                    )

                    # Get public URL
                    public_url = supabase.storage.from_("post-media").get_public_url(storage_path)

                    media_urls.append(public_url)
                    uploaded_paths.append(storage_path)

                    # Determine media type
                    if content_type in allowed_images:
                        media_types.append("image")
                    else:
                        media_types.append("video")

                except Exception as upload_error:
                    # Cleanup: delete any already uploaded files
                    for path in uploaded_paths:
                        try:
                            supabase.storage.from_("post-media").remove([path])
                        except Exception:
                            pass  # Ignore cleanup errors

                    raise ValidationError(f"Upload failed for '{filename}': {str(upload_error)}")

            return {
                "media_urls": media_urls,
                "media_types": media_types,
                "count": len(media_urls),
            }

        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Media upload failed: {str(e)}")

    async def delete_media(self, user_id: UUID, media_url: str) -> bool:
        """
        Delete a media file from Supabase Storage.

        Args:
            user_id: ID of the user (must own the file)
            media_url: Public URL of the media file

        Returns:
            bool: True if successful

        Raises:
            UnauthorizedError: If user doesn't own the file
            ValidationError: If deletion fails

        Example:
            >>> service = FeedService()
            >>> success = await service.delete_media(user_id, media_url)
        """
        try:
            # Extract storage path from URL
            # URL format: https://.../storage/v1/object/public/post-media/{user_id}/{filename}
            if f"post-media/{user_id}/" not in media_url:
                raise UnauthorizedError("You can only delete your own media files")

            # Extract the path after 'post-media/'
            path_parts = media_url.split("post-media/")
            if len(path_parts) < 2:
                raise ValidationError("Invalid media URL")

            storage_path = path_parts[1].split("?")[0]  # Remove query params if any

            # Delete from storage
            supabase.storage.from_("post-media").remove([storage_path])

            return True

        except (UnauthorizedError, ValidationError):
            raise
        except Exception as e:
            raise ValidationError(f"Failed to delete media: {str(e)}")

    async def get_feed(
        self,
        current_user_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
        exclude_own_posts: bool = False,
    ) -> Dict[str, Any]:
        """
        Get paginated feed of posts.

        Args:
            current_user_id: ID of the current user (for like status)
            page: Page number (starts at 1)
            page_size: Number of posts per page
            exclude_own_posts: Whether to exclude current user's posts

        Returns:
            Dict containing:
                - posts: List of post data with user info
                - total: Total number of posts
                - page: Current page number
                - page_size: Posts per page
                - has_more: Whether more posts are available

        Example:
            >>> service = FeedService()
            >>> feed = await service.get_feed(user_id, page=1, page_size=20)
            >>> print(f"Loaded {len(feed['posts'])} posts")
        """
        try:
            # Build the query with user info join
            query = supabase.table("posts").select(
                "*, profiles!posts_user_id_fkey("
                "id, full_name, profile_picture_url, university_id, universities(name)"
                ")"
                ")",
                count="exact",
            )

            # Exclude current user's posts if requested
            if exclude_own_posts and current_user_id:
                query = query.neq("user_id", str(current_user_id))

            # Order by creation time (newest first)
            query = query.order("created_at", desc=True)

            # Get total count first (before pagination)
            count_response = query.execute()
            total = count_response.count if hasattr(count_response, "count") else 0

            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size - 1
            query = query.range(start, end)

            # Execute query
            response = query.execute()

            if not response.data:
                return {
                    "posts": [],
                    "total": 0,
                    "page": page,
                    "page_size": page_size,
                    "has_more": False,
                }

            # Process posts and check like status
            posts = []
            for post_data in response.data:
                post = await self._format_post_response(post_data, current_user_id)
                posts.append(post)

            has_more = (start + len(posts)) < total

            return {
                "posts": posts,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": has_more,
            }

        except Exception as e:
            raise ValidationError(f"Failed to fetch feed: {str(e)}")

    async def get_post_by_id(
        self, post_id: UUID, current_user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Get a single post by ID.

        Args:
            post_id: Post ID to fetch
            current_user_id: ID of current user (for like status)

        Returns:
            Dict containing post data with user info

        Raises:
            PostNotFoundError: If post doesn't exist

        Example:
            >>> service = FeedService()
            >>> post = await service.get_post_by_id(post_id, user_id)
            >>> print(post["content"])
        """
        try:
            # Query post with user info
            response = (
                supabase.table("posts")
                .select(
                    "*, profiles!posts_user_id_fkey("
                    "id, full_name, profile_picture_url, university_id, universities(name)"
                    ")"
                    ")",
                )
                .eq("id", str(post_id))
                .execute()
            )

            if not response.data or len(response.data) == 0:
                raise PostNotFoundError(f"Post {post_id} not found")

            post_data = response.data[0]
            return await self._format_post_response(post_data, current_user_id)

        except PostNotFoundError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to fetch post: {str(e)}")

    async def get_user_posts(
        self,
        user_id: UUID,
        current_user_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Get all posts by a specific user.

        Args:
            user_id: ID of the user whose posts to fetch
            current_user_id: ID of current user (for like status)
            page: Page number
            page_size: Posts per page

        Returns:
            Dict containing paginated posts by the user

        Example:
            >>> service = FeedService()
            >>> user_posts = await service.get_user_posts(user_id)
            >>> print(f"User has {user_posts['total']} posts")
        """
        try:
            # Query user's posts with profile info
            query = (
                supabase.table("posts")
                .select(
                    "*, profiles!posts_user_id_fkey("
                    "id, full_name, profile_picture_url, university_id, universities(name)"
                    ")"
                    ")",
                    count="exact",
                )
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
            )

            # Get total count
            count_response = query.execute()
            total = count_response.count if hasattr(count_response, "count") else 0

            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size - 1
            query = query.range(start, end)

            # Execute query
            response = query.execute()

            # Process posts
            posts = []
            if response.data:
                for post_data in response.data:
                    post = await self._format_post_response(post_data, current_user_id)
                    posts.append(post)

            has_more = (start + len(posts)) < total

            return {
                "posts": posts,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": has_more,
            }

        except Exception as e:
            raise ValidationError(f"Failed to fetch user posts: {str(e)}")

    async def update_post(
        self, post_id: UUID, user_id: UUID, update_data: PostUpdate
    ) -> Dict[str, Any]:
        """
        Update a post.

        Args:
            post_id: ID of the post to update
            user_id: ID of the user (must be post owner)
            update_data: Updated post data

        Returns:
            Dict containing updated post data

        Raises:
            PostNotFoundError: If post doesn't exist
            UnauthorizedError: If user doesn't own the post

        Example:
            >>> service = FeedService()
            >>> updated = await service.update_post(post_id, user_id, update_data)
            >>> print(updated["content"])
        """
        try:
            # Check if post exists and belongs to user
            post_check = supabase.table("posts").select("user_id").eq("id", str(post_id)).execute()

            if not post_check.data or len(post_check.data) == 0:
                raise PostNotFoundError(f"Post {post_id} not found")

            if post_check.data[0]["user_id"] != str(user_id):
                raise UnauthorizedError("You can only update your own posts")

            # Prepare update data
            update_dict = {}
            if update_data.content is not None:
                update_dict["content"] = update_data.content

            if not update_dict:
                # No updates to make, just return current post
                return await self.get_post_by_id(post_id, user_id)

            # Update the post
            response = supabase.table("posts").update(update_dict).eq("id", str(post_id)).execute()

            if not response.data or len(response.data) == 0:
                raise ValidationError("Failed to update post")

            # Return updated post with user info
            return await self.get_post_by_id(post_id, user_id)

        except (PostNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise ValidationError(f"Failed to update post: {str(e)}")

    async def delete_post(self, post_id: UUID, user_id: UUID) -> bool:
        """
        Delete a post.

        Args:
            post_id: ID of the post to delete
            user_id: ID of the user (must be post owner)

        Returns:
            bool: True if successful

        Raises:
            PostNotFoundError: If post doesn't exist
            UnauthorizedError: If user doesn't own the post

        Example:
            >>> service = FeedService()
            >>> success = await service.delete_post(post_id, user_id)
            >>> print(f"Deleted: {success}")
        """
        try:
            # Check if post exists and belongs to user
            post_check = supabase.table("posts").select("user_id").eq("id", str(post_id)).execute()

            if not post_check.data or len(post_check.data) == 0:
                raise PostNotFoundError(f"Post {post_id} not found")

            if post_check.data[0]["user_id"] != str(user_id):
                raise UnauthorizedError("You can only delete your own posts")

            # Delete the post (CASCADE will delete likes)
            supabase.table("posts").delete().eq("id", str(post_id)).execute()

            return True

        except (PostNotFoundError, UnauthorizedError):
            raise
        except Exception as e:
            raise ValidationError(f"Failed to delete post: {str(e)}")

    async def like_post(self, post_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        Like a post.

        Args:
            post_id: ID of the post to like
            user_id: ID of the user liking the post

        Returns:
            Dict containing like data with user info

        Raises:
            PostNotFoundError: If post doesn't exist

        Example:
            >>> service = FeedService()
            >>> like = await service.like_post(post_id, user_id)
            >>> print(f"Liked at: {like['created_at']}")
        """
        try:
            # Check if post exists and get current like count
            post_check = (
                supabase.table("posts").select("id, like_count").eq("id", str(post_id)).execute()
            )

            if not post_check.data or len(post_check.data) == 0:
                raise PostNotFoundError(f"Post {post_id} not found")

            # Check if user already liked this post
            existing_like = (
                supabase.table("post_likes")
                .select("*")
                .eq("post_id", str(post_id))
                .eq("user_id", str(user_id))
                .execute()
            )

            if existing_like.data and len(existing_like.data) > 0:
                # Already liked, return existing like
                like_data = existing_like.data[0]
            else:
                # Create new like
                like_insert = {"post_id": str(post_id), "user_id": str(user_id)}

                response = supabase.table("post_likes").insert(like_insert).execute()

                if not response.data or len(response.data) == 0:
                    raise ValidationError("Failed to create like")

                like_data = response.data[0]

                # Increment like count in posts table
                current_count = post_check.data[0].get("like_count", 0)
                supabase.table("posts").update({"like_count": current_count + 1}).eq(
                    "id", str(post_id)
                ).execute()

            # Get user info for the like
            user_info = (
                supabase.table("profiles")
                .select("id, full_name, profile_picture_url, university_id, universities(name)")
                .eq("id", str(user_id))
                .execute()
            )

            user_dict = {}
            if user_info.data and len(user_info.data) > 0:
                profile = user_info.data[0]
                user_dict = {
                    "id": profile["id"],
                    "full_name": profile["full_name"],
                    "profile_picture_url": profile.get("profile_picture_url"),
                    "university_name": (
                        profile["universities"]["name"] if profile.get("universities") else None
                    ),
                }

            return {
                "id": like_data["id"],
                "post_id": like_data["post_id"],
                "user_id": like_data["user_id"],
                "created_at": like_data["created_at"],
                "user": user_dict,
            }

        except (PostNotFoundError, ValidationError):
            raise
        except Exception as e:
            raise ValidationError(f"Failed to like post: {str(e)}")

    async def unlike_post(self, post_id: UUID, user_id: UUID) -> bool:
        """
        Unlike a post.

        Args:
            post_id: ID of the post to unlike
            user_id: ID of the user unliking the post

        Returns:
            bool: True if successful

        Example:
            >>> service = FeedService()
            >>> success = await service.unlike_post(post_id, user_id)
            >>> print(f"Unliked: {success}")
        """
        try:
            # Check if the like exists before deleting
            existing_like = (
                supabase.table("post_likes")
                .select("id")
                .eq("post_id", str(post_id))
                .eq("user_id", str(user_id))
                .execute()
            )

            # Delete the like
            supabase.table("post_likes").delete().eq("post_id", str(post_id)).eq(
                "user_id", str(user_id)
            ).execute()

            # Only decrement if like existed
            if existing_like.data and len(existing_like.data) > 0:
                # Get current like count and decrement
                post_check = (
                    supabase.table("posts").select("like_count").eq("id", str(post_id)).execute()
                )

                if post_check.data and len(post_check.data) > 0:
                    current_count = post_check.data[0].get("like_count", 0)
                    new_count = max(0, current_count - 1)  # Ensure it doesn't go below 0
                    supabase.table("posts").update({"like_count": new_count}).eq(
                        "id", str(post_id)
                    ).execute()

            # Return True even if like didn't exist (idempotent)
            return True

        except Exception as e:
            raise ValidationError(f"Failed to unlike post: {str(e)}")

    async def get_post_likes(
        self, post_id: UUID, page: int = 1, page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Get all users who liked a post.

        Args:
            post_id: ID of the post
            page: Page number
            page_size: Likes per page

        Returns:
            Dict containing paginated likes with user info

        Example:
            >>> service = FeedService()
            >>> likes = await service.get_post_likes(post_id)
            >>> print(f"{likes['total']} users liked this post")
        """
        try:
            # Query likes with user info
            query = (
                supabase.table("post_likes")
                .select(
                    "*, profiles!post_likes_user_id_fkey("
                    "id, full_name, profile_picture_url, university_id, universities(name))",
                    count="exact",
                )
                .eq("post_id", str(post_id))
                .order("created_at", desc=True)
            )

            # Get total count
            count_response = query.execute()
            total = count_response.count if hasattr(count_response, "count") else 0

            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size - 1
            query = query.range(start, end)

            # Execute query
            response = query.execute()

            # Process likes
            likes = []
            if response.data:
                for like_data in response.data:
                    profile = like_data.get("profiles", {})
                    user_dict = {
                        "id": profile.get("id"),
                        "full_name": profile.get("full_name"),
                        "profile_picture_url": profile.get("profile_picture_url"),
                        "university_name": (
                            profile.get("universities", {}).get("name")
                            if profile.get("universities")
                            else None
                        ),
                    }

                    likes.append(
                        {
                            "id": like_data["id"],
                            "post_id": like_data["post_id"],
                            "user_id": like_data["user_id"],
                            "created_at": like_data["created_at"],
                            "user": user_dict,
                        }
                    )

            has_more = (start + len(likes)) < total

            return {
                "likes": likes,
                "total": total,
                "page": page,
                "page_size": page_size,
                "has_more": has_more,
            }

        except Exception as e:
            raise ValidationError(f"Failed to fetch post likes: {str(e)}")

    async def _format_post_response(
        self, post_data: Dict[str, Any], current_user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Format post data for response.

        Args:
            post_data: Raw post data from database
            current_user_id: ID of current user (for like status)

        Returns:
            Dict formatted for PostResponse model
        """
        # Extract user info from profiles join
        profile = post_data.get("profiles", {})
        user_dict = {
            "id": profile.get("id"),
            "full_name": profile.get("full_name"),
            "profile_picture_url": profile.get("profile_picture_url"),
            "university_name": (
                profile.get("universities", {}).get("name") if profile.get("universities") else None
            ),
        }

        # Check if current user liked this post
        is_liked = None
        if current_user_id:
            like_check = (
                supabase.table("post_likes")
                .select("id")
                .eq("post_id", post_data["id"])
                .eq("user_id", str(current_user_id))
                .execute()
            )
            is_liked = bool(like_check.data and len(like_check.data) > 0)

        return {
            "id": post_data["id"],
            "user_id": post_data["user_id"],
            "content": post_data.get("content"),
            "media_urls": post_data.get("media_urls", []),
            "media_types": post_data.get("media_types", []),
            "like_count": post_data.get("like_count", 0),
            "comment_count": post_data.get("comment_count", 0),
            "created_at": post_data["created_at"],
            "updated_at": post_data["updated_at"],
            "user": user_dict,
            "is_liked_by_current_user": is_liked,
        }


# Global service instance
_feed_service_instance: Optional[FeedService] = None


def get_feed_service() -> FeedService:
    """
    Get or create the global FeedService instance.

    Returns:
        FeedService: The global service instance
    """
    global _feed_service_instance
    if _feed_service_instance is None:
        _feed_service_instance = FeedService()
    return _feed_service_instance
