import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { feedService } from '@/services/feed.service';
import { PostResponse } from '@/types/feed.types';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const Feed = () => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const response = await feedService.getFeed(1, 20);
      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setCreatingPost(true);
    try {
      const newPost = await feedService.createPost({ content: newPostContent });
      setPosts([newPost, ...posts]);
      setNewPostContent('');
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create post'
        : 'Failed to create post';
      alert(errorMessage);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked_by_current_user) {
        await feedService.unlikePost(postId);
        setPosts(posts.map(p => p.id === postId ? { ...p, is_liked_by_current_user: false, like_count: p.like_count - 1 } : p));
      } else {
        await feedService.likePost(postId);
        setPosts(posts.map(p => p.id === postId ? { ...p, is_liked_by_current_user: true, like_count: p.like_count + 1 } : p));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Create Post */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Textarea
              placeholder="Share what's happening on campus..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="mb-4"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || creatingPost}
                variant="gradient"
              >
                <Send className="w-4 h-4 mr-2" />
                {creatingPost ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  {/* User Info */}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium mr-3">
                      {post.user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{post.user.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {post.user.university_name} • {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  {post.content && <p className="mb-4 whitespace-pre-wrap">{post.content}</p>}

                  {/* Media */}
                  {post.media_urls.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {post.media_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt=""
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${post.is_liked_by_current_user ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span className="text-sm">{post.like_count}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-primary transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comment_count}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;

