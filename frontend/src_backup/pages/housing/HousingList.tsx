import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { housingService } from '@/services/housing.service';
import { HousingListingResponse } from '@/types/housing.types';
import { Search, Bed, Bath, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Link } from 'react-router-dom';

const HousingList = () => {
  const [listings, setListings] = useState<HousingListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const response = await housingService.getListings();
      setListings(response.listings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadListings();
      return;
    }

    try {
      const response = await housingService.searchByLocation(searchQuery);
      setListings(response.listings);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Student Housing</h1>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by location, university, or housing type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Link to="/housing/create">
              <Button variant="gradient">Create Listing</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} to={`/housing/${listing.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  {listing.images.length > 0 && (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(listing.price)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.city}, {listing.state}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        {listing.bedrooms} bed
                      </span>
                      <span className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        {listing.bathrooms} bath
                      </span>
                    </div>
                    {listing.amenities.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {listing.amenities.slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                        {listing.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{listing.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HousingList;

