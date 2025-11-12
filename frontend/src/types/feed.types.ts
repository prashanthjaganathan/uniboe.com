export interface PostCreate {
  content?: string;
  media_urls?: string[];
  media_types?: ('image' | 'video')[];
}

export interface PostUpdate {
  content?: string;
}

export interface PostUser {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  university_name: string | null;
}

export interface PostResponse {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: string[];
  media_types: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user: PostUser;
  is_liked_by_current_user: boolean | null;
}

export interface PostListResponse {
  posts: PostResponse[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface LikeResponse {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  user: PostUser;
}
