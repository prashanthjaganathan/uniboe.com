import React, { useState, useEffect } from "react";
import { base44 } from "@/api/backendAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Save, X, Plus, MapPin, GraduationCap, Instagram, Linkedin, Mail } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [currentHobby, setCurrentHobby] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Try to get existing student profile
      const existingProfile = await base44.entities.Student.get(currentUser.id);

      if (existingProfile) {
        setStudentProfile(existingProfile);
        setFormData(existingProfile);
      } else {
        // Initialize empty form for new profile
        setFormData({
          university: "",
          program: "",
          year: "",
          location: "",
          bio: "",
          hobbies: [],
          instagram_handle: "",
          linkedin_profile: "",
          home_country: ""
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Initialize empty form if profile doesn't exist
      setFormData({
        university: "",
        program: "",
        year: "",
        location: "",
        bio: "",
        hobbies: [],
        instagram_handle: "",
        linkedin_profile: "",
        home_country: ""
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (studentProfile) {
        await base44.entities.Student.update(user.id, formData);
      } else {
        // Backend creates profile automatically, just update it
        await base44.entities.Student.update(user.id, formData);
      }
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setIsSaving(false);
  };

  const addHobby = () => {
    if (currentHobby.trim() && !formData.hobbies?.includes(currentHobby.trim())) {
      setFormData(prev => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), currentHobby.trim()]
      }));
      setCurrentHobby("");
    }
  };

  const removeHobby = (hobbyToRemove) => {
    setFormData(prev => ({
      ...prev,
      hobbies: (prev.hobbies || []).filter(hobby => hobby !== hobbyToRemove)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse border-0 bg-white/80 backdrop-blur-sm shadow-lg">
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
            <p className="text-slate-600 mt-1">Manage your student profile and preferences</p>
          </div>
          <Button
            onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "rounded-2xl" : "bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-2xl"}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              <Avatar className="w-24 h-24 lg:w-32 lg:h-32">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.full_name || user?.email}&background=FF6B6B&color=fff&size=200`} />
                <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-2xl lg:text-3xl">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center lg:text-left space-y-3">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                    {user?.full_name || user?.email?.split('@')[0]}
                  </h2>
                  <p className="text-slate-600 flex items-center justify-center lg:justify-start gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                </div>
                
                {studentProfile && (
                  <div className="space-y-2">
                    {studentProfile.university && (
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-700">
                        <GraduationCap className="w-5 h-5 text-rose-500" />
                        <span>{studentProfile.university}</span>
                        {studentProfile.year && (
                          <Badge variant="outline" className="ml-2">
                            {studentProfile.year}
                          </Badge>
                        )}
                      </div>
                    )}
                    {studentProfile.location && (
                      <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-700">
                        <MapPin className="w-5 h-5 text-orange-500" />
                        <span>{studentProfile.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={formData.university || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                    placeholder="e.g., Columbia University"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="program">Program/Major</Label>
                  <Input
                    id="program"
                    value={formData.program || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    placeholder="e.g., Computer Science"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Academic Year</Label>
                  <Select
                    value={formData.year || ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Current Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., New York, USA"
                    className="rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="home_country">Home Country</Label>
                  <Input
                    id="home_country"
                    value={formData.home_country || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, home_country: e.target.value }))}
                    placeholder="e.g., India"
                    className="rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">University</p>
                  <p className="text-slate-900 mt-1">{studentProfile?.university || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Program</p>
                  <p className="text-slate-900 mt-1">{studentProfile?.program || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Year</p>
                  <p className="text-slate-900 mt-1">{studentProfile?.year || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Location</p>
                  <p className="text-slate-900 mt-1">{studentProfile?.location || "Not specified"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-slate-500">Home Country</p>
                  <p className="text-slate-900 mt-1">{studentProfile?.home_country || "Not specified"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Hobbies & Interests</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentHobby}
                      onChange={(e) => setCurrentHobby(e.target.value)}
                      placeholder="Add a hobby"
                      className="rounded-xl"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
                    />
                    <Button
                      type="button"
                      onClick={addHobby}
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {(formData.hobbies || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="outline" className="gap-1">
                          {hobby}
                          <button
                            type="button"
                            onClick={() => removeHobby(hobby)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram_handle || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
                      placeholder="@username"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin_profile || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedin_profile: e.target.value }))}
                      placeholder="LinkedIn profile URL"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">Bio</p>
                  <p className="text-slate-900 mt-1 leading-relaxed">
                    {studentProfile?.bio || "No bio added yet."}
                  </p>
                </div>
                
                {studentProfile?.hobbies && studentProfile.hobbies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-2">Hobbies & Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="outline">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {studentProfile?.instagram_handle && (
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      @{studentProfile.instagram_handle}
                    </Button>
                  )}
                  {studentProfile?.linkedin_profile && (
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      LinkedIn
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {isEditing && (
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}