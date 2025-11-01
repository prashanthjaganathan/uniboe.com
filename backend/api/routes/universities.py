"""
University API routes.

Endpoints for university verification and search functionality.
"""

from typing import List

from fastapi import APIRouter, HTTPException, Path, Query, status

from backend.core.models.university import (
    EmailVerificationRequest,
    EmailVerificationResponse,
    UniversityCreate,
    UniversityResponse,
)
from backend.core.services.universities import get_university_service

# Create router
router = APIRouter(
    prefix="/universities",
    tags=["Universities"],
)


@router.get(
    "/",
    response_model=List[UniversityResponse],
    summary="Get all universities",
    description="Fetch all US universities from the database.",
)
async def get_all_universities() -> List[UniversityResponse]:
    """
    Get all US universities from database.

    Returns:
        List[UniversityResponse]: List of all universities

    Raises:
        HTTPException: 500 if unable to fetch universities
    """
    try:
        service = get_university_service()
        universities = await service.get_all_universities()

        return [UniversityResponse(**uni) for uni in universities]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch universities: {str(e)}",
        )


@router.post(
    "/verify-email",
    response_model=EmailVerificationResponse,
    summary="Verify university email",
    description="Verify if an email address belongs to a valid US university.",
    status_code=status.HTTP_200_OK,
)
async def verify_email(
    request: EmailVerificationRequest,
) -> EmailVerificationResponse:
    """
    Verify if an email domain belongs to a US university.

    Args:
        request: Email verification request

    Returns:
        EmailVerificationResponse: Verification result
    """
    try:
        service = get_university_service()
        result = await service.verify_email_domain(request.email)

        # Convert to response model
        university = None
        if result["university"]:
            university = UniversityResponse(**result["university"])

        return EmailVerificationResponse(
            is_valid=result["is_valid"],
            university=university,
            message=result.get("message"),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during verification: {str(e)}",
        )


@router.get(
    "/search",
    response_model=List[UniversityResponse],
    summary="Search universities",
    description="Search US universities by name (case-insensitive).",
)
async def search_universities(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
) -> List[UniversityResponse]:
    """
    Search universities by name.

    Args:
        q: Search query string

    Returns:
        List[UniversityResponse]: List of matching universities
    """
    try:
        service = get_university_service()
        results = await service.search_universities(q)

        return [UniversityResponse(**uni) for uni in results]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching universities: {str(e)}",
        )


@router.get(
    "/domain/{domain}",
    response_model=UniversityResponse,
    summary="Get university by domain",
    description="Get a single university by exact domain match.",
)
async def get_university_by_domain(
    domain: str = Path(..., description="University domain (e.g., 'nyu.edu')"),
) -> UniversityResponse:
    """
    Get university by exact domain match.

    Args:
        domain: Domain name to search for

    Returns:
        UniversityResponse: University details

    Raises:
        HTTPException: 404 if university not found
    """
    try:
        service = get_university_service()
        university = await service.get_university_by_domain(domain)

        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"University with domain '{domain}' not found",
            )

        return UniversityResponse(**university)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching university: {str(e)}",
        )


@router.post(
    "/",
    response_model=UniversityResponse,
    summary="Create university",
    description="Add a new university to the database. (Admin only - TODO: Add authentication)",
    status_code=status.HTTP_201_CREATED,
)
async def create_university(
    university: UniversityCreate,
) -> UniversityResponse:
    """
    Create a new university.

    Args:
        university: University data to create

    Returns:
        UniversityResponse: Created university

    Raises:
        HTTPException: 500 if creation fails

    Note:
        This endpoint should be protected with admin authentication in production.
    """
    try:
        service = get_university_service()
        result = await service.create_university(
            name=university.name,
            domain=university.domain,
            country=university.country,
            state=university.state,
        )

        return UniversityResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating university: {str(e)}",
        )
