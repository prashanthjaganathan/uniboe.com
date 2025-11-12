import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Heart, Share2, Shield } from 'lucide-react';
import { housingService } from '@/services/housing.service';

export default function HousingCard({ listing }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use useEffect to sync state with listing prop changes (e.g., when user changes)
  const [isLiked, setIsLiked] = useState(listing.is_liked_by_current_user || false);
  const [likeCount, setLikeCount] = useState(listing.like_count || 0);

  React.useEffect(() => {
    setIsLiked(listing.is_liked_by_current_user || false);
    setLikeCount(listing.like_count || 0);
  }, [listing.is_liked_by_current_user, listing.like_count]);

  const firstImage =
    listing.images?.[0] ||
    `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&crop=center`;

  // Format the full address
  const fullAddress = `${listing.city}, ${listing.state}${listing.zip_code ? ' ' + listing.zip_code : ''}`;

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => housingService.likeListing(listing.id),
    onMutate: async () => {
      // Optimistic update
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    },
    onError: (error) => {
      // Revert on error
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
      console.error('Failed to like listing:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housing'] });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: () => housingService.unlikeListing(listing.id),
    onMutate: async () => {
      // Optimistic update
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    },
    onError: (error) => {
      // Revert on error
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      console.error('Failed to unlike listing:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housing'] });
    },
  });

  const handleLikeClick = (e) => {
    e.stopPropagation(); // Prevent navigation when clicking heart
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return (
    <Card className="group border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
      <div className="relative">
        <img
          src={firstImage}
          alt={listing.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {listing.is_active && (
            <Badge className="bg-emerald-500 text-white border-0">
              <Shield className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
          {listing.property_type === 'sublet' && (
            <Badge variant="outline" className="bg-white/90 text-slate-700">
              Sublet
            </Badge>
          )}
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleLikeClick}
            disabled={likeMutation.isPending || unlikeMutation.isPending}
            className="bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 transition-colors w-8 h-8"
          >
            <Heart
              className={`w-4 h-4 transition-all ${isLiked ? 'fill-current text-rose-600' : ''}`}
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 transition-colors w-8 h-8"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900 text-lg leading-tight group-hover:text-rose-700 transition-colors">
              {listing.title}
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                ${listing.price}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
            </div>
          </div>

          <div className="flex items-center text-slate-600 text-sm">
            <MapPin className="w-4 h-4 mr-2 text-rose-500" />
            {fullAddress}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            {listing.bedrooms !== null && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {listing.bedrooms} bed
              </div>
            )}
            {listing.bathrooms !== null && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {listing.bathrooms} bath
              </div>
            )}
            {listing.square_feet && <div className="text-xs">{listing.square_feet} sq ft</div>}
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {listing.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {likeCount > 0 && (
            <div className="text-sm text-slate-500 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current text-rose-500" />
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </div>
          )}

          <Button
            onClick={() => navigate(`/housing/${listing.id}`)}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
