"""
Authentication dependencies.

FastAPI dependency functions for handling authentication and authorization.
"""

from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.core.models.auth import UserResponse
from backend.db import supabase

# Simple HTTP bearer security
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserResponse:
    """
    Get current authenticated user from JWT token.

    This dependency verifies the JWT token with Supabase and returns
    the authenticated user. Raises 401 if token is invalid or expired.

    Args:
        credentials: HTTP Authorization header containing the token

    Returns:
        UserResponse: Authenticated user information

    Raises:
        HTTPException: 401 if token is invalid or user not found

    Example:
        >>> @app.get("/me")
        >>> async def get_me(current_user: UserResponse = Depends(get_current_user)):
        >>>     return current_user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Get the token from the Bearer credentials
        token = credentials.credentials

        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise credentials_exception

        user = user_response.user

        # Fetch user profile from profiles table
        profile_response = (
            supabase.table("profiles")
            .select(
                "id, email, full_name, university_id, university_email, "
                "profile_picture_url, is_verified, created_at"
            )
            .eq("id", str(user.id))
            .execute()
        )

        if not profile_response.data or len(profile_response.data) == 0:
            raise credentials_exception

        profile = profile_response.data[0]

        # Return UserResponse model
        return UserResponse(
            id=UUID(profile["id"]),
            email=profile["email"],
            full_name=profile["full_name"],
            university_id=UUID(profile["university_id"]) if profile.get("university_id") else None,
            university_email=profile["university_email"],
            profile_picture_url=profile.get("profile_picture_url"),
            is_verified=profile.get("is_verified", False),
            created_at=profile["created_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise credentials_exception


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Get current active user (verified email).

    This dependency extends get_current_user and ensures the user
    has verified their email address.

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: Verified user information

    Raises:
        HTTPException: 403 if email is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email to continue.",
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> Optional[UserResponse]:
    """
    Get current user if authenticated, None otherwise.

    This dependency is useful for endpoints that work with or without
    authentication (e.g., public content that shows differently for logged-in users).

    Args:
        credentials: Optional HTTP Authorization credentials

    Returns:
        UserResponse or None: User if authenticated, None otherwise

    Example:
        >>> @app.get("/public")
        >>> async def public_content(
        >>>     user: Optional[UserResponse] = Depends(get_optional_current_user)
        >>> ):
        >>>     if user:
        >>>         return {"message": f"Hello {user.full_name}"}
        >>>     return {"message": "Hello guest"}
    """
    if not credentials:
        return None

    try:
        # Extract token from credentials
        token = credentials.credentials

        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            return None

        user = user_response.user

        # Fetch user profile from profiles table
        profile_response = (
            supabase.table("profiles")
            .select(
                "id, email, full_name, university_id, university_email, "
                "profile_picture_url, is_verified, created_at"
            )
            .eq("id", str(user.id))
            .execute()
        )

        if not profile_response.data or len(profile_response.data) == 0:
            return None

        profile = profile_response.data[0]

        # Return UserResponse model
        return UserResponse(
            id=UUID(profile["id"]),
            email=profile["email"],
            full_name=profile["full_name"],
            university_id=UUID(profile["university_id"]) if profile.get("university_id") else None,
            university_email=profile["university_email"],
            profile_picture_url=profile.get("profile_picture_url"),
            is_verified=profile.get("is_verified", False),
            created_at=profile["created_at"],
        )

    except Exception as e:
        print(f"Optional auth error: {str(e)}")
        return None
