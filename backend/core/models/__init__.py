"""
Models package for Uniboe backend.

Contains Pydantic models for data validation and serialization.
"""

# Auth models
from backend.core.models.auth import (
    EmailVerificationRequest,
    PasswordChangeRequest,
    RegistrationConfirmationResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegistrationRequest,
    UserResponse,
)

# Chat models
from backend.core.models.chat import (
    ChatSearchRequest,
    ConversationCreate,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    EncryptionKey,
    MarkReadRequest,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
    MessageUpdateResponse,
)

# Feed models
from backend.core.models.feed import (
    LikeRequest,
    LikeResponse,
    PostCreate,
    PostListResponse,
    PostResponse,
    PostUpdate,
)

# Housing models
from backend.core.models.housing import (
    HousingLikeResponse,
    HousingListingCreate,
    HousingListingResponse,
    HousingListingUpdate,
    HousingListResponse,
    HousingSearchFilters,
    PropertyType,
)

# Olive AI models
from backend.core.models.olive import (
    MessageRole,
    OliveChatRequest,
    OliveChatResponse,
    OliveConversationCreate,
    OliveConversationDetailResponse,
    OliveConversationListResponse,
    OliveConversationResponse,
    OliveConversationUpdateRequest,
    OliveMessageCreate,
    OliveMessageResponse,
)

# Profile models
from backend.core.models.profile import (
    ProfileListResponse,
    ProfilePictureUploadResponse,
    ProfileResponse,
    ProfileSearchRequest,
    ProfileStatsResponse,
    ProfileUpdate,
    PublicProfileResponse,
)

# University models
from backend.core.models.university import (
    EmailVerificationRequest as UniversityEmailVerificationRequest,
)
from backend.core.models.university import (
    EmailVerificationResponse,
    UniversityBase,
    UniversityCreate,
    UniversityResponse,
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
    # Olive AI models
    "OliveMessageCreate",
    "OliveMessageResponse",
    "OliveConversationCreate",
    "OliveConversationResponse",
    "OliveConversationListResponse",
    "OliveConversationDetailResponse",
    "OliveChatRequest",
    "OliveChatResponse",
    "OliveConversationUpdateRequest",
    "MessageRole",
]
