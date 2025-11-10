import React, { useState, useRef, useEffect } from 'react';
import { InvokeLLM } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Home, Plane, BookOpen, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'olive',
      content:
        "Hi there! I'm Olive, your friendly AI companion for student life abroad. I'm here to help you with housing questions, visa information, campus life tips, and anything else you need support with. What can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await InvokeLLM({
        prompt: `You are Olive, a friendly and helpful AI assistant specifically designed to help international students studying abroad. You should be warm, empathetic, and knowledgeable about student life, housing, visas, academic life, and general life abroad challenges.

Current user message: "${inputMessage}"

Respond in a helpful, friendly way as Olive. Keep your response conversational and supportive. If the question is about housing, visa, legal rights, campus life, or student services, provide specific and practical advice. If it's a general question, still respond helpfully while maintaining your role as a student life companion.`,
        add_context_from_internet: true,
      });

      const oliveMessage = {
        id: messages.length + 2,
        sender: 'olive',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, oliveMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: messages.length + 2,
        sender: 'olive',
        content:
          "I'm sorry, I encountered an issue processing your request. Please try again in a moment!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Chat with Olive</h1>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-slate-600">Your AI companion for student life abroad</p>
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-lg">Try asking me about...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 rounded-2xl text-left hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
                    onClick={() => handleQuickQuestion(question.text)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <question.icon className="w-5 h-5 text-rose-500 flex-shrink-0" />
                      <span className="text-slate-700">{question.text}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4 max-h-96 lg:max-h-[500px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'olive' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-sm lg:max-w-md xl:max-w-lg ${message.sender === 'user' ? 'order-first' : ''}`}
                  >
                    <div
                      className={`p-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white ml-auto'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <p
                      className={`text-xs text-slate-500 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm">
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
                  <div className="bg-slate-100 rounded-2xl p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Olive anything about student life..."
                className="flex-1 rounded-2xl border-slate-200 focus:ring-rose-500 focus:border-rose-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-2xl px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="text-xs text-slate-500">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-powered responses
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
