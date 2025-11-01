"""
University data models.

Pydantic models for university verification and data validation.
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UniversityBase(BaseModel):
    """
    Base university model with core fields.
    """

    id: UUID = Field(..., description="University unique identifier")
    name: str = Field(..., description="University name")
    domain: str = Field(..., description="Primary domain name")
    country: str = Field(..., description="Country")
    state: Optional[str] = Field(None, description="State or province")


class UniversityResponse(UniversityBase):
    """
    University response model for API responses.
    """

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "New York University",
                "domain": "nyu.edu",
                "country": "USA",
                "state": "New York",
            }
        }


class UniversityCreate(BaseModel):
    """
    Model for creating a new university.
    """

    name: str = Field(..., description="University name")
    domain: str = Field(..., description="Primary domain name")
    country: str = Field(default="USA", description="Country")
    state: Optional[str] = Field(None, description="State or province")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "name": "Stanford University",
                "domain": "stanford.edu",
                "country": "USA",
                "state": "California",
            }
        }


class EmailVerificationRequest(BaseModel):
    """
    Email verification request model.
    """

    email: EmailStr = Field(..., description="Email address to verify")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"email": "student@nyu.edu"}}


class EmailVerificationResponse(BaseModel):
    """
    Email verification response model.
    """

    is_valid: bool = Field(..., description="Whether email domain is valid")
    university: Optional[UniversityBase] = Field(None, description="University details if valid")
    message: Optional[str] = Field(None, description="Additional information")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "is_valid": True,
                "university": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "name": "New York University",
                    "domain": "nyu.edu",
                    "country": "USA",
                    "state": "New York",
                },
                "message": "Email domain verified",
            }
        }
