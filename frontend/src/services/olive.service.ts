import api from './api';
import {
  OliveChatRequest,
  OliveChatResponse,
  OliveConversationCreate,
  OliveConversationResponse,
  OliveConversationListResponse,
  OliveConversationDetailResponse,
} from '@/types/olive.types';

export const oliveService = {
  async chat(data: OliveChatRequest): Promise<OliveChatResponse> {
    const response = await api.post<OliveChatResponse>('/olive/chat', data);
    return response.data;
  },

  async createConversation(data: OliveConversationCreate = {}): Promise<OliveConversationResponse> {
    const response = await api.post<OliveConversationResponse>('/olive/conversations', data);
    return response.data;
  },

  async getConversations(page: number = 1, pageSize: number = 20): Promise<OliveConversationListResponse> {
    const response = await api.get<OliveConversationListResponse>('/olive/conversations', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  async getConversation(conversationId: string): Promise<OliveConversationDetailResponse> {
    const response = await api.get<OliveConversationDetailResponse>(`/olive/conversations/${conversationId}`);
    return response.data;
  },

  async updateConversationTitle(conversationId: string, title: string): Promise<OliveConversationResponse> {
    const response = await api.put<OliveConversationResponse>(`/olive/conversations/${conversationId}/title`, { title });
    return response.data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/olive/conversations/${conversationId}`);
  },
};

