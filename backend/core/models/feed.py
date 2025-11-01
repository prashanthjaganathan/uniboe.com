"""
Feed data models.

Pydantic models for posts, likes, and feed-related operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PostCreate(BaseModel):
    """
    Post creation request model.

    At least one of content or media_urls must be provided.
    """

    content: Optional[str] = Field(
        None, max_length=5000, description="Post text content (max 5000 characters)"
    )
    media_urls: Optional[List[str]] = Field(
        default_factory=list, description="List of media URLs (images/videos)"
    )
    media_types: Optional[List[str]] = Field(
        default_factory=list, description="List of media types ('image' or 'video')"
    )

    @field_validator("content")
    @classmethod
    def validate_content_length(cls, v: Optional[str]) -> Optional[str]:
        """Validate content is not just whitespace."""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v

    @field_validator("media_types")
    @classmethod
    def validate_media_types(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate media types are either 'image' or 'video'."""
        if v is not None:
            for media_type in v:
                if media_type not in ["image", "video"]:
                    raise ValueError(f"Media type must be 'image' or 'video', got: {media_type}")
        return v

    def model_post_init(self, __context: Any) -> None:
        """Validate that at least content or media is provided and arrays match."""
        has_content = self.content is not None and len(self.content.strip()) > 0
        has_media = self.media_urls is not None and len(self.media_urls) > 0

        if not has_content and not has_media:
            raise ValueError("At least one of 'content' or 'media_urls' must be provided")

        # Validate media URLs match media types length
        if self.media_urls and self.media_types:
            if len(self.media_urls) != len(self.media_types):
                raise ValueError(
                    f"Number of media_urls ({len(self.media_urls)}) must match "
                    f"media_types ({len(self.media_types)})"
                )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "content": "Great day at campus! Check out this photo.",
                "media_urls": ["https://storage.supabase.co/post-media/image123.jpg"],
                "media_types": ["image"],
            }
        }


class PostUpdate(BaseModel):
    """
    Post update request model.

    All fields are optional for partial updates.
    """

    content: Optional[str] = Field(None, max_length=5000, description="Updated post text content")

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: Optional[str]) -> Optional[str]:
        """Validate content is not just whitespace if provided."""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                raise ValueError("Content cannot be empty or just whitespace")
        return v

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"content": "Updated: Great day at campus!"}}


class PostResponse(BaseModel):
    """
    Post response model for API responses.

    Contains complete post information including user data and engagement metrics.
    """

    id: UUID = Field(..., description="Post unique identifier")
    user_id: UUID = Field(..., description="Author's user ID")
    content: Optional[str] = Field(None, description="Post text content")
    media_urls: List[str] = Field(default_factory=list, description="List of media URLs")
    media_types: List[str] = Field(default_factory=list, description="List of media types")
    like_count: int = Field(default=0, description="Number of likes")
    comment_count: int = Field(default=0, description="Number of comments")
    created_at: datetime = Field(..., description="Post creation timestamp")
    updated_at: datetime = Field(..., description="Post last update timestamp")
    user: Dict[str, Any] = Field(..., description="Author user information")
    is_liked_by_current_user: Optional[bool] = Field(
        None, description="Whether current user has liked this post"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "456e7890-e89b-12d3-a456-426614174111",
                "content": "Great day at campus!",
                "media_urls": ["https://storage.supabase.co/post-media/image123.jpg"],
                "media_types": ["image"],
                "like_count": 42,
                "comment_count": 5,
                "created_at": "2024-01-01T12:00:00Z",
                "updated_at": "2024-01-01T12:00:00Z",
                "user": {
                    "id": "456e7890-e89b-12d3-a456-426614174111",
                    "full_name": "John Doe",
                    "profile_picture_url": "https://storage.supabase.co/avatars/user123.jpg",
                    "university_name": "New York University",
                },
                "is_liked_by_current_user": False,
            }
        }


class PostListResponse(BaseModel):
    """
    Paginated post list response model.

    Used for feed endpoints with pagination support.
    """

    posts: List[PostResponse] = Field(..., description="List of posts")
    total: int = Field(..., description="Total number of posts")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of posts per page")
    has_more: bool = Field(..., description="Whether more posts are available")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "posts": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "user_id": "456e7890-e89b-12d3-a456-426614174111",
                        "content": "Great day at campus!",
                        "media_urls": [],
                        "media_types": [],
                        "like_count": 42,
                        "comment_count": 5,
                        "created_at": "2024-01-01T12:00:00Z",
                        "updated_at": "2024-01-01T12:00:00Z",
                        "user": {
                            "id": "456e7890-e89b-12d3-a456-426614174111",
                            "full_name": "John Doe",
                            "profile_picture_url": None,
                            "university_name": "New York University",
                        },
                        "is_liked_by_current_user": False,
                    }
                ],
                "total": 150,
                "page": 1,
                "page_size": 20,
                "has_more": True,
            }
        }


class LikeResponse(BaseModel):
    """
    Like response model.

    Contains like information including user data.
    """

    id: UUID = Field(..., description="Like unique identifier")
    post_id: UUID = Field(..., description="Post ID that was liked")
    user_id: UUID = Field(..., description="User ID who liked the post")
    created_at: datetime = Field(..., description="Like creation timestamp")
    user: Dict[str, Any] = Field(..., description="User information")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "789e0123-e89b-12d3-a456-426614174222",
                "post_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "456e7890-e89b-12d3-a456-426614174111",
                "created_at": "2024-01-01T12:30:00Z",
                "user": {
                    "id": "456e7890-e89b-12d3-a456-426614174111",
                    "full_name": "John Doe",
                    "profile_picture_url": None,
                    "university_name": "New York University",
                },
            }
        }


class LikeRequest(BaseModel):
    """
    Like/Unlike request model.

    Simple model for toggling like status on a post.
    """

    post_id: UUID = Field(..., description="Post ID to like/unlike")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"post_id": "123e4567-e89b-12d3-a456-426614174000"}}
