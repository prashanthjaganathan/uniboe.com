import api from './api';
import {
  PostCreate,
  PostUpdate,
  PostResponse,
  PostListResponse,
  LikeResponse,
} from '@/types/feed.types';

export const feedService = {
  async createPost(data: PostCreate): Promise<PostResponse> {
    const response = await api.post<PostResponse>('/feed/posts', data);
    return response.data;
  },

  async getFeed(
    page: number = 1,
    pageSize: number = 20,
    excludeOwnPosts: boolean = false
  ): Promise<PostListResponse> {
    const response = await api.get<PostListResponse>('/feed', {
      params: { page, page_size: pageSize, exclude_own_posts: excludeOwnPosts },
    });
    return response.data;
  },

  async getPost(postId: string): Promise<PostResponse> {
    const response = await api.get<PostResponse>(`/feed/posts/${postId}`);
    return response.data;
  },

  async getUserPosts(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PostListResponse> {
    const response = await api.get<PostListResponse>(`/feed/users/${userId}/posts`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  async updatePost(postId: string, data: PostUpdate): Promise<PostResponse> {
    const response = await api.put<PostResponse>(`/feed/posts/${postId}`, data);
    return response.data;
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/feed/posts/${postId}`);
  },

  async likePost(postId: string): Promise<LikeResponse> {
    const response = await api.post<LikeResponse>(`/feed/posts/${postId}/like`);
    return response.data;
  },

  async unlikePost(postId: string): Promise<void> {
    await api.delete(`/feed/posts/${postId}/like`);
  },

  async getPostLikes(
    postId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ likes: LikeResponse[]; total: number }> {
    const response = await api.get(`/feed/posts/${postId}/likes`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
};
