import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { feedService } from '@/services/feed.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Edit,
  Save,
  X,
  Plus,
  MapPin,
  GraduationCap,
  Mail,
  Phone,
  Camera,
  User,
  Calendar,
  BookOpen,
  Grid3x3,
  Heart,
  MessageCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentInterest, setCurrentInterest] = useState('');
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const queryClient = useQueryClient();

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getCurrentUserProfile(),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: () => profileService.getProfileStats(),
  });

  // Fetch user posts
  const { data: postsData } = useQuery({
    queryKey: ['profile', 'posts', profile?.id],
    queryFn: () => feedService.getUserPosts(profile?.id),
    enabled: !!profile?.id,
  });

  const userPosts = postsData?.posts || [];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setFormData({});
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      console.error('Error response:', error?.response?.data);
    },
  });

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: (file) => profileService.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
  });

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      interests: profile?.interests || [],
      phone_number: profile?.phone_number || '',
      graduation_year: profile?.graduation_year || null,
      major: profile?.major || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Only include fields that have changed and convert empty strings to null
    const updates = {};

    if (formData.full_name !== profile?.full_name && formData.full_name?.trim()) {
      updates.full_name = formData.full_name.trim();
    }

    if (formData.bio !== profile?.bio) {
      updates.bio = formData.bio?.trim() || null;
    }

    if (JSON.stringify(formData.interests) !== JSON.stringify(profile?.interests)) {
      updates.interests = formData.interests || [];
    }

    if (formData.phone_number !== profile?.phone_number) {
      updates.phone_number = formData.phone_number?.trim() || null;
    }

    if (formData.graduation_year !== profile?.graduation_year) {
      updates.graduation_year = formData.graduation_year || null;
    }

    if (formData.major !== profile?.major) {
      updates.major = formData.major?.trim() || null;
    }

    console.log('Sending updates:', updates);

    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      setIsEditing(false);
    }
  };

  const addInterest = () => {
    if (currentInterest.trim() && !formData.interests?.includes(currentInterest.trim())) {
      setFormData((prev) => ({
        ...prev,
        interests: [...(prev.interests || []), currentInterest.trim()],
      }));
      setCurrentInterest('');
    }
  };

  const removeInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((interest) => interest !== interestToRemove),
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPicture = () => {
    if (selectedFile) {
      uploadPictureMutation.mutate(selectedFile);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card
                key={i}
                className="animate-pulse border-0 bg-white/80 backdrop-blur-sm shadow-lg"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600 mt-1">Manage your profile and preferences</p>
          </div>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-2xl"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 lg:w-32 lg:h-32">
                  <AvatarImage src={previewUrl || profile?.profile_picture_url} />
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-2xl lg:text-3xl">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-picture-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-3">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                    {profile?.full_name}
                  </h2>
                  <p className="text-slate-600 flex items-center justify-center lg:justify-start gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center justify-center lg:justify-start gap-2 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    {profile?.university_email}
                  </p>
                </div>

                {profile?.university_name && (
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-700">
                    <GraduationCap className="w-5 h-5 text-rose-500" />
                    <span>{profile.university_name}</span>
                  </div>
                )}

                {selectedFile && (
                  <Button
                    onClick={handleUploadPicture}
                    disabled={uploadPictureMutation.isPending}
                    size="sm"
                    className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl"
                  >
                    {uploadPictureMutation.isPending ? 'Uploading...' : 'Upload Picture'}
                  </Button>
                )}
              </div>

              {stats && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-rose-600">{stats.posts_count}</div>
                    <div className="text-xs text-slate-600">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.listings_count}</div>
                    <div className="text-xs text-slate-600">Listings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.connections_count}
                    </div>
                    <div className="text-xs text-slate-600">Connections</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-rose-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Your full name"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="rounded-xl resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {(formData.bio || '').length}/500 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone_number"
                      value={formData.phone_number || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
                      }
                      placeholder="+1 (555) 000-0000"
                      className="rounded-xl pl-10"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Bio</p>
                  <p className="text-slate-900 mt-1 leading-relaxed">
                    {profile?.bio || 'No bio added yet.'}
                  </p>
                </div>
                {profile?.phone_number && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Phone Number</p>
                    <p className="text-slate-900 mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {profile.phone_number}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-rose-500" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="major">Major / Field of Study</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="major"
                      value={formData.major || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                      placeholder="e.g., Computer Science"
                      className="rounded-xl pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="graduation_year"
                      type="number"
                      value={formData.graduation_year || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          graduation_year: parseInt(e.target.value) || null,
                        }))
                      }
                      placeholder="2025"
                      className="rounded-xl pl-10"
                      min="2020"
                      max="2035"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">Major</p>
                  <p className="text-slate-900 mt-1">{profile?.major || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Graduation Year</p>
                  <p className="text-slate-900 mt-1">
                    {profile?.graduation_year || 'Not specified'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Interests & Hobbies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div>
                <Label>Add Interests</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentInterest}
                    onChange={(e) => setCurrentInterest(e.target.value)}
                    placeholder="Add an interest"
                    className="rounded-xl"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  />
                  <Button
                    type="button"
                    onClick={addInterest}
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {(formData.interests || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="gap-1">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {profile?.interests && profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-sm">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No interests added yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({});
                  }}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl"
                >
                  {updateProfileMutation.isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Grid */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-rose-500" />
              My Posts
              <Badge variant="outline" className="ml-2">
                {userPosts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden group cursor-pointer"
                  >
                    {post.media_urls && post.media_urls.length > 0 ? (
                      <img
                        src={post.media_urls[0]}
                        alt="Post"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100 p-4">
                        <p className="text-xs text-slate-600 line-clamp-3 text-center">
                          {post.content}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-current" />
                          <span className="text-sm font-semibold">{post.like_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 fill-current" />
                          <span className="text-sm font-semibold">{post.comment_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid3x3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts yet</h3>
                <p className="text-slate-600">Share your first post with the community!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-slate-900">Post Details</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPost(null)}
                className="rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={
                      selectedPost.user?.profile_picture_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPost.user?.full_name || 'User')}&background=00CFFF&color=fff`
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                    {selectedPost.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedPost.user?.full_name || 'Unknown User'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {selectedPost.user?.university_name && (
                      <>
                        <span>•</span>
                        {selectedPost.user.university_name}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              {selectedPost.content && (
                <div className="mb-6">
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </div>
              )}

              {/* Post Images */}
              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <div className="space-y-4 mb-6">
                  {selectedPost.media_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post media ${index + 1}`}
                      className="w-full object-contain max-h-[600px] bg-slate-50 rounded-xl"
                    />
                  ))}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                  <span className="font-semibold">{selectedPost.like_count || 0}</span>
                  <span className="text-sm">likes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MessageCircle className="w-5 h-5 text-cyan-500 fill-current" />
                  <span className="font-semibold">{selectedPost.comment_count || 0}</span>
                  <span className="text-sm">comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
