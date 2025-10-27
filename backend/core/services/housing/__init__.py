"""
Housing service package.

Exports the HousingService class and singleton getter function.
"""

from backend.core.services.housing.housing_service import (
    HousingService,
    get_housing_service,
    ListingNotFoundError,
    UnauthorizedError,
    ValidationError,
)

__all__ = [
    "HousingService",
    "get_housing_service",
    "ListingNotFoundError",
    "UnauthorizedError",
    "ValidationError",
]

