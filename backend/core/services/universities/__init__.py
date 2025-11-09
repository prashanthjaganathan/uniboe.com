"""
University services package.

Contains services for university verification and validation.
"""

from backend.core.services.universities.verification import (
    UniversityVerificationService,
    get_university_service,
)

__all__ = ["UniversityVerificationService", "get_university_service"]
