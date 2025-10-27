"""
Models package for Uniboe backend.

Contains Pydantic models for data validation and serialization.
"""

# Auth models
from backend.core.models.auth import (
    UserRegistrationRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    PasswordChangeRequest,
    EmailVerificationRequest,
    RegistrationConfirmationResponse,
)

# University models
from backend.core.models.university import (
    UniversityBase,
    UniversityResponse,
    UniversityCreate,
    EmailVerificationRequest as UniversityEmailVerificationRequest,
    EmailVerificationResponse,
)

# Feed models
from backend.core.models.feed import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostListResponse,
    LikeResponse,
    LikeRequest,
)

# Housing models
from backend.core.models.housing import (
    HousingListingCreate,
    HousingListingUpdate,
    HousingListingResponse,
    HousingListResponse,
    HousingSearchFilters,
    HousingLikeResponse,
    PropertyType,
)

# Chat models
from backend.core.models.chat import (
    MessageCreate,
    MessageResponse,
    ConversationCreate,
    ConversationResponse,
    ConversationListResponse,
    MessageListResponse,
    MarkReadRequest,
    ChatSearchRequest,
    EncryptionKey,
    MessageUpdateResponse,
    ConversationDetailResponse,
)

# Profile models
from backend.core.models.profile import (
    ProfileUpdate,
    ProfileResponse,
    PublicProfileResponse,
    ProfileSearchRequest,
    ProfileListResponse,
    ProfileStatsResponse,
    ProfilePictureUploadResponse,
)

__all__ = [
    # Auth models
    "UserRegistrationRequest",
    "UserLoginRequest",
    "UserResponse",
    "TokenResponse",
    "PasswordChangeRequest",
    "EmailVerificationRequest",
    "RegistrationConfirmationResponse",
    # University models
    "UniversityBase",
    "UniversityResponse",
    "UniversityCreate",
    "UniversityEmailVerificationRequest",
    "EmailVerificationResponse",
    # Feed models
    "PostCreate",
    "PostUpdate",
    "PostResponse",
    "PostListResponse",
    "LikeResponse",
    "LikeRequest",
    # Housing models
    "HousingListingCreate",
    "HousingListingUpdate",
    "HousingListingResponse",
    "HousingListResponse",
    "HousingSearchFilters",
    "HousingLikeResponse",
    "PropertyType",
    # Chat models
    "MessageCreate",
    "MessageResponse",
    "ConversationCreate",
    "ConversationResponse",
    "ConversationListResponse",
    "MessageListResponse",
    "MarkReadRequest",
    "ChatSearchRequest",
    "EncryptionKey",
    "MessageUpdateResponse",
    "ConversationDetailResponse",
    # Profile models
    "ProfileUpdate",
    "ProfileResponse",
    "PublicProfileResponse",
    "ProfileSearchRequest",
    "ProfileListResponse",
    "ProfileStatsResponse",
    "ProfilePictureUploadResponse",
]
