/**
 * Base44-to-REST API Adapter
 * Bridges frontend1's Base44 client calls to the existing FastAPI backend
 * WITHOUT modifying backend code
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

class BackendAdapter {
  constructor() {
    this.token = localStorage.getItem("access_token");
    this.user = null;
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem("access_token");
    }
    return this.token;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  auth = {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem("token", this.token);
      return data;
    },

    register: async (email, password, full_name) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Registration failed");
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem("token", this.token);
      return data;
    },

    logout: () => {
      this.token = null;
      this.user = null;
      localStorage.removeItem("access_token");
    },

    me: async () => {
      const token = this.getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      this.user = await response.json();
      return this.user;
    },

    getToken: () => {
      return this.token || localStorage.getItem("access_token");
    },
  };

  // ============================================================================
  // ENTITIES
  // ============================================================================

  entities = {
    // POST ENTITY
    Post: {
      list: async (orderBy = "-created_at", limit = 50) => {
        const token = this.auth.getToken();
        const response = await fetch(`${API_BASE_URL}/posts?limit=${limit}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error("Failed to fetch posts");

        const posts = await response.json();

        // Transform backend format to frontend1 format
        return posts.map((post) => ({
          id: post.id,
          content: post.content,
          author_id: post.user_id,
          author_name: post.user?.full_name || "Unknown",
          author_avatar: post.user?.profile?.profile_image || null,
          author_university: post.user?.profile?.university || null,
          images: post.media_urls || [],
          likes: post.likes || [],
          like_count: post.like_count || 0,
          comments: [], // Backend doesn't support comments yet
          comment_count: 0,
          created_date: post.created_at,
          type: "general", // Backend doesn't have post types yet
          location: post.user?.profile?.location || null,
          university: post.user?.profile?.university || null,
          tags: [], // Backend doesn't support tags yet
        }));
      },

      get: async (id) => {
        const token = this.auth.getToken();
        const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error("Failed to fetch post");

        const post = await response.json();
        return {
          id: post.id,
          content: post.content,
          author_id: post.user_id,
          author_name: post.user?.full_name || "Unknown",
          author_avatar: post.user?.profile?.profile_image || null,
          author_university: post.user?.profile?.university || null,
          images: post.media_urls || [],
          likes: post.likes || [],
          like_count: post.like_count || 0,
          comments: [],
          comment_count: 0,
          created_date: post.created_at,
          type: "general",
          location: post.user?.profile?.location || null,
          university: post.user?.profile?.university || null,
          tags: [],
        };
      },

      create: async (postData) => {
        const token = this.auth.getToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${API_BASE_URL}/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: postData.content,
            media_urls: postData.images || [],
          }),
        });

        if (!response.ok) throw new Error("Failed to create post");
        return await response.json();
      },

      update: async (id, data) => {
        const token = this.auth.getToken();
        if (!token) throw new Error("Authentication required");

        // Handle likes update specially
        if (data.likes !== undefined) {
          const response = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Failed to update post");
          return await response.json();
        }

        // Regular update
        const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: data.content,
            media_urls: data.images || data.media_urls,
          }),
        });

        if (!response.ok) throw new Error("Failed to update post");
        return await response.json();
      },

      delete: async (id) => {
        const token = this.auth.getToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to delete post");
        return { success: true };
      },
    },

    // STUDENT ENTITY (Profile)
    Student: {
      list: async (filters = {}) => {
        const token = this.auth.getToken();
        const params = new URLSearchParams();

        if (filters.university) params.append("university", filters.university);
        if (filters.location) params.append("location", filters.location);

        const response = await fetch(`${API_BASE_URL}/profiles/search?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) throw new Error("Failed to fetch students");

        const profiles = await response.json();

        // Transform backend format to frontend1 format
        return profiles.map((profile) => ({
          id: profile.user_id,
          name: profile.user?.full_name || "Unknown",
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

        if (!response.ok) throw new Error("Failed to fetch student profile");

        const profile = await response.json();
        return {
          id: profile.user_id,
          name: profile.user?.full_name || "Unknown",
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
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${API_BASE_URL}/profiles/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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

        if (!response.ok) throw new Error("Failed to update profile");
        return await response.json();
      },
    },

    // HOUSING ENTITY
    Housing: {
      list: async (filters = {}) => {
        const params = new URLSearchParams();

        if (filters.city) params.append("city", filters.city);
        if (filters.country) params.append("country", filters.country);
        if (filters.min_price) params.append("min_price", filters.min_price);
        if (filters.max_price) params.append("max_price", filters.max_price);
        if (filters.property_type) params.append("property_type", filters.property_type);

        const response = await fetch(`${API_BASE_URL}/housing/search?${params}`);

        if (!response.ok) throw new Error("Failed to fetch housing listings");

        const listings = await response.json();

        // Transform backend format to frontend1 format
        return listings.map((listing) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: "USD", // Backend doesn't have currency field yet
          location: listing.location,
          city: listing.city,
          country: listing.country,
          latitude: null, // Backend doesn't have coordinates yet
          longitude: null,
          property_type: listing.property_type,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          furnished: false, // Backend doesn't have this field yet
          utilities_included: false, // Backend doesn't have this field yet
          images: listing.images || [],
          amenities: listing.amenities || [],
          nearby_universities: [], // Backend doesn't have this field yet
          distance_to_campus: listing.distance_to_campus,
          available_from: listing.available_from,
          lease_length: listing.lease_duration, // Backend uses 'lease_duration'
          is_sublease: listing.is_sublease,
          looking_for_roommate: listing.looking_for_roommate,
          verified: false, // Backend doesn't have verification yet
          contact_info: listing.contact_info,
          created_at: listing.created_at,
          landlord_id: listing.landlord_id,
        }));
      },

      get: async (id) => {
        const response = await fetch(`${API_BASE_URL}/housing/${id}`);

        if (!response.ok) throw new Error("Failed to fetch housing listing");

        const listing = await response.json();
        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: "USD",
          location: listing.location,
          city: listing.city,
          country: listing.country,
          latitude: null,
          longitude: null,
          property_type: listing.property_type,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          furnished: false,
          utilities_included: false,
          images: listing.images || [],
          amenities: listing.amenities || [],
          nearby_universities: [],
          distance_to_campus: listing.distance_to_campus,
          available_from: listing.available_from,
          lease_length: listing.lease_duration,
          is_sublease: listing.is_sublease,
          looking_for_roommate: listing.looking_for_roommate,
          verified: false,
          contact_info: listing.contact_info,
          created_at: listing.created_at,
          landlord_id: listing.landlord_id,
        };
      },

      create: async (housingData) => {
        const token = this.auth.getToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${API_BASE_URL}/housing`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: housingData.title,
            description: housingData.description,
            price: housingData.price,
            location: housingData.location,
            city: housingData.city,
            country: housingData.country,
            property_type: housingData.property_type,
            bedrooms: housingData.bedrooms,
            bathrooms: housingData.bathrooms,
            images: housingData.images,
            amenities: housingData.amenities,
            distance_to_campus: housingData.distance_to_campus,
            available_from: housingData.available_from,
            lease_duration: housingData.lease_length, // Transform lease_length → lease_duration
            is_sublease: housingData.is_sublease,
            looking_for_roommate: housingData.looking_for_roommate,
            contact_info: housingData.contact_info,
          }),
        });

        if (!response.ok) throw new Error("Failed to create housing listing");
        return await response.json();
      },

      update: async (id, data) => {
        const token = this.auth.getToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${API_BASE_URL}/housing/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            price: data.price,
            location: data.location,
            city: data.city,
            country: data.country,
            property_type: data.property_type,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            images: data.images,
            amenities: data.amenities,
            distance_to_campus: data.distance_to_campus,
            available_from: data.available_from,
            lease_duration: data.lease_length,
            is_sublease: data.is_sublease,
            looking_for_roommate: data.looking_for_roommate,
            contact_info: data.contact_info,
          }),
        });

        if (!response.ok) throw new Error("Failed to update housing listing");
        return await response.json();
      },

      delete: async (id) => {
        const token = this.auth.getToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${API_BASE_URL}/housing/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to delete housing listing");
        return { success: true };
      },
    },

    // NEWS ARTICLE ENTITY (NOT SUPPORTED BY BACKEND)
    // Returning empty data since backend doesn't have News API yet
    NewsArticle: {
      list: async () => {
        console.warn("News API not supported by backend yet");
        return [];
      },
      get: async (id) => {
        console.warn("News API not supported by backend yet");
        return null;
      },
      create: async (data) => {
        throw new Error("News API not supported by backend yet");
      },
    },
  };
}

// Export singleton instance
export const base44 = new BackendAdapter();
