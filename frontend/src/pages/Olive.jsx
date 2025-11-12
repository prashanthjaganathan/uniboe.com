import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { oliveApi } from '@/services/oliveApi';
import {
  Sparkles,
  Send,
  BookOpen,
  DollarSign,
  Scale,
  GraduationCap,
  Copy,
  Share2,
  MessageSquareMore,
  Mic,
  Plus,
  ChevronRight,
  Zap,
  X,
  Search,
  Building,
  ShoppingCart,
  Home,
  Users,
  Globe,
  Calendar,
  MapPin,
  Eye,
  Save,
  Share,
} from 'lucide-react';

export default function Olive() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeTab, setActiveTab] = useState('campus');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const suggestions = [
    {
      category: 'Research & Academic',
      icon: BookOpen,
      color: 'from-blue-500 to-purple-500',
      questions: [
        'How do I write a literature review?',
        'Explain quantum physics in simple terms',
        'Help me cite sources in APA format',
        "What's the difference between qualitative and quantitative research?",
      ],
    },
    {
      category: 'Taxes & Finance',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      questions: [
        'How do students file taxes?',
        'What education tax credits can I claim?',
        'Are scholarships taxable?',
        'Student loan interest deduction explained',
      ],
    },
    {
      category: 'Legal & Rights',
      icon: Scale,
      color: 'from-purple-500 to-pink-500',
      questions: [
        'What are my rights as a tenant?',
        'Understanding student loan protections',
        'Copyright law for students',
        'Employment rights for part-time workers',
      ],
    },
    {
      category: 'Study & Life',
      icon: GraduationCap,
      color: 'from-orange-500 to-red-500',
      questions: [
        'Create a study schedule for finals',
        'How to manage stress during exams',
        'Tips for group project collaboration',
        'Time management strategies',
      ],
    },
  ];

  const handleSendMessage = async (question) => {
    const messageText = question || inputValue.trim();
    if (!messageText) return;

    setIsChatMode(true);
    setIsLoading(true);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      // Determine category from message content
      const category = oliveApi.determineCategoryFromMessage(messageText);

      // Make real API call to Olive AI
      const response = await oliveApi.sendMessage({
        message: messageText,
        category,
        userId: 'anonymous',
      });

      // Create AI message from real response
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date(),
        sources: response.sources,
        followUps: response.followUp,
        model: response.model,
      };

      console.log('=== FRONTEND RECEIVED RESPONSE ===');
      console.log('Response:', response);
      console.log('AI Message:', aiMessage);

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.log('=== FRONTEND ERROR ===');
      console.log('Error:', error);
      console.error('Olive AI Error:', error);

      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: `I'm sorry, I'm having trouble connecting to my AI services right now. This could be because the AI models are loading or there's a temporary connection issue. Please try again in a moment.`,
        isUser: false,
        timestamp: new Date(),
        error: true,
        sources: [
          { type: 'System Status', badge: 'System Status' },
          { type: 'Troubleshooting Guide', badge: 'Troubleshooting Guide' },
        ],
        followUps: [
          'Try asking again in a moment',
          'Check system status',
          'Contact support if the issue persists',
        ],
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  const campusCategories = [
    { id: 'events', label: 'Events', icon: Calendar, color: 'from-blue-500 to-purple-500' },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-500',
    },
    { id: 'housing', label: 'Housing', icon: Home, color: 'from-orange-500 to-red-500' },
    {
      id: 'study-groups',
      label: 'Study Groups',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    { id: 'campus-info', label: 'Campus Info', icon: Building, color: 'from-teal-500 to-cyan-500' },
    { id: 'resources', label: 'Resources', icon: BookOpen, color: 'from-indigo-500 to-blue-500' },
  ];

  const webCategories = [
    {
      id: 'academic',
      label: 'Academic Research',
      icon: BookOpen,
      color: 'from-blue-500 to-purple-500',
    },
    { id: 'legal', label: 'Legal Resources', icon: Scale, color: 'from-purple-500 to-pink-500' },
    {
      id: 'finance',
      label: 'Financial Info',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    { id: 'general', label: 'General Web', icon: Globe, color: 'from-gray-500 to-gray-600' },
  ];

  const handleAdvancedSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    // Mock search results
    setTimeout(() => {
      const mockResults = [
        {
          id: 1,
          title: 'Study Table - Great Condition',
          description:
            'Solid wood study table perfect for dorm rooms. Excellent condition, only used for one semester.',
          source: 'campus',
          category: 'marketplace',
          price: '$75',
          location: 'Campus Marketplace',
        },
        {
          id: 2,
          title: 'Final Exam Study Group - Psychology 101',
          description:
            'Join our study group for Psychology 101 final exam. Meeting every Tuesday and Thursday at 7 PM.',
          source: 'campus',
          category: 'study-groups',
          members: '8/12 members',
          location: 'Library Study Room B',
          date: 'Dec 15, 2024',
        },
        {
          id: 3,
          title: 'Effective Study Techniques Research',
          description:
            'Comprehensive research on proven study methods and learning strategies for college students.',
          source: 'web',
          category: 'academic',
          url: 'https://example.com/study-techniques',
          citation: 'Smith, J. (2024). Effective Study Techniques for Higher Education.',
        },
      ];

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const renderAdvancedSearchModal = () => {
    if (!showAdvancedSearch) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Advanced Search</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAdvancedSearch(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across campus and web..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                />
              </div>
              <Button
                onClick={handleAdvancedSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="campus">Campus Search</TabsTrigger>
              <TabsTrigger value="web">Web Research</TabsTrigger>
              <TabsTrigger value="smart">Smart Search</TabsTrigger>
            </TabsList>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <TabsContent value="campus" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Search Categories</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {campusCategories.map((category) => (
                        <Card
                          key={category.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedCategories.includes(category.id)
                              ? 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-950/20'
                              : ''
                          }`}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}
                              >
                                <category.icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium">{category.label}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium mb-2">Example searches:</p>
                    <ul className="space-y-1">
                      <li>• "Study table under $100"</li>
                      <li>• "Computer Science study group"</li>
                      <li>• "2-bedroom apartment near campus"</li>
                      <li>• "Physics tutoring sessions"</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="web" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Research Sources</h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                      {webCategories.map((category) => (
                        <Card
                          key={category.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedCategories.includes(category.id)
                              ? 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-950/20'
                              : ''
                          }`}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}
                              >
                                <category.icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium">{category.label}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Citation Format</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        APA
                      </Button>
                      <Button variant="outline" size="sm">
                        MLA
                      </Button>
                      <Button variant="outline" size="sm">
                        Chicago
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium mb-2">Example searches:</p>
                    <ul className="space-y-1">
                      <li>• "Climate change research papers 2024"</li>
                      <li>• "Student tax deductions guide"</li>
                      <li>• "Tenant rights in [state]"</li>
                      <li>• "Machine learning tutorials"</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="smart" className="mt-0">
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium mb-2">Intelligent Search</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                      AI combines campus resources and web results to give you comprehensive answers
                      with proper citations and local context.
                    </p>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium mb-2">Smart search combines:</p>
                    <ul className="space-y-1">
                      <li>• Campus marketplace and housing listings</li>
                      <li>• Study groups and academic resources</li>
                      <li>• Web research and academic papers</li>
                      <li>• Local and relevant context</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Results Section */}
          {searchResults.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-medium mb-4">Search Results ({searchResults.length})</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{result.title}</h4>
                            <Badge variant={result.source === 'campus' ? 'default' : 'secondary'}>
                              {result.source === 'campus' ? 'Campus' : 'Web'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {result.price && <span>{result.price}</span>}
                            {result.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {result.location}
                              </span>
                            )}
                            {result.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {result.date}
                              </span>
                            )}
                            {result.members && <span>{result.members}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isChatMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20">
        {/* Chat Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Olive AI Assistant</h1>
                  <p className="text-sm text-slate-600">Your research companion</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChatMode(false);
                  setMessages([]);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="container mx-auto px-4 py-6 pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <Avatar className="w-8 h-8 bg-gradient-to-r from-rose-500 to-orange-500">
                    <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[70%] ${message.isUser ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.isUser
                        ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white ml-auto'
                        : message.error
                          ? 'bg-red-50 border border-red-200 text-slate-900'
                          : 'bg-white text-slate-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {!message.isUser && message.model && (
                      <p className="text-xs opacity-70 mt-2">
                        Powered by{' '}
                        {message.model === 'fallback'
                          ? 'Olive Assistant'
                          : `${message.model} model`}
                      </p>
                    )}
                  </div>

                  {!message.isUser && (
                    <div className="mt-3 space-y-3">
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Share2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <MessageSquareMore className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Sources */}
                      {message.sources && (
                        <div>
                          <p className="text-xs text-slate-600 mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <Badge
                                key={idx}
                                variant={message.error ? 'secondary' : 'default'}
                                className={`text-xs ${message.error ? '' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                              >
                                {typeof source === 'string' ? source : source.badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-ups */}
                      {message.followUps && (
                        <div>
                          <p className="text-xs text-slate-600 mb-2">Ask follow-up:</p>
                          <div className="space-y-1">
                            {message.followUps.map((followUp, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-xs text-left justify-start w-full hover:bg-slate-100"
                                onClick={() => handleQuestionClick(followUp)}
                              >
                                <ChevronRight className="w-3 h-3 mr-1" />
                                {followUp}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.isUser && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-avatar.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="w-8 h-8 bg-gradient-to-r from-rose-500 to-orange-500">
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white rounded-lg px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className="pr-12"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0">
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 hover:shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-rose-100/50 via-orange-100/50 to-purple-100/50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold mb-4 text-slate-900">
              Ask{' '}
              <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                Olive
              </span>{' '}
              Anything
            </h1>

            <p className="text-xl text-slate-600 mb-8">
              Your intelligent research and study companion
            </p>

            {/* Search Box */}
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="overflow-hidden border-2 border-rose-200 hover:border-rose-400 transition-colors shadow-lg">
                <CardContent className="p-0">
                  <div className="flex">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask Olive anything - research, taxes, legal questions, study help..."
                      className="flex-1 border-0 text-lg py-6 px-6 focus-visible:ring-0"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      className="m-2 px-6"
                      onClick={() => setShowAdvancedSearch(true)}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Advanced Search
                    </Button>
                    <Button
                      size="lg"
                      className="m-2 px-8 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim()}
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Ask Olive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">Quick Start</h2>
          <p className="text-slate-600">
            Choose a category to explore what Olive can help you with
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {suggestions.map((category) => (
            <Card
              key={category.category}
              className="hover:shadow-md transition-shadow group border-0 bg-white/80 backdrop-blur-sm shadow-lg flex flex-col h-full"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-base font-semibold">{category.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  {category.questions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-normal leading-relaxed"
                      onClick={() => handleQuestionClick(question)}
                    >
                      <ChevronRight className="w-3 h-3 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-left break-words">{question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Preview */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-6 text-slate-900">Why Olive?</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium mb-2 text-slate-900">Research Assistant</h4>
              <p className="text-sm text-slate-600">
                Get help with academic papers, citations, and research methodology
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium mb-2 text-slate-900">Financial Guidance</h4>
              <p className="text-sm text-slate-600">
                Navigate student taxes, scholarships, and financial planning
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium mb-2 text-slate-900">Study Companion</h4>
              <p className="text-sm text-slate-600">
                Create study plans, explain concepts, and improve your learning
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      {renderAdvancedSearchModal()}
    </div>
  );
}
