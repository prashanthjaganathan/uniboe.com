import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Check,
  CheckCheck,
  Loader2,
  Plus,
  X,
  UserPlus,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Messages() {
  const { user, token } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // User search states
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChat && token) {
      fetchMessages(selectedChat.id);
      markConversationAsRead(selectedChat.id);
    }
  }, [selectedChat, token]);

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (userSearchQuery.trim().length > 0) {
        await searchUsers(userSearchQuery);
      } else {
        setSearchedUsers([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages?page=1&page_size=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Reverse to show oldest first
        setMessages((data.messages || []).reverse());
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!token) return;

    setSearchingUsers(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/users/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const users = await response.json();
        setSearchedUsers(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchedUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const createOrGetConversation = async (participantId) => {
    setCreatingConversation(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participant_id: participantId }),
      });

      if (response.ok) {
        const conversation = await response.json();

        // Close search modal
        setShowUserSearch(false);
        setUserSearchQuery('');
        setSearchedUsers([]);

        // Refresh conversations list
        await fetchConversations();

        // Select the new/existing conversation
        setSelectedChat(conversation);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setCreatingConversation(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() && selectedChat && token) {
      setSendingMessage(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/chat/conversations/${selectedChat.id}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: message }),
          }
        );

        if (response.ok) {
          const newMessage = await response.json();
          setMessages([...messages, newMessage]);
          setMessage('');
          // Refresh conversations to update last message
          fetchConversations();
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_participant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex">
      {/* Conversations List */}
      <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            <Button
              onClick={() => setShowUserSearch(true)}
              size="icon"
              className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 rounded-full"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm mt-2">
                Click the <UserPlus className="w-4 h-4 inline" /> button to start chatting
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedChat?.id === conv.id ? 'bg-cyan-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.other_participant?.profile_picture_url} />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-white">
                        {getInitials(conv.other_participant?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{conv.unread_count}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {conv.other_participant?.full_name || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {conv.last_message_at ? formatTimestamp(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 text-xs truncate">
                      {conv.other_participant?.university_name}
                    </p>
                    <p className="text-sm text-slate-600 truncate mt-1">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedChat.other_participant?.profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-white">
                  {getInitials(selectedChat.other_participant?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-slate-900">
                  {selectedChat.other_participant?.full_name || 'Unknown User'}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedChat.other_participant?.university_name || ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                <Phone className="w-5 h-5 text-slate-600" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                <Video className="w-5 h-5 text-slate-600" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-slate-50/50 to-cyan-50/20">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send className="w-8 h-8 text-cyan-600" />
                  </div>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md`}>
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isCurrentUser
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-white'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <div
                        className={`flex items-center gap-1 mt-1 px-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <span className="text-xs text-slate-500">
                          {formatMessageTime(msg.created_at)}
                        </span>
                        {isCurrentUser &&
                          (msg.is_read ? (
                            <CheckCheck className="w-3 h-3 text-cyan-600" />
                          ) : (
                            <Check className="w-3 h-3 text-slate-400" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-slate-100 rounded-full flex-shrink-0"
              >
                <Smile className="w-5 h-5 text-slate-600" />
              </Button>
              <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendingMessage}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-500"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={sendingMessage || !message.trim()}
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500 text-white rounded-full w-10 h-10 p-0 flex-shrink-0"
              >
                {sendingMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50/20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Send className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a conversation</h2>
            <p className="text-slate-600">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}

      {/* User Search Modal */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Start a Conversation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by name..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                </div>
              ) : searchedUsers.length > 0 ? (
                searchedUsers.map((searchedUser) => (
                  <Card
                    key={searchedUser.id}
                    className="p-3 cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200"
                    onClick={() => createOrGetConversation(searchedUser.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={searchedUser.profile_picture_url} />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-white">
                          {getInitials(searchedUser.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {searchedUser.full_name}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {searchedUser.university_name || 'No university'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {searchedUser.university_email}
                        </p>
                      </div>
                      {creatingConversation ? (
                        <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5 text-cyan-600" />
                      )}
                    </div>
                  </Card>
                ))
              ) : userSearchQuery.trim().length > 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No users found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Start typing to search for users</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
