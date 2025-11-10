export type PropertyType = 'apartment' | 'house' | 'sublet' | 'room';

export interface HousingListingCreate {
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  available_from?: string; // ISO date string
  available_until?: string; // ISO date string
  property_type: PropertyType;
  amenities?: string[];
  images?: string[];
  contact_email?: string;
  contact_phone?: string;
}

export interface HousingListingUpdate {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  available_from?: string;
  available_until?: string;
  property_type?: PropertyType;
  amenities?: string[];
  images?: string[];
  contact_email?: string;
  contact_phone?: string;
}

export interface HousingListingUser {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
  university_name: string | null;
}

export interface HousingListingResponse {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  available_from: string | null;
  available_until: string | null;
  property_type: string;
  amenities: string[];
  images: string[];
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  user: HousingListingUser;
  is_liked_by_current_user: boolean | null;
}

export interface HousingListResponse {
  listings: HousingListingResponse[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface HousingSearchFilters {
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: PropertyType;
  city?: string;
  state?: string;
  amenities?: string[];
  available_from?: string;
}