import api from './api';
import {
  UserRegistrationRequest,
  UserLoginRequest,
  TokenResponse,
  RegistrationConfirmationResponse,
  UserResponse,
} from '@/types/auth.types';

export const authService = {
  async register(data: UserRegistrationRequest): Promise<TokenResponse | RegistrationConfirmationResponse> {
    const response = await api.post<TokenResponse | RegistrationConfirmationResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: UserLoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  async getUserProfile(userId: string): Promise<UserResponse> {
    const response = await api.get<UserResponse>(`/auth/profile/${userId}`);
    return response.data;
  },
};

