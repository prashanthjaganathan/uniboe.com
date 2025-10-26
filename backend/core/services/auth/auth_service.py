"""
Authentication service.

Handles user registration, login, logout, and profile management using Supabase Auth.
"""

from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from backend.db import supabase
from backend.core.models.auth import UserRegistrationRequest, UserLoginRequest, UserResponse
from backend.core.services.universities import get_university_service


class AuthenticationError(Exception):
    """Base exception for authentication errors."""
    pass


class DuplicateEmailError(AuthenticationError):
    """Raised when attempting to register with an existing email."""
    pass


class InvalidCredentialsError(AuthenticationError):
    """Raised when login credentials are invalid."""
    pass


class InvalidDomainError(AuthenticationError):
    """Raised when university domain is not recognized."""
    pass


class AuthService:
    """
    Service for handling user authentication operations.
    
    Uses Supabase Auth for secure authentication and manages user profiles.
    """
    
    async def register_user(self, registration_data: UserRegistrationRequest) -> Dict[str, Any]:
        """
        Register a new user with university email verification.
        
        Steps:
        1. Verify university email domain is valid
        2. Check if email already exists
        3. Create user in Supabase Auth
        4. Create profile entry with university info
        5. Return user data and session tokens
        
        Args:
            registration_data: User registration information
        
        Returns:
            Dict containing:
                - access_token: JWT access token
                - user: User profile data
                - session: Supabase session object
        
        Raises:
            InvalidDomainError: If university domain is not recognized
            DuplicateEmailError: If email already exists
            AuthenticationError: For other registration errors
        
        Example:
            >>> service = AuthService()
            >>> result = await service.register_user(registration_data)
            >>> print(result["user"]["email"])
        """
        try:
            # Step 1: Verify university domain
            university_service = get_university_service()
            verification_result = await university_service.verify_email_domain(
                registration_data.university_email
            )
            
            if not verification_result["is_valid"]:
                raise InvalidDomainError(
                    f"University domain '{registration_data.university_domain}' is not recognized"
                )
            
            university = verification_result["university"]
            
            print(f"✅ DEBUG: Verified university: {university}")
            print(f"✅ DEBUG: University ID type: {type(university['id'])}, value: {university['id']}")
            
            # Step 2: Create user in Supabase Auth
            try:
                auth_response = supabase.auth.sign_up({
                    "email": registration_data.university_email,
                    "password": registration_data.password,
                })
                
                print(f"✅ DEBUG: Auth response user: {auth_response.user}")
                print(f"✅ DEBUG: User ID: {auth_response.user.id if auth_response.user else 'None'}")
                
            except Exception as e:
                error_msg = str(e)
                print(f"❌ DEBUG: Sign up error: {error_msg}")
                if "already registered" in error_msg.lower() or "duplicate" in error_msg.lower():
                    raise DuplicateEmailError(
                        f"Email {registration_data.university_email} is already registered"
                    )
                raise AuthenticationError(f"Registration failed: {error_msg}")
            
            if not auth_response.user:
                raise AuthenticationError("Failed to create user account")
            
            user = auth_response.user
            
            # Step 3: No trigger exists anymore, create the profile directly
            try:
                print(f"✅ DEBUG: Creating profile directly (no trigger)...")
                
                # Create full profile with all required fields
                profile_data = {
                    "id": str(user.id),
                    "email": registration_data.university_email,
                    "full_name": registration_data.full_name,
                    "university_id": str(university["id"]),
                    "university_email": registration_data.university_email,
                    "is_verified": False,
                }
                
                print(f"✅ DEBUG: Profile data: {profile_data}")
                
                # Create new profile
                insert_response = supabase.table("profiles").insert(profile_data).execute()
                
                print(f"✅ DEBUG: Insert response: {insert_response.data}")
                
                if not insert_response.data:
                    raise AuthenticationError(f"Profile creation failed - no data returned")
                
                # Now update with university_id (CONVERT TO STRING!)
                profile_update = {
                    "university_id": str(university["id"]),
                    "is_verified": False,
                }
                
                print(f"✅ DEBUG: Updating profile with: {profile_update}")
                
                update_response = supabase.table("profiles").update(profile_update).eq("id", str(user.id)).execute()
                
                print(f"✅ DEBUG: Update response data: {update_response.data}")
                
                if not update_response.data:
                    raise AuthenticationError(f"Profile update returned no data. Full response: {update_response}")
                
            except AuthenticationError:
                raise
            except Exception as e:
                print(f"❌ DEBUG: Profile error: {type(e).__name__}: {str(e)}")
                
                # Clean up the auth user if profile creation fails
                try:
                    print(f"🧹 DEBUG: Attempting to clean up auth user {user.id}...")
                    supabase.auth.admin.delete_user(str(user.id))
                    print(f"✅ DEBUG: Cleaned up auth user {user.id}")
                except Exception as cleanup_error:
                    print(f"❌ DEBUG: Cleanup failed: {cleanup_error}")
                    
                raise AuthenticationError(f"Database error saving new user: {str(e)}")
            
            # Step 4: Return user data and tokens
            print(f"✅ DEBUG: Registration successful! Returning user data...")
            return {
                "access_token": auth_response.session.access_token if auth_response.session else None,
                "token_type": "bearer",
                "user": UserResponse(
                    id=UUID(str(user.id)),
                    email=registration_data.university_email,
                    full_name=registration_data.full_name,
                    university_id=UUID(str(university["id"])),  # Also convert here
                    university_email=registration_data.university_email,
                    profile_picture_url=None,
                    is_verified=False,
                    created_at=datetime.utcnow()
                ),
                "session": auth_response.session
            }
            
        except (InvalidDomainError, DuplicateEmailError, AuthenticationError):
            raise
        except Exception as e:
            raise AuthenticationError(f"Unexpected error during registration: {str(e)}")
    
    async def login_user(self, login_data: UserLoginRequest) -> Dict[str, Any]:
        """
        Authenticate user and create session.
        
        Args:
            login_data: User login credentials
        
        Returns:
            Dict containing:
                - access_token: JWT access token
                - user: User profile data
                - session: Supabase session object
        
        Raises:
            InvalidCredentialsError: If credentials are invalid
            AuthenticationError: For other login errors
        
        Example:
            >>> service = AuthService()
            >>> result = await service.login_user(login_data)
            >>> print(result["access_token"])
        """
        try:
            # Sign in with Supabase
            auth_response = supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password,
            })
            
            if not auth_response.user:
                raise InvalidCredentialsError("Invalid email or password")
            
            user = auth_response.user
            
            # Get user profile
            profile_response = supabase.table("profiles").select(
                "id, email, full_name, university_id, university_email, "
                "profile_picture_url, is_verified, created_at"
            ).eq("id", str(user.id)).execute()
            
            if not profile_response.data or len(profile_response.data) == 0:
                raise AuthenticationError("User profile not found")
            
            profile = profile_response.data[0]
            
            return {
                "access_token": auth_response.session.access_token,
                "token_type": "bearer",
                "user": UserResponse(
                    id=UUID(profile["id"]),
                    email=profile["email"],
                    full_name=profile["full_name"],
                    university_id=UUID(profile["university_id"]) if profile.get("university_id") else None,
                    university_email=profile["university_email"],
                    profile_picture_url=profile.get("profile_picture_url"),
                    is_verified=profile.get("is_verified", False),
                    created_at=profile["created_at"]
                ),
                "session": auth_response.session
            }
            
        except InvalidCredentialsError:
            raise
        except Exception as e:
            error_msg = str(e).lower()
            if "invalid" in error_msg or "credentials" in error_msg:
                raise InvalidCredentialsError("Invalid email or password")
            raise AuthenticationError(f"Login failed: {str(e)}")
    
    async def get_user_profile(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get complete user profile with university information.
        
        Args:
            user_id: User's unique identifier
        
        Returns:
            Dict containing user profile and university data
        
        Raises:
            AuthenticationError: If profile not found
        
        Example:
            >>> service = AuthService()
            >>> profile = await service.get_user_profile(user_id)
            >>> print(profile["university_name"])
        """
        try:
            # Join profiles with universities to get complete data
            response = supabase.table("profiles").select(
                "*, universities(name, domain, country, state)"
            ).eq("id", str(user_id)).execute()
            
            if not response.data or len(response.data) == 0:
                raise AuthenticationError(f"Profile not found for user {user_id}")
            
            return response.data[0]
            
        except AuthenticationError:
            raise
        except Exception as e:
            raise AuthenticationError(f"Failed to fetch profile: {str(e)}")
    
    async def logout_user(self, token: str) -> bool:
        """
        Log out user and invalidate session.
        
        Args:
            token: JWT access token
        
        Returns:
            bool: True if logout successful
        
        Raises:
            AuthenticationError: If logout fails
        """
        try:
            supabase.auth.sign_out()
            return True
            
        except Exception as e:
            raise AuthenticationError(f"Logout failed: {str(e)}")
    
    async def verify_email(self, token: str) -> bool:
        """
        Verify user's email address.
        
        Args:
            token: Email verification token
        
        Returns:
            bool: True if verification successful
        """
        try:
            # Supabase handles email verification automatically
            # This method can be used for additional verification logic
            return True
            
        except Exception as e:
            raise AuthenticationError(f"Email verification failed: {str(e)}")


# Global service instance
_auth_service_instance: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """
    Get or create the global AuthService instance.
    
    Returns:
        AuthService: The global service instance
    """
    global _auth_service_instance
    if _auth_service_instance is None:
        _auth_service_instance = AuthService()
    return _auth_service_instance

