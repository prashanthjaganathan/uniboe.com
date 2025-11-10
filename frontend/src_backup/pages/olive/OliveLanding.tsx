import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, BookOpen, DollarSign, Scale, Home } from 'lucide-react';

const OliveLanding = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/olive/chat?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/olive/chat');
    }
  };

  const categories = [
    {
      name: 'Research & Academic',
      icon: BookOpen,
      color: 'purple',
      questions: [
        'How do I write a literature review?',
        'Explain quantum physics in simple terms',
        'Help me cite sources in APA format',
        'What\'s the difference between quantitative and qualitative research?',
      ],
    },
    {
      name: 'Taxes & Finance',
      icon: DollarSign,
      color: 'green',
      questions: [
        'How do students file taxes?',
        'What education tax credits can I claim?',
        'Are scholarships taxable?',
        'Student loan interest deduction',
      ],
    },
    {
      name: 'Legal & Rights',
      icon: Scale,
      color: 'pink',
      questions: [
        'What are my rights as a tenant?',
        'Understanding student loan protections',
        'Copyright law for students',
        'Employment rights for part-time students',
      ],
    },
    {
      name: 'Marketplace & Housing',
      icon: Home,
      color: 'blue',
      questions: [
        'Find 40 inch table with drawers',
        'Look for macbook pro 13 inch',
        'Search mini fridge perfect for dorm',
        'Find 2 bedroom apartment near campus',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-brand mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Ask <span className="gradient-text">Olive</span> Anything
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your intelligent research companion with smart marketplace search
          </p>

          {/* Search Input */}
          <div className="max-w-3xl mx-auto flex gap-4">
            <Input
              placeholder="Ask Olive anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-14 text-lg"
            />
            <Button onClick={handleSearch} size="lg" variant="gradient" className="px-8">
              <Sparkles className="w-5 h-5 mr-2" />
              Ask Olive
            </Button>
          </div>
        </div>

        {/* Quick Start Categories */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Quick Start</h2>
          <p className="text-center text-gray-600 mb-8">
            Choose a category to explore what Olive can help you with
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-${category.color}-100 flex items-center justify-center mb-4`}
                  >
                    <category.icon className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <h3 className="font-semibold mb-4">{category.name}</h3>
                  <ul className="space-y-2">
                    {category.questions.map((question, qIdx) => (
                      <li key={qIdx}>
                        <button
                          onClick={() => {
                            setQuery(question);
                            navigate(`/olive/chat?q=${encodeURIComponent(question)}`);
                          }}
                          className="text-sm text-gray-600 hover:text-primary text-left w-full flex items-start"
                        >
                          <span className="mr-2">›</span>
                          <span>{question}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OliveLanding;

