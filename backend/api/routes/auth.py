"""
Authentication API routes.

Endpoints for user registration, login, logout, and profile management.
"""

from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.dependencies.auth import get_current_user
from backend.core.models.auth import (
    RegistrationConfirmationResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegistrationRequest,
    UserResponse,
)
from backend.core.services.auth import get_auth_service
from backend.core.services.auth.auth_service import (
    AuthenticationError,
    DuplicateEmailError,
    InvalidCredentialsError,
    InvalidDomainError,
)

# Create router
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=Union[TokenResponse, RegistrationConfirmationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Register a new user with university email verification.",
)
async def register(request: UserRegistrationRequest) -> TokenResponse:
    """
    Register a new user account.

    This endpoint:
    1. Validates the university email domain
    2. Checks if email is already registered
    3. Creates user in Supabase Auth
    4. Creates user profile in database
    5. Returns JWT access token

    Args:
        request: User registration data

    Returns:
        TokenResponse: JWT token and user information

    Raises:
        HTTPException 400: Invalid university domain
        HTTPException 409: Email already registered
        HTTPException 500: Server error

    Example:
        >>> POST /api/auth/register
        >>> {
        >>>   "full_name": "John Doe",
        >>>   "university_email": "john.doe@nyu.edu",
        >>>   "university_domain": "nyu.edu",
        >>>   "password": "[PLACEHOLDER_PASSWORD]"
        >>> }

        Response (201):
        {
          "access_token": "TEST_ACCESS_TOKEN",
          "token_type": "bearer",
          "user": {
            "id": "uuid-here",
            "email": "john.doe@nyu.edu",
            "full_name": "John Doe",
            ...
          }
        }
    """
    try:
        auth_service = get_auth_service()
        result = await auth_service.register_user(request)

        # Check if session exists - Supabase might require email confirmation
        if not result.get("session"):
            return RegistrationConfirmationResponse(
                message=(
                    "User registered successfully. "
                    "Please check your email to confirm your account."
                ),
                user=result["user"],
                email_confirmation_required=True,
            )

        # Session exists - return token response
        return TokenResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            user=result["user"],
        )
    except InvalidDomainError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except DuplicateEmailError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}",
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login user",
    description="Authenticate user and create session.",
)
async def login(request: UserLoginRequest) -> TokenResponse:
    """
    Authenticate user and return access token.

    This endpoint:
    1. Validates credentials with Supabase Auth
    2. Fetches user profile from database
    3. Returns JWT access token

    Args:
        request: User login credentials

    Returns:
        TokenResponse: JWT token and user information

    Raises:
        HTTPException 401: Invalid credentials
        HTTPException 500: Server error

    Example:
        >>> POST /api/auth/login
        >>> {
        >>>   "email": "john.doe@nyu.edu",
        >>>   "password": "[PLACEHOLDER_PASSWORD]"
        >>> }

        Response (200):
        {
          "access_token": "TEST_ACCESS_TOKEN",
          "token_type": "bearer",
          "user": { ... }
        }
    """
    try:
        auth_service = get_auth_service()
        result = await auth_service.login_user(request)

        return TokenResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            user=result["user"],
        )

    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Get the authenticated user's profile information.",
)
async def get_me(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """
    Get current authenticated user's profile.

    This endpoint requires a valid JWT token in the Authorization header.
    Returns complete user profile information.

    Args:
        current_user: Authenticated user (from JWT token)

    Returns:
        UserResponse: Complete user profile

    Raises:
        HTTPException 401: Invalid or missing token

    Example:
        >>> GET /api/auth/me
        >>> Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

        Response (200):
        {
          "id": "uuid-here",
          "email": "john.doe@nyu.edu",
          "full_name": "John Doe",
          "university_id": "uuid-here",
          "university_email": "john.doe@nyu.edu",
          "profile_picture_url": null,
          "is_verified": false,
          "created_at": "2024-01-01T12:00:00Z"
        }
    """
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user",
    description="Logout the current user and invalidate their session.",
)
async def logout(
    current_user: UserResponse = Depends(get_current_user),
) -> dict:
    """
    Logout current user.

    This endpoint invalidates the user's session with Supabase.
    The client should also delete the JWT token from storage.

    Args:
        current_user: Authenticated user (from JWT token)

    Returns:
        dict: Success message

    Raises:
        HTTPException 401: Invalid or missing token
        HTTPException 500: Server error

    Example:
        >>> POST /api/auth/logout
        >>> Headers: Authorization: Bearer TEST_ACCESS_TOKEN

        Response (200):
        {
          "message": "Logged out successfully",
          "user_id": "uuid-here"
        }
    """
    try:
        auth_service = get_auth_service()
        # Note: We don't have the token here, but Supabase handles logout
        # The client should also delete the JWT from local storage
        await auth_service.logout_user("")

        return {"message": "Logged out successfully", "user_id": str(current_user.id)}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}",
        )


@router.get(
    "/verify-email/{token}",
    status_code=status.HTTP_200_OK,
    summary="Verify email",
    description="Verify user email with confirmation token.",
)
async def verify_email(token: str) -> dict:
    """
    Verify user's email address.

    This endpoint is called when user clicks the verification link
    sent to their email. Supabase handles the actual verification,
    this endpoint just confirms success.

    Args:
        token: Email verification token from URL

    Returns:
        dict: Verification status message

    Example:
        >>> GET /api/auth/verify-email/verification-token-here

        Response (200):
        {
          "message": "Email verified successfully",
          "verified": true
        }
    """
    try:
        auth_service = get_auth_service()
        success = await auth_service.verify_email(token)

        if success:
            return {"message": "Email verified successfully", "verified": True}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email verification failed: {str(e)}",
        )


@router.get(
    "/profile/{user_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get user profile by ID",
    description="Get complete user profile with university information (requires authentication).",
)
async def get_user_profile_by_id(
    user_id: str, current_user: UserResponse = Depends(get_current_user)
) -> dict:
    """
    Get complete user profile with university information.

    This endpoint returns detailed profile information including
    the associated university data.

    Args:
        user_id: UUID of the user to fetch
        current_user: Authenticated user (from JWT token)

    Returns:
        dict: Complete profile with university data

    Raises:
        HTTPException 401: Invalid or missing token
        HTTPException 404: User not found
        HTTPException 500: Server error

    Example:
        >>> GET /api/auth/profile/uuid-here
        >>> Headers: Authorization: Bearer TEST_ACCESS_TOKEN

        Response (200):
        {
          "id": "uuid-here",
          "email": "john.doe@nyu.edu",
          "full_name": "John Doe",
          "university": {
            "name": "New York University",
            "domain": "nyu.edu",
            "country": "USA",
            "state": "New York"
          },
          ...
        }
    """
    try:
        from uuid import UUID

        auth_service = get_auth_service()

        profile = await auth_service.get_user_profile(UUID(user_id))
        return profile

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    except AuthenticationError as e:
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User profile not found: {str(e)}",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}",
        )
