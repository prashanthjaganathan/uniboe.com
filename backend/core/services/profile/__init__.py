"""
Profile service package.

Exports the ProfileService class and singleton getter function.
"""

from backend.core.services.profile.profile_service import (
    ProfileService,
    get_profile_service,
    ProfileNotFoundError,
    UnauthorizedError,
    ValidationError,
)

__all__ = [
    "ProfileService",
    "get_profile_service",
    "ProfileNotFoundError",
    "UnauthorizedError",
    "ValidationError",
]

