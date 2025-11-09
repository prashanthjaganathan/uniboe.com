"""
Housing data models.

Pydantic models for housing listings, search filters, and likes.
"""

import re
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

# Property type enum
PropertyType = Literal["apartment", "sublet", "room", "house"]


class HousingListingCreate(BaseModel):
    """
    Housing listing creation request model.

    At least one contact method (email or phone) must be provided.
    """

    title: str = Field(..., min_length=5, max_length=200, description="Listing title")
    description: Optional[str] = Field(
        None, max_length=2000, description="Detailed description of the property"
    )
    address: str = Field(..., description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip_code: Optional[str] = Field(None, description="ZIP/Postal code")
    price: float = Field(..., gt=0, description="Monthly rent price")
    bedrooms: Optional[int] = Field(None, ge=0, description="Number of bedrooms")
    bathrooms: Optional[float] = Field(None, ge=0, description="Number of bathrooms")
    square_feet: Optional[int] = Field(None, gt=0, description="Square footage")
    available_from: Optional[date] = Field(None, description="Availability start date")
    available_until: Optional[date] = Field(None, description="Availability end date")
    property_type: PropertyType = Field(..., description="Type of property")
    amenities: List[str] = Field(
        default_factory=list, description="List of amenities (e.g., parking, laundry, pets)"
    )
    images: List[str] = Field(default_factory=list, description="List of image URLs")
    contact_email: Optional[EmailStr] = Field(None, description="Contact email address")
    contact_phone: Optional[str] = Field(None, description="Contact phone number")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Title must be at least 5 characters long")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate description if provided."""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format."""
        if v is not None:
            v = v.strip()
            # Remove spaces and common formatting characters for validation
            cleaned = re.sub(r"[\s\-\(\)\.]", "", v)
            # Check if it's a valid phone number (7-15 digits, optional + prefix)
            # Allowing 7+ digits to accommodate various international and test formats
            if not re.match(r"^\+?\d{7,15}$", cleaned):
                raise ValueError(
                    "Phone number must contain 7-15 digits "
                    "formats accepted: +1-555-0100, (555) 123-4567, 5551234567)"
                )
        return v

    @field_validator("zip_code")
    @classmethod
    def validate_zip_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate ZIP code format."""
        if v is not None:
            v = v.strip()
            # Basic validation for US ZIP codes (5 digits or 5+4)
            if not re.match(r"^\d{5}(-\d{4})?$", v):
                raise ValueError("ZIP code must be in format 12345 or 12345-6789")
        return v

    def model_post_init(self, __context: Any) -> None:
        """Validate that at least one contact method is provided and dates are valid."""
        # Ensure at least one contact method
        if not self.contact_email and not self.contact_phone:
            raise ValueError("At least one contact method (email or phone) is required")

        # Validate date range
        if self.available_from and self.available_until:
            if self.available_until <= self.available_from:
                raise ValueError("available_until must be after available_from")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "title": "Cozy 2BR Apartment near NYU",
                "description": "Beautiful apartment with lots of natural light...",
                "address": "123 Main Street, Apt 4B",
                "city": "New York",
                "state": "NY",
                "zip_code": "10003",
                "price": 2500.00,
                "bedrooms": 2,
                "bathrooms": 1.5,
                "square_feet": 900,
                "available_from": "2024-06-01",
                "available_until": "2024-08-31",
                "property_type": "sublet",
                "amenities": ["parking", "laundry", "pets"],
                "images": ["https://storage.supabase.co/housing/image1.jpg"],
                "contact_email": "john.doe@nyu.edu",
                "contact_phone": "+1-555-0100",
            }
        }


class HousingListingUpdate(BaseModel):
    """
    Housing listing update request model.

    All fields are optional for partial updates.
    """

    title: Optional[str] = Field(
        None, min_length=5, max_length=200, description="Updated listing title"
    )
    description: Optional[str] = Field(None, max_length=2000, description="Updated description")
    address: Optional[str] = Field(None, description="Updated address")
    city: Optional[str] = Field(None, description="Updated city")
    state: Optional[str] = Field(None, description="Updated state")
    zip_code: Optional[str] = Field(None, description="Updated ZIP code")
    price: Optional[float] = Field(None, gt=0, description="Updated price")
    bedrooms: Optional[int] = Field(None, ge=0, description="Updated bedrooms")
    bathrooms: Optional[float] = Field(None, ge=0, description="Updated bathrooms")
    square_feet: Optional[int] = Field(None, gt=0, description="Updated square feet")
    available_from: Optional[date] = Field(None, description="Updated start date")
    available_until: Optional[date] = Field(None, description="Updated end date")
    property_type: Optional[PropertyType] = Field(None, description="Updated property type")
    amenities: Optional[List[str]] = Field(None, description="Updated amenities")
    images: Optional[List[str]] = Field(None, description="Updated images")
    contact_email: Optional[EmailStr] = Field(None, description="Updated contact email")
    contact_phone: Optional[str] = Field(None, description="Updated contact phone")
    is_active: Optional[bool] = Field(None, description="Active/inactive status")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if v is not None:
            v = v.strip()
            if len(v) < 5:
                raise ValueError("Title must be at least 5 characters long")
        return v

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format if provided."""
        if v is not None:
            v = v.strip()
            cleaned = re.sub(r"[\s\-\(\)\.]", "", v)
            if not re.match(r"^\+?\d{7,15}$", cleaned):
                raise ValueError(
                    "Phone number must contain 7-15 digits "
                    "formats accepted: +1-555-0100, (555) 123-4567, 5551234567)"
                )
        return v

    @field_validator("zip_code")
    @classmethod
    def validate_zip_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate ZIP code format if provided."""
        if v is not None:
            v = v.strip()
            if not re.match(r"^\d{5}(-\d{4})?$", v):
                raise ValueError("ZIP code must be in format 12345 or 12345-6789")
        return v

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {"title": "Updated Title", "price": 2600.00, "is_active": True}
        }


class HousingListingResponse(BaseModel):
    """
    Housing listing response model for API responses.

    Contains complete listing information including user data and engagement metrics.
    """

    id: UUID = Field(..., description="Listing unique identifier")
    user_id: UUID = Field(..., description="Owner's user ID")
    title: str = Field(..., description="Listing title")
    description: Optional[str] = Field(None, description="Property description")
    address: str = Field(..., description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    zip_code: Optional[str] = Field(None, description="ZIP code")
    price: float = Field(..., description="Monthly rent price")
    bedrooms: Optional[int] = Field(None, description="Number of bedrooms")
    bathrooms: Optional[float] = Field(None, description="Number of bathrooms")
    square_feet: Optional[int] = Field(None, description="Square footage")
    available_from: Optional[date] = Field(None, description="Availability start date")
    available_until: Optional[date] = Field(None, description="Availability end date")
    property_type: str = Field(..., description="Type of property")
    amenities: List[str] = Field(default_factory=list, description="List of amenities")
    images: List[str] = Field(default_factory=list, description="List of image URLs")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    is_active: bool = Field(default=True, description="Active status")
    view_count: int = Field(default=0, description="Number of views")
    like_count: int = Field(default=0, description="Number of likes")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    user: Dict[str, Any] = Field(..., description="Owner user information")
    is_liked_by_current_user: Optional[bool] = Field(
        None, description="Whether current user has liked this listing"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "456e7890-e89b-12d3-a456-426614174111",
                "title": "Cozy 2BR Apartment near NYU",
                "description": "Beautiful apartment with lots of natural light...",
                "address": "123 Main Street, Apt 4B",
                "city": "New York",
                "state": "NY",
                "zip_code": "10003",
                "price": 2500.00,
                "bedrooms": 2,
                "bathrooms": 1.5,
                "square_feet": 900,
                "available_from": "2024-06-01",
                "available_until": "2024-08-31",
                "property_type": "sublet",
                "amenities": ["parking", "laundry", "pets"],
                "images": ["https://storage.supabase.co/housing/image1.jpg"],
                "contact_email": "john.doe@nyu.edu",
                "contact_phone": "+1-555-0100",
                "is_active": True,
                "view_count": 42,
                "like_count": 5,
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
        }


class HousingListResponse(BaseModel):
    """
    Paginated housing listing list response model.

    Used for housing search endpoints with pagination support.
    """

    listings: List[HousingListingResponse] = Field(..., description="List of housing listings")
    total: int = Field(..., description="Total number of listings")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of listings per page")
    has_more: bool = Field(..., description="Whether more listings are available")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "listings": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "user_id": "456e7890-e89b-12d3-a456-426614174111",
                        "title": "Cozy 2BR Apartment near NYU",
                        "city": "New York",
                        "state": "NY",
                        "price": 2500.00,
                        "bedrooms": 2,
                        "property_type": "sublet",
                        "like_count": 5,
                        "view_count": 42,
                        "is_liked_by_current_user": False,
                    }
                ],
                "total": 150,
                "page": 1,
                "page_size": 20,
                "has_more": True,
            }
        }


class HousingSearchFilters(BaseModel):
    """
    Search filters for housing listings.

    All fields are optional to allow flexible searching.
    """

    min_price: Optional[float] = Field(None, ge=0, description="Minimum monthly rent")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum monthly rent")
    bedrooms: Optional[int] = Field(None, ge=0, description="Number of bedrooms")
    bathrooms: Optional[float] = Field(None, ge=0, description="Number of bathrooms")
    property_type: Optional[PropertyType] = Field(None, description="Type of property")
    city: Optional[str] = Field(None, description="City to search in")
    state: Optional[str] = Field(None, description="State to search in")
    amenities: List[str] = Field(
        default_factory=list, description="Required amenities (listing must have all)"
    )
    available_from: Optional[date] = Field(None, description="Minimum availability start date")

    @field_validator("max_price")
    @classmethod
    def validate_price_range(cls, v: Optional[float], info) -> Optional[float]:
        """Validate max_price is greater than min_price if both provided."""
        if v is not None and info.data.get("min_price") is not None:
            if v < info.data.get("min_price"):
                raise ValueError("max_price must be greater than or equal to min_price")
        return v

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "min_price": 1000,
                "max_price": 3000,
                "bedrooms": 2,
                "city": "New York",
                "state": "NY",
                "property_type": "sublet",
                "amenities": ["parking", "laundry"],
            }
        }


class HousingLikeResponse(BaseModel):
    """
    Housing like response model.

    Contains like information including user data.
    """

    id: UUID = Field(..., description="Like unique identifier")
    listing_id: UUID = Field(..., description="Listing ID that was liked")
    user_id: UUID = Field(..., description="User ID who liked the listing")
    created_at: datetime = Field(..., description="Like creation timestamp")
    user: Dict[str, Any] = Field(..., description="User information")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "789e0123-e89b-12d3-a456-426614174222",
                "listing_id": "123e4567-e89b-12d3-a456-426614174000",
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
