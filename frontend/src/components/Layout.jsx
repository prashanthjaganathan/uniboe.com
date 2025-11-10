import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, MessageCircle, Building2, Users, Bot, User, Bell, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Home',
    url: createPageUrl('Home'),
    icon: Home,
  },
  {
    title: 'Feed',
    url: createPageUrl('Feed'),
    icon: MessageCircle,
  },
  {
    title: 'Housing',
    url: createPageUrl('Housing'),
    icon: Building2,
  },
  {
    title: 'Community',
    url: createPageUrl('Community'),
    icon: Users,
  },
  {
    title: 'Messages',
    url: createPageUrl('Messages'),
    icon: Mail,
  },
  {
    title: 'Olive',
    url: createPageUrl('Chat'),
    icon: Bot,
  },
  {
    title: 'Profile',
    url: createPageUrl('Profile'),
    icon: User,
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <style>{`
        :root {
          --uniboe-primary: #00CFFF;
          --uniboe-primary-dark: #00B8E6;
          --uniboe-secondary: #0A1A2F;
          --uniboe-secondary-light: #1A2B47;
          --uniboe-accent: #F8FAFC;
          --uniboe-accent-dark: #E2E8F0;
          --uniboe-highlight: #10B981;
          --uniboe-highlight-light: #34D399;
        }
      `}</style>

      <SidebarProvider>
        <div className="flex w-full">
          {/* Desktop Sidebar */}
          <Sidebar className="hidden md:flex border-r-0 bg-white/90 backdrop-blur-xl shadow-xl">
            <SidebarHeader className="p-6 border-b border-cyan-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">U</span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">Uniboe</h2>
                  <p className="text-xs text-slate-500">Student Life Companion</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`rounded-2xl transition-all duration-200 hover:bg-cyan-50 hover:text-cyan-700 group ${
                            location.pathname === item.url
                              ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-white shadow-lg'
                              : 'text-slate-600'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon
                              className={`w-5 h-5 ${
                                location.pathname === item.url
                                  ? 'text-white'
                                  : 'text-slate-500 group-hover:text-cyan-600'
                              }`}
                            />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Logout button at bottom */}
              <div className="mt-auto p-3 border-t border-cyan-100">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </Button>
                {user && (
                  <div className="mt-2 px-4 py-2 text-xs text-slate-500">
                    <div className="font-medium text-slate-700">{user.full_name}</div>
                    <div className="truncate">{user.email}</div>
                  </div>
                )}
              </div>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            {/* Mobile Header */}
            <header className="md:hidden bg-white/95 backdrop-blur-xl border-b border-cyan-100 px-4 py-3 sticky top-0 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="hover:bg-cyan-50 p-2 rounded-xl transition-colors duration-200" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">U</span>
                    </div>
                    <span className="font-bold text-slate-900">Uniboe</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-cyan-50 rounded-xl transition-colors duration-200">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            </header>

            {/* Mobile Sidebar */}
            <div className="md:hidden">
              <Sidebar className="bg-white/95 backdrop-blur-xl">
                <SidebarContent className="p-4">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        {navigationItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={`rounded-2xl transition-all duration-200 hover:bg-cyan-50 hover:text-cyan-700 ${
                                location.pathname === item.url
                                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-white shadow-lg'
                                  : 'text-slate-600'
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>

                  {/* Mobile Logout button */}
                  <div className="mt-auto pt-4 border-t border-cyan-100">
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full justify-start gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </Button>
                    {user && (
                      <div className="mt-2 px-4 py-2 text-xs text-slate-500">
                        <div className="font-medium text-slate-700">{user.full_name}</div>
                        <div className="truncate">{user.email}</div>
                      </div>
                    )}
                  </div>
                </SidebarContent>
              </Sidebar>
            </div>

            {/* Main content area */}
            <div className="flex-1">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
