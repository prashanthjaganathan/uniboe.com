export interface ProfileUpdate {
  full_name?: string;
  bio?: string;
  interests?: string[];
  phone_number?: string;
  graduation_year?: number;
  major?: string;
  profile_picture_url?: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  full_name: string;
  university_id: string | null;
  university_name: string | null;
  university_email: string;
  bio: string | null;
  interests: string[];
  profile_picture_url: string | null;
  phone_number: string | null;
  graduation_year: number | null;
  major: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProfileResponse {
  id: string;
  full_name: string;
  university_id: string | null;
  university_name: string | null;
  university_email: string;
  bio: string | null;
  interests: string[];
  profile_picture_url: string | null;
  graduation_year: number | null;
  major: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileSearchRequest {
  query: string;
  university_id?: string;
  interests?: string[];
  graduation_year?: number;
  page?: number;
  page_size?: number;
}

export interface ProfileListResponse {
  profiles: PublicProfileResponse[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ProfileStatsResponse {
  posts_count: number;
  listings_count: number;
  connections_count: number;
  joined_date: string;
}
