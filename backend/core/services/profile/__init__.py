"""
Profile service package.

Exports the ProfileService class and singleton getter function.
"""

from backend.core.services.profile.profile_service import (
    ProfileNotFoundError,
    ProfileService,
    UnauthorizedError,
    ValidationError,
    get_profile_service,
)

__all__ = [
    "ProfileService",
    "get_profile_service",
    "ProfileNotFoundError",
    "UnauthorizedError",
    "ValidationError",
]
