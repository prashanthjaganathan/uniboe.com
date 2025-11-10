# Uniboe Database Schema

Complete database schema documentation based on Pydantic models.

## Table of Contents
1. [Users & Authentication](#users--authentication)
2. [Profiles](#profiles)
3. [Feed (Posts & Likes)](#feed-posts--likes)
4. [Housing Listings](#housing-listings)
5. [Chat & Messaging](#chat--messaging)
6. [Olive AI Assistant](#olive-ai-assistant)
7. [Universities](#universities)

---

## Users & Authentication

### Table: `users` (managed by Supabase Auth)
Core user authentication and account information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | User unique identifier (PK) |
| `email` | String | Yes | User's primary email address |
| `full_name` | String | Yes | User's full name (min 2 words) |
| `university_id` | UUID | No | Associated university ID (FK) |
| `university_email` | String | Yes | Verified university email |
| `profile_picture_url` | String | No | URL to profile picture |
| `is_verified` | Boolean | Yes | Email verification status (default: false) |
| `created_at` | Timestamp | Yes | Account creation timestamp |
| `updated_at` | Timestamp | Yes | Last update timestamp |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Validation:**
- Full name must include at least first and last name
- University email domain must match university_domain
- Email verification required

---

## Profiles

### Table: `profiles`
Extended user profile information beyond basic auth.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Profile ID (same as user_id, PK) |
| `user_id` | UUID | Yes | User ID (FK to users) |
| `bio` | String | No | User biography (max 500 chars) |
| `interests` | String[] | No | List of interests (max 20, each max 50 chars) |
| `phone_number` | String | No | Phone number (7-15 digits) |
| `graduation_year` | Integer | No | Expected graduation year (current_year ± 10) |
| `major` | String | No | Major/field of study (max 100 chars) |
| `university_name` | String | No | University name (denormalized) |
| `created_at` | Timestamp | Yes | Profile creation timestamp |
| `updated_at` | Timestamp | Yes | Last update timestamp |

**Validation:**
- Phone: 7-15 digits, various formats accepted
- Graduation year: within 10 years of current year
- Max 20 interests, each 50 chars max

**Profile Statistics:**
- `posts_count` - Number of posts created
- `listings_count` - Number of housing listings
- `connections_count` - Number of conversations

---

## Feed (Posts & Likes)

### Table: `posts`
Social feed posts with media support.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Post unique identifier (PK) |
| `user_id` | UUID | Yes | Author's user ID (FK to users) |
| `content` | String | No | Post text content (max 5000 chars) |
| `media_urls` | String[] | No | List of media URLs (images/videos) |
| `media_types` | String[] | No | List of media types ('image' or 'video') |
| `like_count` | Integer | Yes | Number of likes (default: 0) |
| `comment_count` | Integer | Yes | Number of comments (default: 0) |
| `created_at` | Timestamp | Yes | Post creation timestamp |
| `updated_at` | Timestamp | Yes | Post last update timestamp |

**Validation:**
- At least one of `content` or `media_urls` must be provided
- `media_urls` length must match `media_types` length
- Media types must be either 'image' or 'video'

### Table: `post_likes`
Like relationships for posts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Like unique identifier (PK) |
| `post_id` | UUID | Yes | Post ID that was liked (FK to posts) |
| `user_id` | UUID | Yes | User ID who liked (FK to users) |
| `created_at` | Timestamp | Yes | Like creation timestamp |

**Constraints:**
- Unique constraint on (post_id, user_id) - user can only like a post once

---

## Housing Listings

### Table: `housing_listings`
Student housing marketplace listings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Listing unique identifier (PK) |
| `user_id` | UUID | Yes | Owner's user ID (FK to users) |
| `title` | String | Yes | Listing title (5-200 chars) |
| `description` | String | No | Detailed description (max 2000 chars) |
| `address` | String | Yes | Street address |
| `city` | String | Yes | City |
| `state` | String | Yes | State |
| `zip_code` | String | No | ZIP code (format: 12345 or 12345-6789) |
| `price` | Float | Yes | Monthly rent price (> 0) |
| `bedrooms` | Integer | No | Number of bedrooms (>= 0) |
| `bathrooms` | Float | No | Number of bathrooms (>= 0) |
| `square_feet` | Integer | No | Square footage (> 0) |
| `available_from` | Date | No | Availability start date |
| `available_until` | Date | No | Availability end date |
| `property_type` | String | Yes | Type: 'apartment', 'sublet', 'room', 'house' |
| `amenities` | String[] | No | List of amenities |
| `images` | String[] | No | List of image URLs |
| `contact_email` | String | No | Contact email address |
| `contact_phone` | String | No | Contact phone (7-15 digits) |
| `is_active` | Boolean | Yes | Active status (default: true) |
| `view_count` | Integer | Yes | Number of views (default: 0) |
| `like_count` | Integer | Yes | Number of likes (default: 0) |
| `created_at` | Timestamp | Yes | Creation timestamp |
| `updated_at` | Timestamp | Yes | Last update timestamp |

**Validation:**
- At least one contact method (email or phone) required
- available_until must be after available_from
- Property type must be one of: apartment, sublet, room, house

### Table: `housing_likes`
Like relationships for housing listings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Like unique identifier (PK) |
| `listing_id` | UUID | Yes | Listing ID (FK to housing_listings) |
| `user_id` | UUID | Yes | User ID who liked (FK to users) |
| `created_at` | Timestamp | Yes | Like creation timestamp |

**Constraints:**
- Unique constraint on (listing_id, user_id)

---

## Chat & Messaging

### Table: `conversations`
Direct messaging conversations between users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Conversation unique identifier (PK) |
| `participant_1_id` | UUID | Yes | First participant's user ID (FK to users) |
| `participant_2_id` | UUID | Yes | Second participant's user ID (FK to users) |
| `last_message_at` | Timestamp | Yes | Timestamp of last message |
| `created_at` | Timestamp | Yes | Conversation creation timestamp |

**Constraints:**
- Unique constraint on (participant_1_id, participant_2_id)

### Table: `messages`
Individual messages within conversations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Message unique identifier (PK) |
| `conversation_id` | UUID | Yes | Conversation ID (FK to conversations) |
| `sender_id` | UUID | Yes | Sender's user ID (FK to users) |
| `content_encrypted` | String | Yes | Encrypted message content (stored) |
| `encryption_key` | String | Yes | Base64 encoded encryption key |
| `is_read` | Boolean | Yes | Read status (default: false) |
| `created_at` | Timestamp | Yes | Message creation timestamp |

**Security:**
- Messages are encrypted at rest
- Content is decrypted for display only
- Max content length: 5000 characters

### Encryption Keys
Messages use symmetric encryption with per-message keys stored alongside encrypted content.

---

## Olive AI Assistant

### Table: `olive_conversations`
AI assistant conversation threads.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Conversation unique identifier (PK) |
| `user_id` | UUID | Yes | User ID who owns conversation (FK to users) |
| `title` | String | No | Conversation title (max 200 chars, auto-generated) |
| `created_at` | Timestamp | Yes | Conversation creation timestamp |
| `last_message_at` | Timestamp | No | Timestamp of last message |

### Table: `olive_messages`
Messages in Olive AI conversations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Message unique identifier (PK) |
| `conversation_id` | UUID | Yes | Conversation ID (FK to olive_conversations) |
| `role` | String | Yes | Message role: 'user' or 'assistant' |
| `content` | String | Yes | Message content (max 10000 chars) |
| `created_at` | Timestamp | Yes | Message creation timestamp |

**AI Features:**
- Powered by Groq API
- Supports custom system prompts
- Multi-turn conversations
- Topics: research, tax, legal, general student questions

---

## Universities

### Table: `universities`
University information for email verification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | University unique identifier (PK) |
| `name` | String | Yes | University name |
| `domain` | String | Yes | Email domain (e.g., 'nyu.edu') |
| `country` | String | Yes | Country code |
| `state_province` | String | No | State or province |
| `web_pages` | String[] | No | List of official web pages |
| `created_at` | Timestamp | Yes | Record creation timestamp |

**Integration:**
- Uses HipoLabs Universities API for verification
- Email domain validation during registration

---

## Indexes & Performance

### Recommended Indexes

**Users:**
- `idx_users_email` on `email`
- `idx_users_university_id` on `university_id`
- `idx_users_created_at` on `created_at`

**Profiles:**
- `idx_profiles_graduation_year` on `graduation_year`
- `idx_profiles_interests` on `interests` (GIN index for array)

**Posts:**
- `idx_posts_user_id` on `user_id`
- `idx_posts_created_at` on `created_at DESC`
- `idx_post_likes_post_id` on `post_id`
- `idx_post_likes_user_post` on `(user_id, post_id)` UNIQUE

**Housing:**
- `idx_housing_city_state` on `(city, state)`
- `idx_housing_price` on `price`
- `idx_housing_created_at` on `created_at DESC`
- `idx_housing_property_type` on `property_type`
- `idx_housing_likes_listing_user` on `(listing_id, user_id)` UNIQUE

**Chat:**
- `idx_conversations_participants` on `(participant_1_id, participant_2_id)` UNIQUE
- `idx_messages_conversation` on `conversation_id`
- `idx_messages_sender` on `sender_id`
- `idx_messages_created_at` on `created_at DESC`

**Olive:**
- `idx_olive_conversations_user` on `user_id`
- `idx_olive_messages_conversation` on `conversation_id`

---

## Row Level Security (RLS)

Supabase RLS policies should be implemented for:

1. **Users can only read/update their own profile**
2. **Posts are publicly readable, but only owner can edit/delete**
3. **Housing listings are publicly readable, only owner can edit/delete**
4. **Conversations are only accessible to participants**
5. **Messages are only accessible to conversation participants**
6. **Olive conversations are only accessible to the owner**

---

## Data Relationships

```
users (1) -----> (many) profiles
users (1) -----> (many) posts
users (1) -----> (many) housing_listings
users (1) -----> (many) olive_conversations
users (many) <-----> (many) conversations
users (many) <-----> (many) messages
posts (1) -----> (many) post_likes
housing_listings (1) -----> (many) housing_likes
universities (1) -----> (many) users
conversations (1) -----> (many) messages
olive_conversations (1) -----> (many) olive_messages
```

---

## Storage Buckets

### Supabase Storage:
- **profile-pictures** - User avatars
- **post-media** - Post images and videos
- **housing-images** - Housing listing photos

**File Upload Limits:**
- Profile pictures: 5MB
- Post media: 10MB per file
- Housing images: 10MB per file

---

## API Endpoint Reference

All endpoints are prefixed with `/api`

### Authentication: `/api/auth`
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - Get current user
- `POST /verify-email/{token}` - Verify email
- `POST /change-password` - Change password

### Profiles: `/api/profile`
- `GET /` - Get own profile
- `PUT /` - Update profile
- `GET /{user_id}` - Get public profile
- `POST /search` - Search profiles
- `POST /picture` - Upload profile picture
- `GET /stats` - Get profile statistics

### Feed: `/api/feed`
- `GET /` - Get feed posts (paginated)
- `POST /posts` - Create post
- `GET /posts/{post_id}` - Get post detail
- `PUT /posts/{post_id}` - Update post
- `DELETE /posts/{post_id}` - Delete post
- `POST /posts/{post_id}/like` - Like/unlike post

### Housing: `/api/housing`
- `GET /` - Get listings (with filters, paginated)
- `POST /` - Create listing
- `GET /{listing_id}` - Get listing detail
- `PUT /{listing_id}` - Update listing
- `DELETE /{listing_id}` - Delete listing
- `POST /{listing_id}/like` - Like/unlike listing
- `GET /my-listings` - Get user's listings

### Chat: `/api/chat`
- `GET /conversations` - List conversations
- `POST /conversations` - Create conversation
- `GET /conversations/{conversation_id}` - Get conversation detail
- `GET /conversations/{conversation_id}/messages` - Get messages
- `POST /messages` - Send message
- `PUT /messages/read` - Mark messages as read
- `POST /search` - Search messages

### Olive AI: `/api/olive`
- `POST /chat` - Send message to Olive
- `GET /conversations` - List Olive conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/{conversation_id}` - Get conversation with messages
- `PUT /conversations/{conversation_id}` - Update conversation title
- `DELETE /conversations/{conversation_id}` - Delete conversation

### Universities: `/api/universities`
- `GET /search` - Search universities
- `GET /verify/{domain}` - Verify university domain

---

## Environment Variables Required

### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx
GROQ_API_KEY=xxx
SECRET_KEY=xxx  # For JWT signing
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
HIPO_API_URL=http://universities.hipolabs.com
ENVIRONMENT=dev|prod
DEBUG=True|False
```

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_BASE_URL=http://localhost:8000/api
```
