/**
 * Base44-to-REST API Adapter
 * Bridges frontend1's Base44 client calls to the existing FastAPI backend
 * WITHOUT modifying backend code
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class BackendAdapter {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.user = null;
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  auth = {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem('token', this.token);
      return data;
    },

    register: async (email, password, full_name) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem('token', this.token);
      return data;
    },

    logout: () => {
      this.token = null;
      this.user = null;
      localStorage.removeItem('access_token');
    },

    me: async () => {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      this.user = await response.json();
      return this.user;
    },

    getToken: () => {
      return this.token || localStorage.getItem('access_token');
    },
  };

  // ============================================================================
  // ENTITIES
  // ============================================================================

  entities = {
    // POST ENTITY
    Post: {
      list: async (orderBy = '-created_at', limit = 50) => {
        const token = this.auth.getToken();
        const response = await fetch(`${API_BASE_URL}/feed?page=1&page_size=${limit}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const data = await response.json();
        const posts = data.posts || []; // Backend returns { posts, total, page, ... }

        // Transform backend format to frontend format
        return posts.map((post) => ({
          id: post.id,
          content: post.content,
          author_id: post.user_id,
          author_name: post.user?.full_name || 'Unknown',
          author_avatar: post.user?.profile_picture_url || null,
          author_university: post.user?.university_name || null,
          images: post.media_urls || [],
          likes: [], // Backend doesn't return array of user IDs
          like_count: post.like_count || 0,
          is_liked_by_current_user: post.is_liked_by_current_user || false,
          comments: [],
          comment_count: post.comment_count || 0,
          created_date: post.created_at,
          type: 'general',
          location: null,
          university: post.user?.university_name || null,
          tags: [],
        }));
      },

      get: async (id) => {
        const token = this.auth.getToken();
        const response = await fetch(`${API_BASE_URL}/feed/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch post');

        const post = await response.json();
        return {
          id: post.id,
          content: post.content,
          author_id: post.user_id,
          author_name: post.user?.full_name || 'Unknown',
          author_avatar: post.user?.profile_picture_url || null,
          author_university: post.user?.university_name || null,
          images: post.media_urls || [],
          likes: [],
          like_count: post.like_count || 0,
          is_liked_by_current_user: post.is_liked_by_current_user || false,
          comments: [],
          comment_count: post.comment_count || 0,
          created_date: post.created_at,
          type: 'general',
          location: null,
          university: post.user?.university_name || null,
          tags: [],
        };
      },

      create: async (postData) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_BASE_URL}/feed/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: postData.content,
            media_urls: postData.images || [],
            media_types: postData.media_types || [],
          }),
        });

        if (!response.ok) throw new Error('Failed to create post');
        return await response.json();
      },

      update: async (id, data) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        // Handle likes update specially
        if (data.likes !== undefined) {
          const response = await fetch(`${API_BASE_URL}/feed/posts/${id}/like`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to update post');
          return await response.json();
        }

        // Regular update
        // ✅ FIXED: Changed from /posts/{id} to /feed/posts/{id}
        const response = await fetch(`${API_BASE_URL}/feed/posts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: data.content,
            media_urls: data.images || data.media_urls,
          }),
        });

        if (!response.ok) throw new Error('Failed to update post');
        return await response.json();
      },

      delete: async (id) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_BASE_URL}/feed/posts/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to delete post');
        return { success: true };
      },
    },

    // STUDENT ENTITY (Profile)
    Student: {
      list: async (filters = {}) => {
        const token = this.auth.getToken();
        const params = new URLSearchParams();

        if (filters.university) params.append('university', filters.university);
        if (filters.location) params.append('location', filters.location);

        const response = await fetch(`${API_BASE_URL}/profiles/search?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch students');

        const profiles = await response.json();

        // Transform backend format to frontend1 format
        return profiles.map((profile) => ({
          id: profile.user_id,
          name: profile.user?.full_name || 'Unknown',
          email: profile.user?.email,
          university: profile.university,
          program: profile.major, // Backend uses 'major' instead of 'program'
          year: profile.year,
          location: profile.location,
          bio: profile.bio,
          hobbies: profile.interests || [], // Backend uses 'interests' instead of 'hobbies'
          instagram_handle: profile.instagram_handle,
          linkedin_profile: profile.linkedin_url, // Backend uses 'linkedin_url'
          profile_image: profile.profile_image,
          circles: [], // Backend doesn't have circles yet
          home_country: profile.home_country,
        }));
      },

      get: async (userId) => {
        const token = this.auth.getToken();
        const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch student profile');

        const profile = await response.json();
        return {
          id: profile.user_id,
          name: profile.user?.full_name || 'Unknown',
          email: profile.user?.email,
          university: profile.university,
          program: profile.major,
          year: profile.year,
          location: profile.location,
          bio: profile.bio,
          hobbies: profile.interests || [],
          instagram_handle: profile.instagram_handle,
          linkedin_profile: profile.linkedin_url,
          profile_image: profile.profile_image,
          circles: [],
          home_country: profile.home_country,
        };
      },

      update: async (userId, data) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            university: data.university,
            major: data.program, // Transform program → major
            year: data.year,
            location: data.location,
            bio: data.bio,
            interests: data.hobbies, // Transform hobbies → interests
            instagram_handle: data.instagram_handle,
            linkedin_url: data.linkedin_profile, // Transform linkedin_profile → linkedin_url
            profile_image: data.profile_image,
            home_country: data.home_country,
          }),
        });

        if (!response.ok) throw new Error('Failed to update profile');
        return await response.json();
      },
    },

    // HOUSING ENTITY
    Housing: {
      list: async (filters = {}) => {
        const token = this.auth.getToken();
        const params = new URLSearchParams();

        // Add filters
        if (filters.city) params.append('city', filters.city);
        if (filters.state) params.append('state', filters.state);
        if (filters.min_price) params.append('min_price', filters.min_price);
        if (filters.max_price) params.append('max_price', filters.max_price);
        if (filters.property_type) params.append('property_type', filters.property_type);
        if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
        if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);

        const response = await fetch(`${API_BASE_URL}/housing/listings?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch housing listings');

        const data = await response.json();
        return data.listings || [];
      },

      get: async (id) => {
        const token = this.auth.getToken();
        const response = await fetch(`${API_BASE_URL}/housing/listings/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch housing listing');
        return await response.json();
      },

      create: async (housingData) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_BASE_URL}/housing/listings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(housingData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to create housing listing');
        }
        return await response.json();
      },

      update: async (id, data) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_BASE_URL}/housing/listings/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update housing listing');
        return await response.json();
      },

      delete: async (id) => {
        const token = this.auth.getToken();
        if (!token) throw new Error('Authentication required');

        const response = await fetch(`${API_BASE_URL}/housing/listings/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to delete housing listing');
        return { success: true };
      },
    },

    // NEWS ARTICLE ENTITY (NOT SUPPORTED BY BACKEND)
    // Returning empty data since backend doesn't have News API yet
    NewsArticle: {
      list: async () => {
        console.warn('News API not supported by backend yet');
        return [];
      },
      get: async (id) => {
        console.warn('News API not supported by backend yet');
        return null;
      },
      create: async (data) => {
        throw new Error('News API not supported by backend yet');
      },
    },
  };
}

// Export singleton instance
export const base44 = new BackendAdapter();
