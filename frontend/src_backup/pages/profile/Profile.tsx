import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { profileService } from '@/services/profile.service';
import { ProfileResponse } from '@/types/profile.types';
import { Link } from 'react-router-dom';
import { Edit } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getCurrentUserProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mr-6">
                  {profile.full_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                  <p className="text-gray-600">{profile.university_email}</p>
                  <p className="text-gray-600">{profile.university_name}</p>
                  {profile.major && <p className="text-gray-600">{profile.major}</p>}
                  {profile.graduation_year && (
                    <p className="text-gray-600">Class of {profile.graduation_year}</p>
                  )}
                </div>
              </div>
              <Link to="/profile/edit">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>

            {profile.bio && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {profile.interests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

