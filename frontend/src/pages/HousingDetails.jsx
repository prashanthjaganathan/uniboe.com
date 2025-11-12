import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { housingService } from '@/services/housing.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Share2,
  Shield,
  ArrowLeft,
  Calendar,
  DollarSign,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Home,
} from 'lucide-react';

export default function HousingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch listing details
  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['housing', id],
    queryFn: () => housingService.getListing(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-slate-200 rounded-2xl"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <Home className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Listing not found</h3>
              <p className="text-slate-600 mb-6">
                The listing you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/housing')} className="rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Listings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : [
          `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=center`,
        ];

  const fullAddress = `${listing.address || ''}, ${listing.city}, ${listing.state}${listing.zip_code ? ' ' + listing.zip_code : ''}`;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/housing')}
          variant="outline"
          className="rounded-2xl bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        {/* Image Gallery */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
          <div className="relative h-96 lg:h-[500px]">
            <img
              src={images[currentImageIndex]}
              alt={`${listing.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 w-10 h-10 rounded-full"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 w-10 h-10 rounded-full"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Top Right Badges */}
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

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 w-10 h-10 rounded-full"
              >
                <Heart
                  className={`w-5 h-5 ${listing.is_liked_by_current_user ? 'fill-current text-rose-600' : ''}`}
                />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 w-10 h-10 rounded-full"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="p-4 bg-slate-50 flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all ${
                    index === currentImageIndex
                      ? 'ring-2 ring-rose-500 opacity-100'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{listing.title}</h1>
                    <div className="flex items-center text-slate-600">
                      <MapPin className="w-5 h-5 mr-2 text-rose-500" />
                      {fullAddress}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-slate-900">
                      ${listing.price}
                      <span className="text-xl font-normal text-slate-500">/mo</span>
                    </p>
                    {listing.like_count > 0 && (
                      <p className="text-sm text-slate-500 mt-1">
                        {listing.like_count} {listing.like_count === 1 ? 'like' : 'likes'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Key Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {listing.bedrooms !== null && (
                    <div className="flex flex-col items-center p-4 bg-rose-50 rounded-xl">
                      <Bed className="w-8 h-8 text-rose-500 mb-2" />
                      <p className="text-sm text-slate-600">Bedrooms</p>
                      <p className="text-lg font-semibold text-slate-900">{listing.bedrooms}</p>
                    </div>
                  )}
                  {listing.bathrooms !== null && (
                    <div className="flex flex-col items-center p-4 bg-orange-50 rounded-xl">
                      <Bath className="w-8 h-8 text-orange-500 mb-2" />
                      <p className="text-sm text-slate-600">Bathrooms</p>
                      <p className="text-lg font-semibold text-slate-900">{listing.bathrooms}</p>
                    </div>
                  )}
                  {listing.square_feet && (
                    <div className="flex flex-col items-center p-4 bg-purple-50 rounded-xl">
                      <Square className="w-8 h-8 text-purple-500 mb-2" />
                      <p className="text-sm text-slate-600">Area</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {listing.square_feet} sq ft
                      </p>
                    </div>
                  )}
                  {listing.available_from && (
                    <div className="flex flex-col items-center p-4 bg-emerald-50 rounded-xl">
                      <Calendar className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-sm text-slate-600">Available</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {new Date(listing.available_from).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description || 'No description available.'}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Amenities</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {listing.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-slate-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl sticky top-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Contact Verified Lister</h2>

                {listing.owner && (
                  <div className="flex items-center gap-3 mb-6">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={listing.owner.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                        {getInitials(listing.owner.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">{listing.owner.full_name}</p>
                      <p className="text-sm text-slate-500">Verified Lister</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  {listing.contact_email && (
                    <Button variant="outline" className="w-full rounded-xl">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>

                <div className="mt-6 p-4 bg-rose-50 rounded-xl">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <Shield className="w-4 h-4 inline mr-1 text-rose-500" />
                    Always verify listings and never send money before viewing the property.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/10 w-10 h-10 rounded-full"
            onClick={() => setShowImageModal(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[currentImageIndex]}
              alt={`${listing.title} - Full size`}
              className="w-full h-auto rounded-lg"
            />

            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
