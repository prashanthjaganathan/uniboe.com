import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { oliveService } from '@/services/olive.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Home,
  Plane,
  BookOpen,
  Heart,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Search,
  MoreVertical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ChatPage() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationSearch, setConversationSearch] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all conversations
  const loadConversations = async () => {
    if (!token) return;

    setLoadingConversations(true);
    try {
      const response = await oliveService.getConversations(1, 50);
      setConversations(response.conversations);

      // Load the most recent conversation if none is selected
      if (!conversationId && response.conversations.length > 0) {
        const latestConv = response.conversations[0];
        await loadConversation(latestConv.id);
      } else if (response.conversations.length === 0) {
        // Show welcome message if no conversations
        showWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      showWelcomeMessage();
    } finally {
      setLoadingConversations(false);
      setLoadingConversation(false);
    }
  };

  // Load specific conversation
  const loadConversation = async (convId) => {
    setLoadingConversation(true);
    try {
      const convDetail = await oliveService.getConversation(convId);
      setConversationId(convDetail.id);
      setConversationTitle(convDetail.title);
      setMessages(convDetail.messages);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoadingConversation(false);
    }
  };

  const showWelcomeMessage = () => {
    setConversationId(null);
    setConversationTitle(null);
    setMessages([
      {
        id: 'welcome',
        conversation_id: null,
        role: 'assistant',
        content:
          "Hi there! I'm Olive, your friendly AI companion for student life abroad. I'm here to help you with housing questions, visa information, campus life tips, and anything else you need support with. What can I help you with today?",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [token]);

  // Start new conversation
  const handleNewConversation = () => {
    showWelcomeMessage();
  };

  // Delete conversation
  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await oliveService.deleteConversation(convId);

      // If we deleted the current conversation, show welcome
      if (convId === conversationId) {
        showWelcomeMessage();
      }

      // Reload conversations
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !token) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Optimistically add user message to UI
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessageContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev.filter((m) => m.id !== 'welcome'), tempUserMessage]);

    try {
      // Send message to Olive API
      const response = await oliveService.chat({
        message: userMessageContent,
        conversation_id: conversationId || undefined,
      });

      // Update conversation ID if this was a new conversation
      const isNewConversation = !conversationId;
      if (isNewConversation) {
        setConversationId(response.conversation_id);

        // Generate title from first message
        let title =
          userMessageContent.length < 50
            ? userMessageContent
            : userMessageContent.substring(0, 47) + '...';
        setConversationTitle(title);

        // Update the title on the backend
        try {
          await oliveService.updateConversationTitle(response.conversation_id, title);
        } catch (err) {
          console.error('Error updating title:', err);
        }

        // Reload conversations list
        await loadConversations();
      }

      // Replace temp message with real message and add assistant response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempUserMessage.id)
          .concat([response.user_message, response.assistant_message])
      );
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Show error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. Please try again later. If the issue persists, please contact support.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    { icon: Home, text: 'How do I find student housing?', category: 'housing' },
    { icon: Plane, text: 'Visa renewal process', category: 'visa' },
    { icon: BookOpen, text: 'Study tips for international students', category: 'academic' },
    { icon: Heart, text: 'Dealing with homesickness', category: 'wellbeing' },
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  if (loadingConversation && loadingConversations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50/30 to-orange-50/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading Olive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-orange-50/20 flex">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Olive AI</h2>
            </div>
            <Button
              onClick={handleNewConversation}
              size="icon"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full h-8 w-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Click + to start chatting</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                  conversationId === conv.id ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm text-slate-900 truncate">
                        {conv.title || 'New Conversation'}
                      </h3>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                        {conv.last_message_at ? formatTimestamp(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {conv.message_count} {conv.message_count === 1 ? 'message' : 'messages'}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-red-50 hover:text-red-600 rounded-lg"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    {conversationTitle || 'Chat with Olive'}
                  </h1>
                  <p className="text-xs text-slate-500">AI companion for student life</p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Questions - Only show when starting new conversation */}
        {messages.length <= 1 && messages[0]?.id === 'welcome' && (
          <div className="p-4 max-w-4xl mx-auto w-full">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-center text-base">Try asking me about...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-3 rounded-xl text-left hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      onClick={() => handleQuickQuestion(question.text)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <question.icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{question.text}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-slate-50/50 to-purple-50/20">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-sm lg:max-w-md xl:max-w-lg`}>
                  <div
                    className={`p-3 rounded-2xl shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  <p
                    className={`text-xs text-slate-500 mt-1 px-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Olive anything about student life..."
                className="flex-1 rounded-2xl border-slate-200 focus:ring-purple-500 focus:border-purple-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs text-slate-500 border-purple-200">
                <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                AI-powered responses
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
