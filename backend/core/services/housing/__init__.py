"""
Housing service package.

Exports the HousingService class and singleton getter function.
"""

from backend.core.services.housing.housing_service import (
    HousingService,
    ListingNotFoundError,
    UnauthorizedError,
    ValidationError,
    get_housing_service,
)

__all__ = [
    "HousingService",
    "get_housing_service",
    "ListingNotFoundError",
    "UnauthorizedError",
    "ValidationError",
]
