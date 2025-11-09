"""
Housing API routes.

Endpoints for creating, reading, updating, and deleting housing listings,
managing search and filters, and handling likes.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from backend.api.dependencies.auth import get_current_user, get_optional_current_user
from backend.core.models.auth import UserResponse
from backend.core.models.housing import (
    HousingLikeResponse,
    HousingListingCreate,
    HousingListingResponse,
    HousingListingUpdate,
    HousingListResponse,
    HousingSearchFilters,
)
from backend.core.services.housing import (
    HousingService,
    ListingNotFoundError,
    UnauthorizedError,
    ValidationError,
    get_housing_service,
)

# Create router
router = APIRouter(
    prefix="/housing",
    tags=["Housing"],
)


@router.post(
    "/upload-media",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Upload housing images",
    description="Upload images for a housing listing. Returns URLs.",
)
async def upload_housing_media(
    files: List[UploadFile] = File(..., description="Image files (max 10, max 10MB each)"),
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> dict:
    """
    Upload images for housing listings.

    Files stored in: housing-images/{user_id}/{unique_filename}
    Returns public URLs to use when creating/updating listings.

    Supported formats: jpg, jpeg, png, gif, webp
    Max 10 images, 10MB each

    Args:
        files: List of image files
        current_user: Authenticated user
        housing_service: Housing service dependency

    Returns:
        dict: image_urls array and count

    Example Response:
        {
          "image_urls": [
            "https://.../housing-images/user-id/abc.jpg"
          ],
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
        result = await housing_service.upload_housing_media(
            user_id=current_user.id, files=file_data
        )

        return result

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Housing media upload failed: {str(e)}",
        )


@router.delete(
    "/media",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Delete housing image",
    description="Delete an image file from storage.",
)
async def delete_housing_media(
    image_url: str = Query(..., description="Public URL of the image to delete"),
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> dict:
    """
    Delete a housing image from storage.

    User must own the file.

    Args:
        image_url: Public URL of the image
        current_user: Authenticated user
        housing_service: Housing service dependency

    Returns:
        Success message
    """
    try:
        await housing_service.delete_housing_media(user_id=current_user.id, image_url=image_url)

        return {"message": "Housing image deleted successfully", "image_url": image_url}

    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete housing image: {str(e)}",
        )


@router.post(
    "/listings",
    response_model=HousingListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new housing listing",
    description="Create a new housing listing. Requires authentication.",
)
async def create_listing(
    listing_data: HousingListingCreate,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListingResponse:
    """
    Create a new housing listing.

    Requires authentication. User becomes the owner of the listing.

    Args:
        listing_data: Listing creation data.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListingResponse: Created listing with user information.

    Raises:
        HTTPException 400: Invalid listing data.
        HTTPException 401: Not authenticated.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/housing/listings
        >>> {
        >>>   "title": "Cozy 2BR near NYU",
        >>>   "address": "123 Main St",
        >>>   "city": "New York",
        >>>   "state": "NY",
        >>>   "price": 2500.00,
        >>>   "property_type": "sublet",
        >>>   "contact_email": "john@nyu.edu"
        >>> }
    """
    try:
        listing = await housing_service.create_listing(
            user_id=current_user.id, listing_data=listing_data
        )
        return HousingListingResponse(**listing)

    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create listing: {str(e)}",
        )


@router.get(
    "/listings",
    response_model=HousingListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get housing listings",
    description="Get paginated housing listings with optional filters and sorting.",
)
async def get_listings(
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum monthly rent"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum monthly rent"),
    bedrooms: Optional[int] = Query(None, ge=0, description="Number of bedrooms"),
    bathrooms: Optional[float] = Query(None, ge=0, description="Number of bathrooms"),
    property_type: Optional[str] = Query(
        None, description="Type of property (apartment, sublet, room, house)"
    ),
    city: Optional[str] = Query(None, description="City name"),
    state: Optional[str] = Query(None, description="State code"),
    sort_by: str = Query(
        "created_at", description="Sort field (created_at, price, like_count, view_count)"
    ),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListResponse:
    """
    Get paginated housing listings with optional filters.

    Authentication is optional. Supports filtering by price, bedrooms, property type, location, etc.

    Args:
        page: Page number (default 1).
        page_size: Items per page (default 20, max 100).
        min_price: Minimum monthly rent filter.
        max_price: Maximum monthly rent filter.
        bedrooms: Number of bedrooms filter.
        bathrooms: Number of bathrooms filter.
        property_type: Type of property filter.
        city: City name filter (case-insensitive).
        state: State code filter (case-insensitive).
        sort_by: Field to sort by (default created_at).
        sort_order: Sort order (default desc).
        current_user: Optional authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListResponse: Paginated list of listings.

    Example:
        >>> GET /api/housing/listings?city=New%20York&min_price=1000&max_price=3000&bedrooms=2
    """
    try:
        # Build filters object from query params
        filters = None
        if any([min_price, max_price, bedrooms, bathrooms, property_type, city, state]):
            filters = HousingSearchFilters(
                min_price=min_price,
                max_price=max_price,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                property_type=property_type,
                city=city,
                state=state,
            )

        current_user_id = current_user.id if current_user else None
        listings_data = await housing_service.get_listings(
            filters=filters,
            current_user_id=current_user_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        return HousingListResponse(
            listings=[HousingListingResponse(**listing) for listing in listings_data["listings"]],
            total=listings_data["total"],
            page=listings_data["page"],
            page_size=listings_data["page_size"],
            has_more=listings_data["has_more"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch listings: {str(e)}",
        )


@router.get(
    "/listings/{listing_id}",
    response_model=HousingListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Get listing by ID",
    description="Get a single housing listing with full details. Increments view count.",
)
async def get_listing(
    listing_id: UUID,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListingResponse:
    """
    Get a single housing listing by ID.

    Authentication is optional. View count is automatically incremented.
    If authenticated, includes like status.

    Args:
        listing_id: Listing unique identifier.
        current_user: Optional authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListingResponse: Listing with full details.

    Raises:
        HTTPException 404: Listing not found or not active.
        HTTPException 500: Server error.

    Example:
        >>> GET /api/housing/listings/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        current_user_id = current_user.id if current_user else None
        listing = await housing_service.get_listing_by_id(
            listing_id=listing_id, current_user_id=current_user_id, increment_views=True
        )
        return HousingListingResponse(**listing)

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch listing: {str(e)}",
        )


@router.get(
    "/search",
    response_model=HousingListResponse,
    status_code=status.HTTP_200_OK,
    summary="Search listings by location",
    description="Search housing listings by city, state, or address.",
)
async def search_listings(
    q: str = Query(..., min_length=2, description="Search query (city, state, or address)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListResponse:
    """
    Search housing listings by location.

    Searches in city, state, and address fields (case-insensitive).
    Authentication is optional.

    Args:
        q: Search query string (minimum 2 characters).
        page: Page number (default 1).
        page_size: Items per page (default 20, max 100).
        current_user: Optional authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListResponse: Paginated list of matching listings.

    Example:
        >>> GET /api/housing/search?q=Brooklyn&page=1
    """
    try:
        current_user_id = current_user.id if current_user else None
        listings_data = await housing_service.search_by_location(
            query=q, current_user_id=current_user_id, page=page, page_size=page_size
        )

        return HousingListResponse(
            listings=[HousingListingResponse(**listing) for listing in listings_data["listings"]],
            total=listings_data["total"],
            page=listings_data["page"],
            page_size=listings_data["page_size"],
            has_more=listings_data["has_more"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search listings: {str(e)}",
        )


@router.get(
    "/users/{user_id}/listings",
    response_model=HousingListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's listings",
    description="Get all housing listings by a specific user.",
)
async def get_user_listings(
    user_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListResponse:
    """
    Get all listings by a specific user.

    Authentication is optional. If viewing own listings, includes inactive listings.

    Args:
        user_id: User's unique identifier.
        page: Page number (default 1).
        page_size: Items per page (default 20, max 100).
        current_user: Optional authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListResponse: Paginated list of user's listings.

    Example:
        >>> GET /api/housing/users/456e7890-e89b-12d3-a456-426614174111/listings
    """
    try:
        current_user_id = current_user.id if current_user else None
        include_inactive = (current_user_id == user_id) if current_user_id else False

        listings_data = await housing_service.get_user_listings(
            user_id=user_id,
            current_user_id=current_user_id,
            page=page,
            page_size=page_size,
            include_inactive=include_inactive,
        )

        return HousingListResponse(
            listings=[HousingListingResponse(**listing) for listing in listings_data["listings"]],
            total=listings_data["total"],
            page=listings_data["page"],
            page_size=listings_data["page_size"],
            has_more=listings_data["has_more"],
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user listings: {str(e)}",
        )


@router.put(
    "/listings/{listing_id}",
    response_model=HousingListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Update listing",
    description="Update a housing listing. Only the listing owner can update it.",
)
async def update_listing(
    listing_id: UUID,
    listing_data: HousingListingUpdate,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListingResponse:
    """
    Update an existing housing listing.

    Only the listing owner can update it. Requires authentication.

    Args:
        listing_id: Listing unique identifier.
        listing_data: Updated listing data.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListingResponse: Updated listing.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: Not the listing owner.
        HTTPException 404: Listing not found.
        HTTPException 500: Server error.

    Example:
        >>> PUT /api/housing/listings/123e4567-e89b-12d3-a456-426614174000
        >>> {
        >>>   "title": "Updated Title",
        >>>   "price": 2600.00
        >>> }
    """
    try:
        listing = await housing_service.update_listing(
            listing_id=listing_id, user_id=current_user.id, update_data=listing_data
        )
        return HousingListingResponse(**listing)

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update listing: {str(e)}",
        )


@router.delete(
    "/listings/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete listing",
    description="Soft delete a listing (deactivate). Only the owner can delete it.",
)
async def delete_listing(
    listing_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
):
    """
    Soft delete a housing listing (set is_active = False).

    Only the listing owner can delete it. Requires authentication.
    Listing can be reactivated later.

    Args:
        listing_id: Listing unique identifier.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: Not the listing owner.
        HTTPException 404: Listing not found.
        HTTPException 500: Server error.

    Example:
        >>> DELETE /api/housing/listings/123e4567-e89b-12d3-a456-426614174000
    """
    try:
        await housing_service.delete_listing(listing_id=listing_id, user_id=current_user.id)
        return None

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete listing: {str(e)}",
        )


@router.post(
    "/listings/{listing_id}/activate",
    response_model=HousingListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate listing",
    description="Reactivate a deactivated listing. Only the owner can activate it.",
)
async def activate_listing(
    listing_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListingResponse:
    """
    Activate a deactivated listing (set is_active = True).

    Only the listing owner can activate it. Requires authentication.

    Args:
        listing_id: Listing unique identifier.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListingResponse: Activated listing.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: Not the listing owner.
        HTTPException 404: Listing not found.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/housing/listings/123e4567-e89b-12d3-a456-426614174000/activate
    """
    try:
        listing = await housing_service.activate_listing(
            listing_id=listing_id, user_id=current_user.id
        )
        return HousingListingResponse(**listing)

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate listing: {str(e)}",
        )


@router.post(
    "/listings/{listing_id}/deactivate",
    response_model=HousingListingResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate listing",
    description="Deactivate a listing. Only the owner can deactivate it.",
)
async def deactivate_listing(
    listing_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingListingResponse:
    """
    Deactivate a listing (set is_active = False).

    Only the listing owner can deactivate it. Requires authentication.

    Args:
        listing_id: Listing unique identifier.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingListingResponse: Deactivated listing.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 403: Not the listing owner.
        HTTPException 404: Listing not found.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/housing/listings/123e4567-e89b-12d3-a456-426614174000/deactivate
    """
    try:
        await housing_service.deactivate_listing(listing_id=listing_id, user_id=current_user.id)
        # Fetch the deactivated listing to return
        listing = await housing_service.get_listing_by_id(
            listing_id=listing_id, current_user_id=current_user.id, increment_views=False
        )
        return HousingListingResponse(**listing)

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate listing: {str(e)}",
        )


@router.post(
    "/listings/{listing_id}/like",
    response_model=HousingLikeResponse,
    status_code=status.HTTP_200_OK,
    summary="Like a listing",
    description="Like a housing listing. If already liked, returns existing like.",
)
async def like_listing(
    listing_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
) -> HousingLikeResponse:
    """
    Like a housing listing.

    Requires authentication. If the listing is already liked by the user,
    returns the existing like (idempotent operation).

    Args:
        listing_id: Listing unique identifier.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Returns:
        HousingLikeResponse: Like data with user information.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 404: Listing not found or not active.
        HTTPException 500: Server error.

    Example:
        >>> POST /api/housing/listings/123e4567-e89b-12d3-a456-426614174000/like
    """
    try:
        like = await housing_service.like_listing(listing_id=listing_id, user_id=current_user.id)
        return HousingLikeResponse(**like)

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to like listing: {str(e)}",
        )


@router.delete(
    "/listings/{listing_id}/like",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unlike a listing",
    description="Remove like from a housing listing.",
)
async def unlike_listing(
    listing_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    housing_service: HousingService = Depends(get_housing_service),
):
    """
    Unlike a housing listing.

    Requires authentication. Removes the user's like from the listing.
    Idempotent operation (succeeds even if not already liked).

    Args:
        listing_id: Listing unique identifier.
        current_user: Authenticated user.
        housing_service: Housing service dependency.

    Raises:
        HTTPException 401: Not authenticated.
        HTTPException 500: Server error.

    Example:
        >>> DELETE /api/housing/listings/123e4567-e89b-12d3-a456-426614174000/like
    """
    try:
        await housing_service.unlike_listing(listing_id=listing_id, user_id=current_user.id)
        return None

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlike listing: {str(e)}",
        )


@router.get(
    "/listings/{listing_id}/likes",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get listing likes",
    description="Get list of users who liked a housing listing with pagination.",
)
async def get_listing_likes(
    listing_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Likes per page"),
    housing_service: HousingService = Depends(get_housing_service),
) -> dict:
    """
    Get all users who liked a listing.

    Returns paginated list of likes with user information.

    Args:
        listing_id: Listing unique identifier.
        page: Page number (default 1).
        page_size: Likes per page (default 50, max 100).
        housing_service: Housing service dependency.

    Returns:
        dict: Paginated likes with user info.

    Example:
        >>> GET /api/housing/listings/123e4567-e89b-12d3-a456-426614174000/likes?page=1

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
        likes_data = await housing_service.get_listing_likes(
            listing_id=listing_id, page=page, page_size=page_size
        )

        # Convert likes to HousingLikeResponse models
        return {
            "likes": [HousingLikeResponse(**like) for like in likes_data["likes"]],
            "total": likes_data["total"],
            "page": likes_data["page"],
            "page_size": likes_data["page_size"],
            "has_more": likes_data["has_more"],
        }

    except ListingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch listing likes: {str(e)}",
        )
