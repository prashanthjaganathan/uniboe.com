import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Wifi, Car, Heart, Share2, Star, Shield } from 'lucide-react';

export default function HousingCard({ listing }) {
  const firstImage =
    listing.images?.[0] ||
    `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&crop=center`;

  return (
    <Card className="group border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 rounded-2xl overflow-hidden">
      <div className="relative">
        <img
          src={firstImage}
          alt={listing.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {listing.verified && (
            <Badge className="bg-emerald-500 text-white border-0">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {listing.is_sublease && (
            <Badge variant="outline" className="bg-white/90 text-slate-700">
              Sublease
            </Badge>
          )}
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 transition-colors w-8 h-8"
          >
            <Heart className="w-4 h-4" />
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
            {listing.location}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            {listing.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {listing.bedrooms} bed
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {listing.bathrooms} bath
              </div>
            )}
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

          {listing.distance_to_campus && (
            <div className="text-sm text-emerald-600 font-medium">
              {listing.distance_to_campus} to campus
            </div>
          )}

          <Button className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
