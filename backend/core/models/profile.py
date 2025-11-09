"""
Profile data models.

Pydantic models for user profiles, profile updates, and profile search.
"""

import re
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ProfileUpdate(BaseModel):
    """
    Profile update request model.

    All fields are optional for partial updates.
    """

    full_name: Optional[str] = Field(
        None, min_length=2, max_length=100, description="User's full name"
    )
    bio: Optional[str] = Field(None, max_length=500, description="User biography")
    interests: Optional[List[str]] = Field(None, description="List of user interests (max 20)")
    phone_number: Optional[str] = Field(None, description="Phone number")
    graduation_year: Optional[int] = Field(None, description="Expected graduation year")
    major: Optional[str] = Field(None, max_length=100, description="Major/field of study")
    profile_picture_url: Optional[str] = Field(None, description="URL to profile picture")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate full name is not just whitespace."""
        if v is not None and not v.strip():
            raise ValueError("Full name cannot be empty or just whitespace")
        return v.strip() if v else None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format."""
        if v is None:
            return v

        # Remove non-numeric characters for validation
        cleaned = re.sub(r"\D", "", v)

        # Allow 7-15 digits to accommodate various formats
        # 7 digits: local number
        # 10 digits: US number without country code
        # 11 digits: US number with country code (1)
        # Up to 15 digits: international numbers
        if len(cleaned) < 7 or len(cleaned) > 15:
            raise ValueError("Phone number must be between 7-15 digits")

        return v

    @field_validator("graduation_year")
    @classmethod
    def validate_graduation_year(cls, v: Optional[int]) -> Optional[int]:
        """Validate graduation year is within reasonable range."""
        if v is None:
            return v

        current_year = datetime.now().year
        min_year = current_year - 10
        max_year = current_year + 10

        if v < min_year or v > max_year:
            raise ValueError(f"Graduation year must be between {min_year} and {max_year}")

        return v

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate interests list."""
        if v is None:
            return v

        if len(v) > 20:
            raise ValueError("Maximum 20 interests allowed")

        # Validate each interest
        validated_interests = []
        for interest in v:
            if not interest or not interest.strip():
                continue  # Skip empty interests

            if len(interest) > 50:
                raise ValueError("Each interest must be max 50 characters")

            validated_interests.append(interest.strip())

        return validated_interests

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        """Validate bio is not just whitespace."""
        if v is not None and v.strip():
            return v.strip()
        return None  # Return None for empty bio

    @field_validator("major")
    @classmethod
    def validate_major(cls, v: Optional[str]) -> Optional[str]:
        """Validate major is not just whitespace."""
        if v is not None and v.strip():
            return v.strip()
        return None

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "bio": "CS major passionate about AI and music",
                "interests": ["Machine Learning", "Guitar", "Photography"],
                "phone_number": "+1-555-0100",
                "graduation_year": 2025,
                "major": "Computer Science",
            }
        }


class ProfileResponse(BaseModel):
    """
    Complete profile response model (for own profile).

    Includes all profile information including private data.
    """

    id: UUID = Field(..., description="User unique identifier")
    email: str = Field(..., description="User's primary email")
    full_name: str = Field(..., description="User's full name")
    university_id: Optional[UUID] = Field(None, description="University ID")
    university_name: Optional[str] = Field(None, description="University name")
    university_email: str = Field(..., description="University verified email")
    bio: Optional[str] = Field(None, description="User biography")
    interests: List[str] = Field(default_factory=list, description="User interests")
    profile_picture_url: Optional[str] = Field(None, description="Profile picture URL")
    phone_number: Optional[str] = Field(None, description="Phone number")
    graduation_year: Optional[int] = Field(None, description="Graduation year")
    major: Optional[str] = Field(None, description="Major/field of study")
    is_verified: bool = Field(default=False, description="Email verification status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "john.doe@nyu.edu",
                "full_name": "John Doe",
                "university_id": "456e7890-e89b-12d3-a456-426614174111",
                "university_name": "New York University",
                "university_email": "john.doe@nyu.edu",
                "bio": "CS major passionate about AI and music",
                "interests": ["Machine Learning", "Guitar", "Photography"],
                "profile_picture_url": "https://example.com/profile.jpg",
                "phone_number": "+1-555-0100",
                "graduation_year": 2025,
                "major": "Computer Science",
                "is_verified": True,
                "created_at": "2024-01-01T10:00:00Z",
                "updated_at": "2024-01-15T14:30:00Z",
            }
        }


class PublicProfileResponse(BaseModel):
    """
    Public profile response model (for viewing other users).

    Excludes private information like primary email and phone number.
    """

    id: UUID = Field(..., description="User unique identifier")
    full_name: str = Field(..., description="User's full name")
    university_id: Optional[UUID] = Field(None, description="University ID")
    university_name: Optional[str] = Field(None, description="University name")
    university_email: str = Field(..., description="University verified email")
    bio: Optional[str] = Field(None, description="User biography")
    interests: List[str] = Field(default_factory=list, description="User interests")
    profile_picture_url: Optional[str] = Field(None, description="Profile picture URL")
    graduation_year: Optional[int] = Field(None, description="Graduation year")
    major: Optional[str] = Field(None, description="Major/field of study")
    is_verified: bool = Field(default=False, description="Email verification status")
    created_at: datetime = Field(..., description="Account creation timestamp")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "full_name": "John Doe",
                "university_id": "456e7890-e89b-12d3-a456-426614174111",
                "university_name": "New York University",
                "university_email": "john.doe@nyu.edu",
                "bio": "CS major passionate about AI and music",
                "interests": ["Machine Learning", "Guitar", "Photography"],
                "profile_picture_url": "https://example.com/profile.jpg",
                "graduation_year": 2025,
                "major": "Computer Science",
                "is_verified": True,
                "created_at": "2024-01-01T10:00:00Z",
            }
        }


class ProfileSearchRequest(BaseModel):
    """
    Profile search request model.

    Used to search and filter profiles by various criteria.
    """

    query: str = Field(
        ..., min_length=1, max_length=100, description="Search query (name or university)"
    )
    university_id: Optional[UUID] = Field(None, description="Filter by university ID")
    interests: Optional[List[str]] = Field(
        None, description="Filter by interests (must have at least one)"
    )
    graduation_year: Optional[int] = Field(None, description="Filter by graduation year")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate query is not just whitespace."""
        if not v.strip():
            raise ValueError("Search query cannot be empty or just whitespace")
        return v.strip()

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate interests list."""
        if v is None:
            return v

        # Filter out empty interests
        validated = [interest.strip() for interest in v if interest and interest.strip()]

        if not validated:
            return None

        return validated

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "query": "Computer Science",
                "university_id": "456e7890-e89b-12d3-a456-426614174111",
                "interests": ["Machine Learning", "AI"],
                "graduation_year": 2025,
                "page": 1,
                "page_size": 20,
            }
        }


class ProfileListResponse(BaseModel):
    """
    Paginated profile list response model.

    Used for profile search results.
    """

    profiles: List[PublicProfileResponse] = Field(..., description="List of profiles")
    total: int = Field(..., ge=0, description="Total number of profiles")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Items per page")
    has_more: bool = Field(..., description="Whether more profiles are available")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "profiles": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "full_name": "John Doe",
                        "university_name": "NYU",
                        "bio": "CS major",
                        "interests": ["AI", "Music"],
                    }
                ],
                "total": 50,
                "page": 1,
                "page_size": 20,
                "has_more": True,
            }
        }


class ProfileStatsResponse(BaseModel):
    """
    Profile statistics response model.

    Contains aggregated statistics about a user's activity.
    """

    posts_count: int = Field(default=0, ge=0, description="Number of posts created")
    listings_count: int = Field(default=0, ge=0, description="Number of housing listings created")
    connections_count: int = Field(
        default=0, ge=0, description="Number of conversations/connections"
    )
    joined_date: datetime = Field(..., description="Account creation date")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "posts_count": 42,
                "listings_count": 5,
                "connections_count": 28,
                "joined_date": "2024-01-01T10:00:00Z",
            }
        }


class ProfilePictureUploadResponse(BaseModel):
    """
    Profile picture upload response model.

    Contains the URL of the uploaded profile picture.
    """

    profile_picture_url: str = Field(..., description="URL to the uploaded profile picture")
    message: str = Field(
        default="Profile picture uploaded successfully", description="Success message"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "profile_picture_url": "https://supabase.co/storage/profile-pictures/uuid.jpg",
                "message": "Profile picture uploaded successfully",
            }
        }
