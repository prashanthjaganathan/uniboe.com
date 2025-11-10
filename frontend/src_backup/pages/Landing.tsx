import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Users,
  Home,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Lock,
  Monitor,
  Zap,
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your All-in-One{' '}
                <span className="gradient-text">Student Life</span>{' '}
                Companion
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Unlock the ultimate university experience with Uniboe. Find roommates,
                discover apartments, buy & sell items, and stay connected—all in one
                trusted platform designed for students. From stories and moments to posts
                from campuses nationwide, see what student life really looks like.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" variant="gradient" className="w-full sm:w-auto">
                    Join Uniboe Today →
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20"></div>
                <img
                  src="/hero-image.jpg"
                  alt="Student Campus"
                  className="relative rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need for <span className="gradient-text">University Life</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Uniboe brings together all the essential tools and connections you need to thrive
              during your university journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Social Feed */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Social Feed</h3>
                <p className="text-gray-600 text-sm">
                  Easily find roommates and share campus experiences through engaging posts in a
                  verified student community.
                </p>
              </CardContent>
            </Card>

            {/* Apartment Finder */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Apartment Finder</h3>
                <p className="text-gray-600 text-sm">
                  Discover nearby apartments with tailored search filters to find the perfect home
                  for your university years.
                </p>
              </CardContent>
            </Card>

            {/* Direct Messaging */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Direct Messaging</h3>
                <p className="text-gray-600 text-sm">
                  Communicate effortlessly with fellow students and potential roommates through our
                  secure messaging system.
                </p>
              </CardContent>
            </Card>

            {/* Olive AI Assistant */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Olive AI Assistant</h3>
                <p className="text-gray-600 text-sm">
                  Meet Olive, your AI sidekick for instant searches - taxes, research, legal info,
                  marketplace and more. No more endless scrolling - just ask and find. 🤖✨
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto text-center">
          <p className="text-blue-600 font-medium mb-4 flex items-center justify-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Join the Student Revolution
          </p>
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your{' '}
            <span className="gradient-text">University Experience?</span>
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Join the student network to discover the power of Uniboe. Sign up today and unlock the
            ultimate campus life companion.
          </p>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <GraduationCap className="w-8 h-8 mb-2 text-primary" />
              <p className="font-medium">Student Verified</p>
            </div>
            <div className="flex flex-col items-center">
              <Lock className="w-8 h-8 mb-2 text-primary" />
              <p className="font-medium">Secure & Safe</p>
            </div>
            <div className="flex flex-col items-center">
              <Monitor className="w-8 h-8 mb-2 text-primary" />
              <p className="font-medium">Web Ready</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-8 h-8 mb-2 text-primary" />
              <p className="font-medium">Lightning Fast</p>
            </div>
          </div>

          <Link to="/register">
            <Button size="lg" variant="gradient">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;

