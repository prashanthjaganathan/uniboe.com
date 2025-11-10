import { Routes, Route} from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Lazy load pages for better performance
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import Feed from './pages/feed/Feed';
import PostDetail from './pages/feed/PostDetail';
import HousingList from './pages/housing/HousingList';
import ListingDetail from './pages/housing/ListingDetail';
import CreateListing from './pages/housing/CreateListing';
import MyListings from './pages/housing/MyListings';
import Profile from './pages/profile/Profile';
import EditProfile from './pages/profile/EditProfile';
import UserProfile from './pages/profile/UserProfile';
import SearchProfiles from './pages/profile/SearchProfiles';
import OliveLanding from './pages/olive/OliveLanding';
import OliveChat from './pages/olive/OliveChat';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/feed/post/:postId" element={<PostDetail />} />
        
        <Route path="/housing" element={<HousingList />} />
        <Route path="/housing/:listingId" element={<ListingDetail />} />
        <Route path="/housing/create" element={<CreateListing />} />
        <Route path="/housing/my-listings" element={<MyListings />} />
        
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/profile/search" element={<SearchProfiles />} />
        
        <Route path="/olive" element={<OliveLanding />} />
        <Route path="/olive/chat" element={<OliveChat />} />
        <Route path="/olive/chat/:conversationId" element={<OliveChat />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

