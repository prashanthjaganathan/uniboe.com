import React, { useState, useEffect } from "react";
import { base44 } from "@/api/backendAdapter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
import PostCard from "../components/feed/PostCard";
import CreatePostModal from "../components/feed/CreatePostModal";

export default function FeedPage() {
  const [user, setUser] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
    initialData: [],
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.Post.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowCreatePost(false);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Post.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleCreatePost = async (postData) => {
    createPostMutation.mutate(postData);
  };

  const handleLikePost = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      const isLiked = post.likes?.includes(user.id);
      const updatedLikes = isLiked 
        ? post.likes.filter(id => id !== user.id)
        : [...(post.likes || []), user.id];
      
      updatePostMutation.mutate({ id: postId, data: { likes: updatedLikes } });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-emerald-50/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Community Feed</h1>
            <p className="text-slate-600 mt-1">Connect with students worldwide</p>
          </div>
          <Button 
            onClick={() => setShowCreatePost(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse border-0 bg-white/90 backdrop-blur-sm shadow-lg">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={user}
                onLike={handleLikePost}
              />
            ))
          )}
        </div>

        {posts.length === 0 && !isLoading && (
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No posts yet</h3>
              <p className="text-slate-600 mb-6">Be the first to share something with the community!</p>
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
              >
                Create First Post
              </Button>
            </CardContent>
          </Card>
        )}

        <CreatePostModal 
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
          user={user}
        />
      </div>
    </div>
  );
}