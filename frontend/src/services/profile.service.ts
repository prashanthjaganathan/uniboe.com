import api from './api';
import {
  ProfileUpdate,
  ProfileResponse,
  PublicProfileResponse,
  ProfileSearchRequest,
  ProfileListResponse,
  ProfileStatsResponse,
} from '@/types/profile.types';

export const profileService = {
  async getCurrentUserProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/profile/me');
    return response.data;
  },

  async updateProfile(data: ProfileUpdate): Promise<ProfileResponse> {
    const response = await api.put<ProfileResponse>('/profile/me', data);
    return response.data;
  },

  async getProfileById(userId: string): Promise<PublicProfileResponse> {
    const response = await api.get<PublicProfileResponse>(`/profile/${userId}`);
    return response.data;
  },

  async getProfileStats(): Promise<ProfileStatsResponse> {
    const response = await api.get<ProfileStatsResponse>('/profile/me/stats');
    return response.data;
  },

  async searchProfiles(data: ProfileSearchRequest): Promise<ProfileListResponse> {
    const response = await api.post<ProfileListResponse>('/profile/search', data);
    return response.data;
  },

  async uploadProfilePicture(
    file: File
  ): Promise<{ profile_picture_url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/profile/me/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteProfilePicture(): Promise<void> {
    await api.delete('/profile/me/picture');
  },

  async getUserByEmail(email: string): Promise<PublicProfileResponse> {
    const response = await api.get<PublicProfileResponse>(`/profile/email/${email}`);
    return response.data;
  },
};
