-- Profile Pictures Policies
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Authenticated users can upload profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-pictures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-pictures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile pictures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-pictures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Post Media Policies
CREATE POLICY "Anyone can view post media" ON storage.objects
    FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'post-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own post media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'post-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Housing Images Policies
CREATE POLICY "Anyone can view housing images" ON storage.objects
    FOR SELECT USING (bucket_id = 'housing-images');

CREATE POLICY "Authenticated users can upload housing images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'housing-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own housing images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'housing-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );