import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Image, Upload, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function CreatePostModal({ isOpen, onClose, onSubmit, user }) {
  const [formData, setFormData] = useState({
    content: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes (50MB max per file)
    const invalidFiles = files.filter((file) => file.size > 50 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert(`Some files exceed 50MB limit: ${invalidFiles.map((f) => f.name).join(', ')}`);
      return;
    }

    // Limit to 5 files total
    const remainingSlots = 5 - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // Create preview URLs
    const newPreviews = filesToAdd.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name,
    }));

    setSelectedFiles((prev) => [...prev, ...filesToAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index].url);

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async () => {
    if (selectedFiles.length === 0) return { media_urls: [], media_types: [] };

    setUploadProgress('Uploading media...');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/feed/upload-media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Media upload failed');
      }

      const data = await response.json();
      setUploadProgress('');

      return {
        media_urls: data.media_urls || [],
        media_types: data.media_types || [],
      };
    } catch (error) {
      setUploadProgress('');
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate: must have content OR media
    if (!formData.content.trim() && selectedFiles.length === 0) {
      alert('Please add some content or upload media');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload media files to backend if any
      const { media_urls, media_types } = await uploadMediaFiles();

      // Step 2: Create post with content and uploaded media URLs
      setUploadProgress('Creating post...');

      const postData = {
        content: formData.content.trim() || undefined,
        media_urls: media_urls.length > 0 ? media_urls : undefined,
        media_types: media_types.length > 0 ? media_types : undefined,
      };

      await onSubmit(postData);

      // Step 3: Reset form on success
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
      setFormData({ content: '' });
      setSelectedFiles([]);
      setPreviews([]);
      setUploadProgress('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting

    // Clean up preview URLs
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews([]);
    setSelectedFiles([]);
    setFormData({ content: '' });
    setUploadProgress('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Create New Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, experiences, or ask a question..."
              className="min-h-32 rounded-xl resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              {formData.content.length > 0 && `${formData.content.length}/5000 characters`}
            </p>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Photos & Videos (Optional)
            </Label>

            {/* Preview Grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {preview.type === 'image' ? (
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={preview.url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                      {preview.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length < 5 && (
              <div>
                <input
                  type="file"
                  id="media-upload"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/mov,video/avi"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('media-upload').click()}
                  className="w-full rounded-xl border-dashed border-2"
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos or Videos ({selectedFiles.length}/5)
                </Button>
                <p className="text-xs text-slate-500 mt-1">
                  Supported: JPG, PNG, GIF, WEBP, MP4, MOV, AVI • Max 50MB per file
                </p>
              </div>
            )}
          </div>

          {/* Progress Message */}
          {uploadProgress && (
            <div className="flex items-center gap-2 text-sm text-cyan-600 bg-cyan-50 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!formData.content.trim() && selectedFiles.length === 0)}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadProgress || 'Posting...'}
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
