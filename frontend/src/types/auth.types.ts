export interface UserRegistrationRequest {
  full_name: string;
  university_email: string;
  university_domain: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  university_id: string | null;
  university_email: string;
  profile_picture_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface RegistrationConfirmationResponse {
  message: string;
  user: UserResponse;
  email_confirmation_required: boolean;
}
