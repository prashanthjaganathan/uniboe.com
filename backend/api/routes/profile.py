"""
Profile API routes.

Endpoints for viewing, updating, and searching user profiles.
"""

import uuid as uuid_module
from pathlib import Path
from typing import Optional, Union
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from backend.api.dependencies.auth import get_current_user, get_optional_current_user
from backend.core.models.auth import UserResponse
from backend.core.models.profile import (
    ProfileListResponse,
    ProfilePictureUploadResponse,
    ProfileResponse,
    ProfileSearchRequest,
    ProfileStatsResponse,
    ProfileUpdate,
    PublicProfileResponse,
)
from backend.core.services.profile import (
    ProfileNotFoundError,
    ProfileService,
    ValidationError,
    get_profile_service,
)
from backend.db import supabase

# Create router
router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


@router.get(
    "/me",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user's profile",
    description="Get the complete profile for the authenticated user.",
)
async def get_my_profile(
    current_user: UserResponse = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    """
    Get current user's complete profile.

    Returns all profile information including private data (email, phone number).

    Args:
        current_user: Authenticated user.
        profile_service: Profile service dependency.

    Returns:
        ProfileResponse: Complete profile with all fields.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 404: Profile not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/profile/me
        >>> Authorization: Bearer <token>
    """
    try:
        profile = await profile_service.get_current_user_profile(user_id=current_user.id)
        return ProfileResponse(**profile)

    except ProfileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}",
        )


@router.put(
    "/me",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user's profile",
    description="Update profile information. Only provided fields will be updated.",
)
async def update_my_profile(
    update_data: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    """
    Update current user's profile.

    Partial updates are supported - only provided fields will be updated.
    Protected fields (id, email, university_id, etc.) cannot be updated.

    Args:
        update_data: Profile update data.
        current_user: Authenticated user.
        profile_service: Profile service dependency.

    Returns:
        ProfileResponse: Updated complete profile.

    Raises:
        HTTPException 400: Invalid update data.
        HTTPException 401: Not authenticated.
        HTTPException 404: Profile not found.
        HTTPException 500: Server error.

    Example:
        >>> PUT /api/profile/me
        >>> Authorization: Bearer <token>
        >>> {
        >>>   "bio": "Updated bio",
        >>>   "interests": ["AI", "Music"],
        >>>   "phone_number": "+1-555-0100"
        >>> }
    """
    try:
        updated_profile = await profile_service.update_profile(
            user_id=current_user.id, update_data=update_data
        )
        return ProfileResponse(**updated_profile)

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ProfileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )


@router.get(
    "/{user_id}",
    response_model=Union[ProfileResponse, PublicProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user profile by ID",
    description="Get a user's profile. Returns full profile if viewing own, "
    "public profile otherwise.",
)
async def get_user_profile(
    user_id: UUID,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> Union[ProfileResponse, PublicProfileResponse]:
    """
    Get user profile by ID.
    If viewing own profile, returns complete ProfileResponse.
    If viewing another user's profile, returns PublicProfileResponse (no email, no phone).
    Args:
        user_id: User ID to fetch.
        current_user: Optional authenticated user.
        profile_service: Profile service dependency.

    Returns:
        Union[ProfileResponse, PublicProfileResponse]: Full or public profile.

    Raises:
        HTTPException 404: User not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/profile/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        viewer_id = current_user.id if current_user else None
        profile = await profile_service.get_profile_by_id(profile_id=user_id, viewer_id=viewer_id)

        # Determine if this is own profile
        is_own_profile = current_user and current_user.id == user_id

        if is_own_profile:
            return ProfileResponse(**profile)
        else:
            return PublicProfileResponse(**profile)

    except ProfileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}",
        )


@router.get(
    "/me/stats",
    response_model=ProfileStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get profile statistics",
    description="Get statistics for the current user's activity.",
)
async def get_my_stats(
    current_user: UserResponse = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> ProfileStatsResponse:
    """
    Get current user's profile statistics.

    Includes:
    - Posts count
    - Active housing listings count
    - Conversations count
    - Joined date

    Args:
        current_user: Authenticated user.
        profile_service: Profile service dependency.

    Returns:
        ProfileStatsResponse: Profile statistics.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 404: Profile not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/profile/me/stats
        >>> Authorization: Bearer <token>
    """
    try:
        stats = await profile_service.get_profile_stats(user_id=current_user.id)
        return ProfileStatsResponse(**stats)

    except ProfileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile stats: {str(e)}",
        )


@router.post(
    "/search",
    response_model=ProfileListResponse,
    status_code=status.HTTP_200_OK,
    summary="Search profiles",
    description="Search for user profiles by name, university, interests, etc.",
)
async def search_profiles(
    search_request: ProfileSearchRequest,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> ProfileListResponse:
    """
    Search for user profiles.

    Search by:
    - Name (query parameter, case-insensitive)
    - University ID (exact match)
    - Interests (profiles with at least one matching interest)
    - Graduation year (exact match)

    Results exclude the current user's own profile.

    Args:
        search_request: Search criteria and pagination.
        current_user: Optional authenticated user.
        profile_service: Profile service dependency.

    Returns:
        ProfileListResponse: Paginated list of public profiles.

    Raises:
        HTTPException 400: Invalid search criteria.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/profile/search
        >>> {
        >>>   "query": "Computer Science",
        >>>   "university_id": "456e7890-e89b-12d3-a456-426614174111",
        >>>   "interests": ["AI", "Machine Learning"],
        >>>   "graduation_year": 2025,
        >>>   "page": 1,
        >>>   "page_size": 20
        >>> }
    """
    try:
        viewer_id = current_user.id if current_user else None
        result = await profile_service.search_profiles(
            search_request=search_request, viewer_id=viewer_id
        )
        return ProfileListResponse(**result)

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search profiles: {str(e)}",
        )


@router.post(
    "/me/picture",
    response_model=ProfilePictureUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload profile picture",
    description="Upload a new profile picture (max 2MB, jpg/png/webp).",
)
async def upload_profile_picture(
    file: UploadFile = File(..., description="Profile picture image file"),
    current_user: UserResponse = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> ProfilePictureUploadResponse:
    """
    Upload profile picture.

    Uploads image to Supabase Storage and updates profile.

    Restrictions:
    - File types: image/jpeg, image/png, image/webp
    - Max size: 20MB

    Args:
        file: Uploaded image file.
        current_user: Authenticated user.
        profile_service: Profile service dependency.

    Returns:
        ProfilePictureUploadResponse: Public URL of uploaded image.

    Raises:
        HTTPException 400: Invalid file type or size.
        HTTPException 401: Not authenticated.
        HTTPException 500: Upload or server error.

    Example:
        >>> POST /api/profile/me/picture
        >>> Authorization: Bearer <token>
        >>> Content-Type: multipart/form-data
        >>> file: <image_file>
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Allowed: {', '.join(allowed_types)}",
        )

    try:
        # Read file contents
        contents = await file.read()

        # Validate file size (2MB)
        max_size = 20 * 1024 * 1024  # 20MB in bytes
        if len(contents) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({len(contents)} bytes) exceeds 2MB limit",
            )

        # Generate unique filename
        extension = Path(file.filename).suffix if file.filename else ".jpg"
        filename = f"{uuid_module.uuid4()}{extension}"

        # Upload to Supabase Storage
        user_id = current_user.id
        storage_path = f"{user_id}/{filename}"

        # Upload file
        supabase.storage.from_("profile-pictures").upload(
            path=storage_path, file=contents, file_options={"content-type": file.content_type}
        )

        # Get public URL
        public_url = supabase.storage.from_("profile-pictures").get_public_url(storage_path)

        # Update profile with new picture URL
        await profile_service.update_profile(
            user_id=user_id, update_data=ProfileUpdate(profile_picture_url=public_url)
        )

        return ProfilePictureUploadResponse(
            profile_picture_url=public_url, message="Profile picture uploaded successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}",
        )


@router.delete(
    "/me/picture",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete profile picture",
    description="Delete the current user's profile picture.",
)
async def delete_profile_picture(
    current_user: UserResponse = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
):
    """
    Delete profile picture.

    Removes profile picture from Supabase Storage and updates profile.

    Args:
        current_user: Authenticated user.
        profile_service: Profile service dependency.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 404: Profile not found.
        HTTPException 500: Deletion or server error.

    Example:
        >>> DELETE /api/profile/me/picture
        >>> Authorization: Bearer <token>
    """
    try:
        await profile_service.delete_profile_picture(user_id=current_user.id)
        return None

    except ProfileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile picture: {str(e)}",
        )


@router.get(
    "/email/{email}",
    response_model=PublicProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Find user by email",
    description="Search for a user by email address. Returns public profile if found.",
)
async def get_user_by_email(
    email: str,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
) -> PublicProfileResponse:
    """
    Find user by email address.

    Searches by email or university_email. Useful for finding users to start
    conversations with.

    Args:
        email: Email address to search for.
        current_user: Optional authenticated user.
        profile_service: Profile service dependency.

    Returns:
        PublicProfileResponse: Public profile of the found user.

    Raises:
        HTTPException 404: User not found.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/profile/email/john.doe@nyu.edu
    """
    try:
        profile = await profile_service.get_user_by_email(email=email)

        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=f"User with email '{email}' not found"
            )

        return PublicProfileResponse(**profile)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search user by email: {str(e)}",
        )
