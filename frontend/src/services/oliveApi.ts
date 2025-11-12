import api from './api';
import { OliveChatResponse } from '@/types/olive.types';

export interface OliveResponse {
  response: string;
  sources?: Array<{ type: string; badge: string }>;
  followUp?: string[];
  model?: string;
  conversationId?: string;
}

export interface OliveRequest {
  message: string;
  category?: string;
  userId?: string;
  conversationId?: string;
}

export const oliveApi = {
  async sendMessage(request: OliveRequest): Promise<OliveResponse> {
    try {
      const response = await api.post<OliveChatResponse>('/olive/chat', {
        message: request.message,
        conversation_id: request.conversationId,
      });

      // Transform backend response to frontend format
      const backendData = response.data;

      return {
        response: backendData.assistant_message.content,
        conversationId: backendData.conversation_id,
        sources: [{ type: 'AI Assistant', badge: 'AI Assistant' }],
        followUp: [
          'Tell me more about this topic',
          'Can you explain that differently?',
          'What are some related concepts?',
        ],
        model: 'claude',
      };
    } catch (error: unknown) {
      console.error('Olive API Error:', error);
      throw error;
    }
  },

  determineCategoryFromMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('tax') ||
      lowerMessage.includes('finance') ||
      lowerMessage.includes('money')
    ) {
      return 'finance';
    }
    if (
      lowerMessage.includes('legal') ||
      lowerMessage.includes('law') ||
      lowerMessage.includes('rights')
    ) {
      return 'legal';
    }
    if (
      lowerMessage.includes('research') ||
      lowerMessage.includes('paper') ||
      lowerMessage.includes('citation')
    ) {
      return 'academic';
    }

    return 'general';
  },
};
