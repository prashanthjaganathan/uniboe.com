"""
Application settings and configuration management.

This module handles all environment variables and application configuration
using Pydantic Settings for validation and type safety.
"""

from pathlib import Path
from typing import List, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # Points to backend/


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Validates that all required variables are present at startup.
    """

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Supabase Configuration
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(
        ..., description="Supabase service role key (server-side only)"
    )
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase anonymous/public key")

    # AI Configuration
    GROQ_API_KEY: str = Field(..., description="Groq API key for AI features")

    # Application Configuration
    ENVIRONMENT: Literal["dev", "staging", "prod", "test"] = Field(
        default="dev", description="Application environment"
    )
    DEBUG: bool = Field(default=True, description="Debug mode flag")
    SECRET_KEY: str = Field(..., description="Secret key for JWT tokens and encryption")

    # CORS origins as comma-separated string
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="CORS allowed origins (comma-separated)",
    )

    # Database Configuration (optional direct connection)
    DATABASE_URL: str = Field(default="", description="Direct PostgreSQL connection URL (optional)")

    # External API Configuration
    HIPO_API_URL: str = Field(
        default="http://universities.hipolabs.com",
        description="Hipo Labs University API base URL",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Ensure SECRET_KEY is sufficiently long in production."""
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    # ---------- Convenience flags ----------
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "dev"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "prod"

    @property
    def is_test(self) -> bool:
        return self.ENVIRONMENT == "test"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into list[str]."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


# Global settings instance
settings = Settings()
