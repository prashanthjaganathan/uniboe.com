import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Users, Home, MessageCircle, Bot, Shield, ArrowRight, Globe,
  Heart, Star, Verified, Lock, Instagram, Linkedin, Camera, Clock,
  CheckCircle, Award, Map
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/20 to-emerald-100/20"></div>

        {/* Floating Olive Chatbot */}
        <div className="fixed top-6 right-6 z-50">
          <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300 cursor-pointer">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="relative z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="font-bold text-slate-900 text-xl">Uniboe</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="hover:bg-cyan-50 text-slate-600"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Globe className="w-4 h-4" />
                Trusted by 50,000+ international students
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Your life abroad,{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  simplified.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Connect with students, find verified housing, get legal updates, and navigate life abroad with confidence. All in one trusted platform.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Verified Housing</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-600">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Secure Platform</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Award className="w-5 h-5" />
                  <span className="text-sm font-medium">Community Verified</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 px-8 py-4 text-lg font-semibold rounded-2xl"
                >
                  Get started — join now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-4 text-lg rounded-2xl"
                >
                  See how it works
                </Button>
              </div>
            </div>

            {/* Right Column - Interface Mockups */}
            <div className="relative">
              <div className="flex items-center justify-center gap-8">
                {/* Web Interface Mockup */}
                <div className="hidden lg:block transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <Card className="w-80 h-96 bg-white shadow-2xl border-0 rounded-3xl overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2"></div>
                    <CardContent className="p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-cyan-500 rounded-full"></div>
                        <div>
                          <div className="font-semibold text-sm">Community Feed</div>
                          <div className="text-xs text-slate-500">Global updates</div>
                        </div>
                      </div>

                      {/* Feed Post with Image */}
                      <Card className="bg-slate-50 border-0 rounded-2xl p-4 mb-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full"></div>
                          <div>
                            <div className="text-sm font-medium">Sarah M.</div>
                            <div className="text-xs text-slate-500">NYU • 2h ago</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-700 mb-3">
                          Just found an amazing coffee shop near campus! Perfect study spot 📚☕
                        </div>
                        <div className="bg-gradient-to-r from-cyan-200 to-emerald-200 h-20 rounded-xl mb-3"></div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Heart className="w-3 h-3" />
                            24
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MessageCircle className="w-3 h-3" />
                            8
                          </div>
                        </div>
                      </Card>

                      <Card className="bg-slate-50 border-0 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"></div>
                          <div>
                            <div className="text-sm font-medium">Alex K.</div>
                            <div className="text-xs text-slate-500">MIT • 4h ago</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-700">
                          Anyone know about the new visa regulations? 🤔
                        </div>
                      </Card>
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile Interface Mockup */}
                <div className="transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Card className="w-64 h-[480px] bg-white shadow-2xl border-0 rounded-[2rem] overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1"></div>
                    <CardContent className="p-4 h-full">
                      {/* Mobile Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-semibold text-sm">Housing</div>
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>

                      {/* Tab Navigation */}
                      <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
                        <div className="flex-1 bg-white rounded-lg py-2 text-center text-xs font-medium shadow-sm">Housing</div>
                        <div className="flex-1 py-2 text-center text-xs text-slate-500">Flatmates</div>
                        <div className="flex-1 py-2 text-center text-xs text-slate-500">Sublease</div>
                      </div>

                      {/* Housing Listing */}
                      <Card className="border-0 rounded-2xl overflow-hidden shadow-lg mb-4">
                        <div className="relative">
                          <div className="bg-gradient-to-br from-cyan-300 to-emerald-300 h-32"></div>
                          <Badge className="absolute top-2 left-2 bg-emerald-500 text-white border-0 text-xs">
                            <Verified className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                          <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
                            <Heart className="w-4 h-4 text-slate-600" />
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-sm mb-1">Cozy Studio Near NYU</div>
                          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Greenwich Village
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-cyan-600">$2,200/mo</div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">4.8</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Profile Preview */}
                      <Card className="bg-gradient-to-r from-cyan-50 to-emerald-50 border-0 rounded-2xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Emma Chen</div>
                            <div className="text-xs text-slate-500">Columbia • Computer Science</div>
                          </div>
                          <div className="flex gap-1">
                            <Instagram className="w-4 h-4 text-pink-500" />
                            <Linkedin className="w-4 h-4 text-cyan-600" />
                          </div>
                        </div>
                      </Card>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Global Motifs */}
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-cyan-100 rounded-full opacity-60"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-emerald-100 rounded-full opacity-60"></div>
              <div className="absolute top-1/2 -right-12 w-6 h-6 bg-indigo-100 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Everything you need in{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                one platform
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto">
              From housing to community, legal updates to AI assistance - we've got your international student journey covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-cyan-50 to-emerald-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Housing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Find trusted, verified listings with transparent pricing and community reviews.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-emerald-50 to-cyan-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Global Community</h3>
                <p className="text-slate-600 leading-relaxed">
                  Connect with students worldwide. Share experiences, tips, and build lasting friendships.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Assistant</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get instant answers from Olive, your 24/7 AI companion for student life questions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Join 50,000+ students worldwide
          </h2>
          <p className="text-lg lg:text-xl text-slate-300 mb-8">
            Start your journey with the most trusted platform for international students.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 px-8 py-4 text-lg font-semibold rounded-2xl"
          >
            Get started — join now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
