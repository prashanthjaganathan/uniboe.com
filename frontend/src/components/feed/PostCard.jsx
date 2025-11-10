import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const postTypeColors = {
  discussion: 'bg-cyan-100 text-cyan-700',
  tip: 'bg-emerald-100 text-emerald-700',
  event: 'bg-purple-100 text-purple-700',
  question: 'bg-orange-100 text-orange-700',
  announcement: 'bg-pink-100 text-pink-700',
};

export default function PostCard({ post, currentUser, onLike }) {
  const [showComments, setShowComments] = useState(false);
  const isLiked = post.likes?.includes(currentUser?.id);

  return (
    <Card className="border-0 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
      <CardHeader className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${post.created_by}&background=00CFFF&color=fff`}
              />
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white">
                {post.created_by?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900">{post.created_by?.split('@')[0]}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-3 h-3" />
                {format(new Date(post.created_date), 'MMM d, yyyy')}
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    {post.location}
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge className={postTypeColors[post.type] || 'bg-slate-100 text-slate-700'}>
            {post.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-4">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-1 gap-3 rounded-xl overflow-hidden">
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="Post image"
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300 rounded-xl"
              />
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={`gap-2 rounded-xl transition-all duration-200 ${
                isLiked
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {post.likes?.length || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              {post.comments?.length || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
