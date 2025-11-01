import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { oliveService } from '@/services/olive.service';
import { OliveConversationResponse, OliveMessageResponse } from '@/types/olive.types';
import { Sparkles, Plus, Trash2, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const OliveChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<OliveConversationResponse[]>([]);
  const [currentMessages, setCurrentMessages] = useState<OliveMessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setCurrentMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !conversationId) {
      setInputMessage(query);
      handleSendMessage(query);
    }
  }, [searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await oliveService.getConversations(1, 50);
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await oliveService.getConversation(id);
      setCurrentMessages(response.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || inputMessage;
    if (!message.trim() || loading) return;

    setLoading(true);
    const tempUserMessage: OliveMessageResponse = {
      id: 'temp-' + Date.now(),
      conversation_id: conversationId || '',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };

    setCurrentMessages(prev => [...prev, tempUserMessage]);
    setInputMessage('');

    try {
      const response = await oliveService.chat({
        message,
        conversation_id: conversationId,
      });

      setCurrentMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);
        return [...filtered, response.user_message, response.assistant_message];
      });

      if (!conversationId) {
        navigate(`/olive/chat/${response.conversation_id}`);
        loadConversations();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setCurrentMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      alert(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    navigate('/olive/chat');
    setCurrentMessages([]);
    setInputMessage('');
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await oliveService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        navigate('/olive/chat');
        setCurrentMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <Button onClick={handleNewChat} className="w-full" variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          <div className="px-2">
            {loadingConversations ? (
              <p className="text-center text-gray-500 text-sm py-4">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/olive/chat/${conv.id}`)}
                  className={`w-full text-left p-3 rounded-lg mb-2 hover:bg-gray-100 transition-colors group ${
                    conversationId === conv.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.title || 'New Conversation'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conv.message_count} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-16 h-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Ask Olive Anything</h2>
                <p className="text-gray-600">
                  Start a conversation with Olive to get help with research, taxes, legal info, and more.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-white border'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center mr-2">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-sm">Olive</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="max-w-3xl mx-auto flex gap-4">
              <Textarea
                placeholder="Ask Olive anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
                rows={3}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                variant="gradient"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2 max-w-3xl mx-auto">
              {inputMessage.length}/10000 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OliveChat;

