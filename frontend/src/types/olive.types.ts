export type MessageRole = 'user' | 'assistant';

export interface OliveMessageCreate {
  content: string;
}

export interface OliveMessageResponse {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface OliveConversationCreate {
  title?: string;
}

export interface OliveConversationResponse {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  message_count: number;
  last_message_at: string | null;
}

export interface OliveConversationListResponse {
  conversations: OliveConversationResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface OliveConversationDetailResponse {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  messages: OliveMessageResponse[];
}

export interface OliveChatRequest {
  message: string;
  conversation_id?: string;
  system_prompt?: string;
}

export interface OliveChatResponse {
  conversation_id: string;
  user_message: OliveMessageResponse;
  assistant_message: OliveMessageResponse;
}

