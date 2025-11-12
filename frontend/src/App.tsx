import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Import new pages
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Home from './pages/home';
import Feed from './pages/feed';
import Housing from './pages/Housing';
import HousingDetails from './pages/HousingDetails';
import Community from './pages/Community';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Olive from './pages/Olive';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          {/* Public routes - no sidebar */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />

          {/* Protected routes - all use Layout and require authentication */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Layout>
                  <Feed />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/housing"
            element={
              <ProtectedRoute>
                <Layout>
                  <Housing />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/housing/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <HousingDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Layout>
                  <Community />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Layout>
                  <Messages />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <Olive />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/olive"
            element={
              <ProtectedRoute>
                <Layout>
                  <Olive />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
