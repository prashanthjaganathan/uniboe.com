import React, { useState, useEffect } from 'react';
import { profileService } from '@/services/profile.service';
import { authService } from '@/services/auth.service';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  MapPin,
  GraduationCap,
  Users,
  Plus,
  Instagram,
  Linkedin,
  Heart,
  Mail,
  X,
  UserPlus,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch global stats - search with space to match all names (most names contain spaces)
  // The backend search excludes current user, so we add 1 to the total count
  const { data: globalStats } = useQuery({
    queryKey: ['profiles', 'global-stats'],
    queryFn: async () => {
      // Search with a space character to match names with spaces
      const result = await profileService.searchProfiles({
        query: ' ',
        page: 1,
        page_size: 5000, // Large page size to get all profiles
      });

      // Add 1 to account for current user (who is excluded from search results)
      return {
        ...result,
        total: (result.total || 0) + 1,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const globalProfiles = globalStats?.profiles || [];
  const totalStudents = globalStats?.total || 0;
  const globalUniversities = [
    ...new Set(globalProfiles.map((p) => p.university_name).filter(Boolean)),
  ];
  const globalCities = [
    ...new Set(
      globalProfiles
        .map((p) => {
          // Try to extract city from university name or use a simplified approach
          const universityName = p.university_name;
          if (!universityName) return null;
          // If university name contains comma, get the part after comma (usually city/state)
          if (universityName.includes(',')) {
            return universityName.split(',')[1]?.trim();
          }
          return null;
        })
        .filter(Boolean)
    ),
  ];

  // Search profiles when user types and presses Enter or clicks Search
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['profiles', 'search', searchQuery],
    queryFn: () => profileService.searchProfiles({ query: searchQuery, page: 1, page_size: 100 }),
    enabled: !!searchQuery,
  });

  const profiles = searchResults?.profiles || [];

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Student Community</h1>
          <p className="text-slate-600">Connect with fellow students around the world</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <Users className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">{totalStudents}</div>
              <div className="text-sm text-slate-600">Students</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <GraduationCap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">
                {globalUniversities.length}
              </div>
              <div className="text-sm text-slate-600">Universities</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">
                {globalCities.length}
              </div>
              <div className="text-sm text-slate-600">Cities</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-sm text-slate-600">Support</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, university, major, or interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 rounded-2xl border-slate-200 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-2xl"
                disabled={!searchTerm.trim()}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {!searchQuery ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Search for Students</h3>
              <p className="text-slate-600">
                Enter a name, university, major, or interest to find students
              </p>
            </CardContent>
          </Card>
        ) : isSearching ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Card
                  key={i}
                  className="animate-pulse border-0 bg-white/80 backdrop-blur-sm shadow-lg"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-3 bg-slate-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : profiles.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No students found</h3>
              <p className="text-slate-600 mb-6">Try searching with different keywords.</p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSearchQuery('');
                }}
                variant="outline"
                className="rounded-2xl"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedProfile(profile)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage
                        src={
                          profile.profile_picture_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=00CFFF&color=fff`
                        }
                      />
                      <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xl">
                        {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-900">{profile.full_name}</h3>
                      {profile.university_name && (
                        <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {profile.university_name}
                        </p>
                      )}
                      {profile.major && <p className="text-xs text-slate-500">{profile.major}</p>}
                    </div>
                    {profile.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {profile.interests.slice(0, 3).map((interest, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {profile.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Profile View Modal */}
        {selectedProfile && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center rounded-t-2xl z-10">
                <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProfile(null)}
                  className="rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage
                      src={
                        selectedProfile.profile_picture_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.full_name)}&background=00CFFF&color=fff`
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-4xl">
                      {selectedProfile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedProfile.full_name}
                    </h2>
                    {selectedProfile.university_name && (
                      <p className="text-slate-600 flex items-center justify-center gap-1 mt-1">
                        <GraduationCap className="w-4 h-4" />
                        {selectedProfile.university_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {selectedProfile.bio && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">About</h3>
                    <p className="text-slate-600 leading-relaxed">{selectedProfile.bio}</p>
                  </div>
                )}

                {/* Academic Info */}
                {(selectedProfile.major || selectedProfile.graduation_year) && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Academic Info</h3>
                    <div className="space-y-2">
                      {selectedProfile.major && (
                        <p className="text-slate-600">
                          <span className="font-medium">Major:</span> {selectedProfile.major}
                        </p>
                      )}
                      {selectedProfile.graduation_year && (
                        <p className="text-slate-600">
                          <span className="font-medium">Graduation Year:</span>{' '}
                          {selectedProfile.graduation_year}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => alert('Connection request feature coming soon!')}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  <Button
                    onClick={() =>
                      (window.location.href = `mailto:${selectedProfile.university_email}`)
                    }
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
