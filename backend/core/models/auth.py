"""
Authentication data models.

Pydantic models for user registration, login, and authentication responses.
"""

import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegistrationRequest(BaseModel):
    """
    User registration request model.

    Validates user registration data including university email verification.
    """

    full_name: str = Field(..., min_length=2, description="User's full name")
    university_email: EmailStr = Field(..., description="University email address")
    university_domain: str = Field(..., description="University domain (e.g., nyu.edu)")
    password: str = Field(..., min_length=8, description="User password")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name contains at least first and last name."""
        v = v.strip()
        if len(v.split()) < 2:
            raise ValueError("Full name must include at least first and last name")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password meets security requirements.

        Requirements:
        - At least 8 characters
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains number
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")

        return v

    @field_validator("university_email")
    @classmethod
    def validate_email_domain_match(cls, v: str, info) -> str:
        """Ensure university email domain matches provided university domain."""
        if "university_domain" in info.data:
            email_domain = v.split("@")[1].lower() if "@" in v else ""
            provided_domain = info.data["university_domain"].lower()

            if email_domain != provided_domain:
                raise ValueError(
                    f"Email domain '{email_domain}' does not match "
                    f"provided university domain '{provided_domain}'"
                )
        return v.lower()

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "university_email": "john.doe@nyu.edu",
                "university_domain": "nyu.edu",
                "password": "[PLACEHOLDER_PASSWORD]",
            }
        }


class UserLoginRequest(BaseModel):
    """
    User login request model.
    """

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {"email": "john.doe@nyu.edu", "password": "[PLACEHOLDER_PASSWORD]"}
        }


class UserResponse(BaseModel):
    """
    User response model for API responses.

    Contains public user information without sensitive data.
    """

    id: UUID = Field(..., description="User unique identifier")
    email: str = Field(..., description="User email address")
    full_name: str = Field(..., description="User's full name")
    university_id: Optional[UUID] = Field(None, description="Associated university ID")
    university_email: str = Field(..., description="Verified university email")
    profile_picture_url: Optional[str] = Field(None, description="Profile picture URL")
    is_verified: bool = Field(default=False, description="Email verification status")
    created_at: datetime = Field(..., description="Account creation timestamp")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "john.doe@nyu.edu",
                "full_name": "John Doe",
                "university_id": "456e7890-e89b-12d3-a456-426614174111",
                "university_email": "john.doe@nyu.edu",
                "profile_picture_url": "https://example.com/profile.jpg",
                "is_verified": True,
                "created_at": "2024-01-01T12:00:00Z",
            }
        }


class TokenResponse(BaseModel):
    """
    Authentication token response model.

    Returned after successful login or registration.
    """

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "john.doe@nyu.edu",
                    "full_name": "John Doe",
                    "university_id": "456e7890-e89b-12d3-a456-426614174111",
                    "university_email": "john.doe@nyu.edu",
                    "profile_picture_url": None,
                    "is_verified": False,
                    "created_at": "2024-01-01T12:00:00Z",
                },
            }
        }


class PasswordChangeRequest(BaseModel):
    """
    Password change request model.
    """

    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        """Validate new password meets security requirements."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")

        return v


class EmailVerificationRequest(BaseModel):
    """
    Email verification request model.
    """

    token: str = Field(..., description="Email verification token")


class RegistrationConfirmationResponse(BaseModel):
    message: str
    user: UserResponse
    email_confirmation_required: bool = True
