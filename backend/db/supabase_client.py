"""
Supabase client initialization and configuration.

This module provides a configured Supabase client instance
that can be imported and used throughout the application.
"""

from supabase import Client, create_client

from backend.config import settings


def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.

    The client is configured with the service role key for full database access.
    Use this client for server-side operations only.

    Returns:
        Client: Configured Supabase client instance

    Raises:
        Exception: If Supabase client initialization fails
    """
    try:
        client: Client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        return client
    except Exception as e:
        raise Exception(f"Failed to initialize Supabase client: {str(e)}") from e


# Global Supabase client instance
# This is initialized once and reused throughout the application
supabase: Client = get_supabase_client()


__all__ = ["supabase", "get_supabase_client"]
