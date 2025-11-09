"""
Authentication services package.

Contains services for user authentication, registration, and session management.
"""

from backend.core.services.auth.auth_service import AuthService, get_auth_service

__all__ = ["AuthService", "get_auth_service"]
