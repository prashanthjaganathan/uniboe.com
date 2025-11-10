import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, GraduationCap, Instagram, Linkedin, UserPlus } from 'lucide-react';

export default function StudentCard({ student, currentUser }) {
  const isOwnProfile = student.created_by === currentUser?.email;

  return (
    <Card className="group border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={
                  student.profile_image ||
                  `https://ui-avatars.com/api/?name=${student.created_by}&background=FF6B6B&color=fff`
                }
              />
              <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                {student.created_by?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {student.created_by?.split('@')[0]}
              </h3>
              <p className="text-sm text-slate-600 truncate">{student.year}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="text-slate-700 truncate">{student.university}</span>
            </div>
            <div className="text-sm text-slate-600 truncate">{student.program}</div>
            {student.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-slate-700 truncate">{student.location}</span>
              </div>
            )}
          </div>

          {student.bio && (
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{student.bio}</p>
          )}

          {student.hobbies && student.hobbies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {student.hobbies.slice(0, 3).map((hobby, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {hobby}
                </Badge>
              ))}
              {student.hobbies.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{student.hobbies.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              {student.instagram_handle && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-pink-600 hover:bg-pink-50"
                >
                  <Instagram className="w-4 h-4" />
                </Button>
              )}
              {student.linkedin_profile && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-blue-600 hover:bg-blue-50"
                >
                  <Linkedin className="w-4 h-4" />
                </Button>
              )}
            </div>

            {!isOwnProfile && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl text-xs px-3 py-1"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Add to Circle
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
