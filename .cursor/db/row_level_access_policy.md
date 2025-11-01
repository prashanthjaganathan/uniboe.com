-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE olive_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE olive_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- POSTS POLICIES
-- ============================================

-- Anyone can view posts
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POST LIKES POLICIES
-- ============================================

-- Anyone can view likes
CREATE POLICY "Post likes are viewable by everyone" ON post_likes
    FOR SELECT USING (true);

-- Authenticated users can like posts
CREATE POLICY "Authenticated users can like posts" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike posts
CREATE POLICY "Users can unlike posts" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HOUSING POLICIES
-- ============================================

-- Anyone can view active listings
CREATE POLICY "Active housing listings are viewable" ON housing_listings
    FOR SELECT USING (is_active = true OR auth.uid() = user_id);

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings" ON housing_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON housing_listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON housing_listings
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HOUSING LIKES POLICIES
-- ============================================

CREATE POLICY "Housing likes are viewable by everyone" ON housing_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like listings" ON housing_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike listings" ON housing_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = participant_1_id OR 
        auth.uid() = participant_2_id
    );

-- Users can create conversations they're part of
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1_id OR 
        auth.uid() = participant_2_id
    );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.participant_1_id = auth.uid() 
                 OR conversations.participant_2_id = auth.uid())
        )
    );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = conversation_id 
            AND (conversations.participant_1_id = auth.uid() 
                 OR conversations.participant_2_id = auth.uid())
        )
    );

-- Users can update read status on received messages
CREATE POLICY "Users can mark messages as read" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.participant_1_id = auth.uid() 
                 OR conversations.participant_2_id = auth.uid())
            AND sender_id != auth.uid()
        )
    );

-- ============================================
-- OLIVE POLICIES
-- ============================================

-- Users can view their own Olive conversations
CREATE POLICY "Users can view own Olive conversations" ON olive_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create Olive conversations" ON olive_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own Olive messages
CREATE POLICY "Users can view own Olive messages" ON olive_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM olive_conversations 
            WHERE olive_conversations.id = olive_messages.conversation_id 
            AND olive_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create Olive messages" ON olive_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM olive_conversations 
            WHERE olive_conversations.id = conversation_id 
            AND olive_conversations.user_id = auth.uid()
        )
    );