"""
Feed API routes.

Endpoints for creating, reading, updating, and deleting posts, and managing likes.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from backend.api.dependencies.auth import get_current_user, get_optional_current_user
from backend.core.models.auth import UserResponse
from backend.core.models.feed import (
    LikeResponse,
    PostCreate,
    PostListResponse,
    PostResponse,
    PostUpdate,
)
from backend.core.services.feed import (
    FeedService,
    PostNotFoundError,
    UnauthorizedError,
    ValidationError,
    get_feed_service,
)

# Create router
router = APIRouter(
    prefix="/feed",
    tags=["Feed"],
)


@router.post(
    "/upload-media",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Upload media files for posts",
    description="Upload images/videos to Supabase Storage. Returns public URLs.",
)
async def upload_media(
    files: List[UploadFile] = File(..., description="Media files (max 5, max 50MB each)"),
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> dict:
    """
    Upload media files to Supabase Storage.

    Files are stored in: post-media/{user_id}/{unique_filename}
    Returns public URLs that can be used when creating posts.

    Supported formats:
    - Images: jpg, jpeg, png, gif, webp
    - Videos: mp4, mov, avi

    Args:
        files: List of files to upload (max 5, max 50MB each)
        current_user: Authenticated user
        feed_service: Feed service dependency

    Returns:
        dict: Contains media_urls, media_types, and count

    Raises:
        HTTPException 400: Invalid file type or size
        HTTPException 401: Not authenticated
        HTTPException 500: Upload failed

    Example:
        >>> POST /api/feed/upload-media
        >>> Content-Type: multipart/form-data
        >>> files: [image1.jpg, video1.mp4]

        Response:
        {
          "media_urls": ["https://.../abc123.jpg"],
          "media_types": ["image"],
          "count": 1
        }
    """
    try:
        # Read files and prepare for service layer
        file_data = []
        for file in files:
            content = await file.read()
            file_data.append((content, file.content_type, file.filename))

        # Delegate to service layer
        result = await feed_service.upload_media(user_id=current_user.id, files=file_data)

        return result

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Media upload failed: {str(e)}",
        )


@router.delete(
    "/media",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete media file",
    description="Delete a media file from storage. Only the owner can delete.",
)
async def delete_media(
    media_url: str = Query(..., description="Public URL of the media to delete"),
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
):
    """
    Delete a media file from Supabase Storage.

    User must be the owner of the file (must be in their folder).
    Useful for cleaning up media from deleted posts or before post creation.

    Args:
        media_url: Public URL of the media file
        current_user: Authenticated user
        feed_service: Feed service dependency

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Not the file owner
        HTTPException 500: Deletion failed

    Example:
        >>> DELETE /api/feed/media?media_url=https://.../abc123.jpg
    """
    try:
        response = await feed_service.delete_media(user_id=current_user.id, media_url=media_url)
        if response:
            return {"message": "Media deleted successfully"}
        else:
            return {"message": "Failed to delete media"}

    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete media: {str(e)}",
        )


@router.post(
    "/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new post",
    description="Create a new post with optional text content and media attachments.",
)
async def create_post(
    post_data: PostCreate,
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> PostResponse:
    """
    Create a new post in the feed.

    Requires authentication. At least one of content or media must be provided.

    Args:
        post_data: Post creation data (content and/or media)
        current_user: Authenticated user
        feed_service: Feed service dependency

    Returns:
        PostResponse: Created post with user information

    Raises:
        HTTPException 400: Invalid post data
        HTTPException 401: Not authenticated
        HTTPException 500: Server error

    Example:
        >>> POST /api/feed/posts
        >>> {
        >>>   "content": "Great day at campus!",
        >>>   "media_urls": ["https://storage.supabase.co/image.jpg"],
        >>>   "media_types": ["image"]
        >>> }
    """
    try:
        post = await feed_service.create_post(user_id=current_user.id, post_data=post_data)
        return PostResponse(**post)

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create post: {str(e)}",
        )


@router.get(
    "",
    response_model=PostListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get feed",
    description="Get paginated feed of posts. Shows personalized feed for authenticated users.",
)
async def get_feed(
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Posts per page (max 100)"),
    exclude_own_posts: bool = Query(False, description="Whether to exclude own posts"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> PostListResponse:
    """
    Get paginated feed of posts.

    Authentication is optional. If authenticated, excludes user's own posts
    and includes like status for each post.

    Args:
        page: Page number (default 1)
        page_size: Number of posts per page (default 20, max 100)
        exclude_own_posts: Whether to exclude own posts (default False)
        current_user: Optional authenticated user
        feed_service: Feed service dependency

    Returns:
        PostListResponse: Paginated list of posts

    Example:
        >>> GET /api/feed?page=1&page_size=20

        Response:
        {
          "posts": [...],
          "total": 150,
          "page": 1,
          "page_size": 20,
          "has_more": true
        }
    """
    try:
        current_user_id = current_user.id if current_user else None
        feed_data = await feed_service.get_feed(
            current_user_id=current_user_id,
            page=page,
            page_size=page_size,
            exclude_own_posts=exclude_own_posts,
        )

        return PostListResponse(
            posts=[PostResponse(**post) for post in feed_data["posts"]],
            total=feed_data["total"],
            page=feed_data["page"],
            page_size=feed_data["page_size"],
            has_more=feed_data["has_more"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch feed: {str(e)}",
        )


@router.get(
    "/posts/{post_id}",
    response_model=PostResponse,
    status_code=status.HTTP_200_OK,
    summary="Get post by ID",
    description="Get a single post with full details.",
)
async def get_post(
    post_id: UUID,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> PostResponse:
    """
    Get a single post by ID.

    Authentication is optional. If authenticated, includes like status.

    Args:
        post_id: Post unique identifier
        current_user: Optional authenticated user
        feed_service: Feed service dependency

    Returns:
        PostResponse: Post with full details

    Raises:
        HTTPException 404: Post not found
        HTTPException 500: Server error

    Example:
        >>> GET /api/feed/posts/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        current_user_id = current_user.id if current_user else None
        post = await feed_service.get_post_by_id(post_id=post_id, current_user_id=current_user_id)
        return PostResponse(**post)

    except PostNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch post: {str(e)}",
        )


@router.get(
    "/users/{user_id}/posts",
    response_model=PostListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's posts",
    description="Get all posts by a specific user with pagination.",
)
async def get_user_posts(
    user_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Posts per page"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> PostListResponse:
    """
    Get all posts by a specific user.

    Authentication is optional. If authenticated, includes like status.

    Args:
        user_id: User's unique identifier
        page: Page number (default 1)
        page_size: Posts per page (default 20, max 100)
        current_user: Optional authenticated user
        feed_service: Feed service dependency

    Returns:
        PostListResponse: Paginated list of user's posts

    Example:
        >>> GET /api/feed/users/456e7890-e89b-12d3-a456-426614174111/posts?page=1
    """
    try:
        current_user_id = current_user.id if current_user else None
        posts_data = await feed_service.get_user_posts(
            user_id=user_id, current_user_id=current_user_id, page=page, page_size=page_size
        )

        return PostListResponse(
            posts=[PostResponse(**post) for post in posts_data["posts"]],
            total=posts_data["total"],
            page=posts_data["page"],
            page_size=posts_data["page_size"],
            has_more=posts_data["has_more"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user posts: {str(e)}",
        )


@router.put(
    "/posts/{post_id}",
    response_model=PostResponse,
    status_code=status.HTTP_200_OK,
    summary="Update post",
    description="Update a post. Only the post owner can update it.",
)
async def update_post(
    post_id: UUID,
    post_data: PostUpdate,
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> PostResponse:
    """
    Update an existing post.

    Only the post owner can update it. Requires authentication.

    Args:
        post_id: Post unique identifier
        post_data: Updated post data
        current_user: Authenticated user
        feed_service: Feed service dependency

    Returns:
        PostResponse: Updated post

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Not the post owner
        HTTPException 404: Post not found
        HTTPException 500: Server error

    Example:
        >>> PUT /api/feed/posts/123e4567-e89b-12d3-a456-426614174000
        >>> {
        >>>   "content": "Updated content!"
        >>> }
    """
    try:
        post = await feed_service.update_post(
            post_id=post_id, user_id=current_user.id, update_data=post_data
        )
        return PostResponse(**post)

    except PostNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update post: {str(e)}",
        )


@router.delete(
    "/posts/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete post",
    description="Delete a post. Only the post owner can delete it.",
)
async def delete_post(
    post_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
):
    """
    Delete a post.

    Only the post owner can delete it. Requires authentication.
    All associated likes will be deleted automatically (CASCADE).

    Args:
        post_id: Post unique identifier
        current_user: Authenticated user
        feed_service: Feed service dependency

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Not the post owner
        HTTPException 404: Post not found
        HTTPException 500: Server error

    Example:
        >>> DELETE /api/feed/posts/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        await feed_service.delete_post(post_id=post_id, user_id=current_user.id)
        return None

    except PostNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete post: {str(e)}",
        )


@router.post(
    "/posts/{post_id}/like",
    response_model=LikeResponse,
    status_code=status.HTTP_200_OK,
    summary="Like a post",
    description="Like a post. If already liked, returns existing like.",
)
async def like_post(
    post_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
) -> LikeResponse:
    """
    Like a post.

    Requires authentication. If the post is already liked by the user,
    returns the existing like (idempotent operation).

    Args:
        post_id: Post unique identifier
        current_user: Authenticated user
        feed_service: Feed service dependency

    Returns:
        LikeResponse: Like data with user information

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 404: Post not found
        HTTPException 500: Server error

    Example:
        >>> POST /api/feed/posts/123e4567-e89b-12d3-a456-426614174000/like
    """
    try:
        like = await feed_service.like_post(post_id=post_id, user_id=current_user.id)
        return LikeResponse(**like)

    except PostNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to like post: {str(e)}",
        )


@router.delete(
    "/posts/{post_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unlike a post",
    description="Remove like from a post.",
)
async def unlike_post(
    post_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    feed_service: FeedService = Depends(get_feed_service),
):
    """
    Unlike a post.

    Requires authentication. Removes the user's like from the post.
    Idempotent operation (succeeds even if not already liked).

    Args:
        post_id: Post unique identifier
        current_user: Authenticated user
        feed_service: Feed service dependency

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 500: Server error

    Example:
        >>> DELETE /api/feed/posts/123e4567-e89b-12d3-a456-426614174000/like
    """
    try:
        await feed_service.unlike_post(post_id=post_id, user_id=current_user.id)
        return None

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlike post: {str(e)}",
        )


@router.get(
    "/posts/{post_id}/likes",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get post likes",
    description="Get list of users who liked a post with pagination.",
)
async def get_post_likes(
    post_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Likes per page"),
    feed_service: FeedService = Depends(get_feed_service),
) -> dict:
    """
    Get all users who liked a post.

    Returns paginated list of likes with user information.

    Args:
        post_id: Post unique identifier
        page: Page number (default 1)
        page_size: Likes per page (default 50, max 100)
        feed_service: Feed service dependency

    Returns:
        dict: Paginated likes with user info

    Example:
        >>> GET /api/feed/posts/123e4567-e89b-12d3-a456-426614174000/likes?page=1

        Response:
        {
          "likes": [
            {
              "id": "...",
              "user": {"full_name": "John Doe", ...},
              "created_at": "..."
            }
          ],
          "total": 42,
          "page": 1,
          "page_size": 50,
          "has_more": false
        }
    """
    try:
        likes_data = await feed_service.get_post_likes(
            post_id=post_id, page=page, page_size=page_size
        )

        # Convert likes to LikeResponse models
        return {
            "likes": [LikeResponse(**like) for like in likes_data["likes"]],
            "total": likes_data["total"],
            "page": likes_data["page"],
            "page_size": likes_data["page_size"],
            "has_more": likes_data["has_more"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch post likes: {str(e)}",
        )
