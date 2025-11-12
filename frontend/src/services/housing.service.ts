import api from './api';
import {
  HousingListingCreate,
  HousingListingUpdate,
  HousingListingResponse,
  HousingListResponse,
  HousingSearchFilters,
} from '@/types/housing.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const housingService = {
  async createListing(data: HousingListingCreate): Promise<HousingListingResponse> {
    const response = await api.post<HousingListingResponse>('/housing/listings', data);
    return response.data;
  },

  async getListings(
    filters?: HousingSearchFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'created_at',
    sortOrder: string = 'desc'
  ): Promise<HousingListResponse> {
    const response = await api.get<HousingListResponse>('/housing/listings', {
      params: { ...filters, page, page_size: pageSize, sort_by: sortBy, sort_order: sortOrder },
    });
    return response.data;
  },

  async getListing(listingId: string): Promise<HousingListingResponse> {
    const response = await api.get<HousingListingResponse>(`/housing/listings/${listingId}`);
    return response.data;
  },

  async searchByLocation(
    query: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<HousingListResponse> {
    const response = await api.get<HousingListResponse>('/housing/search', {
      params: { q: query, page, page_size: pageSize },
    });
    return response.data;
  },

  async getUserListings(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    includeInactive: boolean = false
  ): Promise<HousingListResponse> {
    const response = await api.get<HousingListResponse>(`/housing/users/${userId}/listings`, {
      params: { page, page_size: pageSize, include_inactive: includeInactive },
    });
    return response.data;
  },

  async updateListing(
    listingId: string,
    data: HousingListingUpdate
  ): Promise<HousingListingResponse> {
    const response = await api.put<HousingListingResponse>(`/housing/listings/${listingId}`, data);
    return response.data;
  },

  async deleteListing(listingId: string): Promise<void> {
    await api.delete(`/housing/listings/${listingId}`);
  },

  async activateListing(listingId: string): Promise<HousingListingResponse> {
    const response = await api.post<HousingListingResponse>(
      `/housing/listings/${listingId}/activate`
    );
    return response.data;
  },

  async deactivateListing(listingId: string): Promise<HousingListingResponse> {
    const response = await api.post<HousingListingResponse>(
      `/housing/listings/${listingId}/deactivate`
    );
    return response.data;
  },

  async likeListing(listingId: string): Promise<void> {
    await api.post(`/housing/listings/${listingId}/like`);
  },

  async unlikeListing(listingId: string): Promise<void> {
    await api.delete(`/housing/listings/${listingId}/like`);
  },

  async getListingLikes(
    listingId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ likes: unknown[]; total: number; page: number; page_size: number }> {
    const response = await api.get<{
      likes: unknown[];
      total: number;
      page: number;
      page_size: number;
    }>(`/housing/listings/${listingId}/likes`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  async uploadMedia(files: File[]): Promise<{ image_urls: string[]; count: number }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/housing/upload-media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Media upload failed');
    }

    return await response.json();
  },
};
