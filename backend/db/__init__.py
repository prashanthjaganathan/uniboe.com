"""
Database package for Uniboe backend.

Contains database client initialization, migrations, and seed data.
"""

from backend.db.supabase_client import supabase, get_supabase_client

__all__ = ["supabase", "get_supabase_client"]

