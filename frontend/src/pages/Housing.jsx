import React, { useState, useEffect, useCallback } from 'react';
import { housingService } from '@/services/housing.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  MapPin,
  Filter,
  Heart,
  Share2,
  Bed,
  Bath,
  Wifi,
  Car,
  Search,
  Map,
  List,
  Star,
} from 'lucide-react';
import HousingCard from '../components/housing/HousingCard';
import HousingFilters from '../components/housing/HousingFilters';
import AddListingModal from '../components/housing/AddListingModal';

export default function HousingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    propertyType: 'all',
    bedrooms: 'all',
    city: 'all',
  });
  const [viewMode, setViewMode] = useState('list');
  const [showAddListing, setShowAddListing] = useState(false);

  const queryClient = useQueryClient();

  // Build search filters for backend
  const buildFilters = () => {
    const searchFilters = {};
    if (filters.priceMin) searchFilters.min_price = parseFloat(filters.priceMin);
    if (filters.priceMax) searchFilters.max_price = parseFloat(filters.priceMax);
    if (filters.propertyType !== 'all') searchFilters.property_type = filters.propertyType;
    if (filters.bedrooms !== 'all') searchFilters.bedrooms = parseInt(filters.bedrooms);
    if (filters.city !== 'all') searchFilters.city = filters.city;
    return searchFilters;
  };

  // Fetch listings
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['housing', filters, searchTerm],
    queryFn: async () => {
      if (searchTerm) {
        return await housingService.searchByLocation(searchTerm);
      }
      return await housingService.getListings(buildFilters());
    },
  });

  const listings = listingsData?.listings ?? [];
  const uniqueCities = [...new Set(listings.map((l) => l.city).filter(Boolean))];

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: (listingData) => housingService.createListing(listingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housing'] });
      setShowAddListing(false);
    },
  });

  const handleAddListing = async (listingData) => {
    createListingMutation.mutate(listingData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Student Housing</h1>
            <p className="text-slate-600 mt-1">Find your perfect home away from home</p>
          </div>
          <Button
            onClick={() => setShowAddListing(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl"
          >
            List Your Place
          </Button>
        </div>

        {/* Search and View Toggle */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by city, area, or property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl border-slate-200 focus:ring-rose-500 focus:border-rose-500 w-full"
                />
              </div>
              <Tabs value={viewMode} onValueChange={setViewMode} className="w-full lg:w-auto">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
                  <TabsTrigger
                    value="list"
                    className="rounded-xl flex items-center gap-2 flex-1 lg:flex-none"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="map"
                    className="rounded-xl flex items-center gap-2 flex-1 lg:flex-none"
                  >
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Map</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <HousingFilters filters={filters} setFilters={setFilters} cities={uniqueCities} />

        {/* Results Counter */}
        <div className="text-slate-600">Found {listings.length} properties</div>

        {/* Listings */}
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsContent value="list" className="space-y-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Card
                      key={i}
                      className="animate-pulse border-0 bg-white/80 backdrop-blur-sm shadow-lg"
                    >
                      <div className="h-48 bg-slate-200 rounded-t-2xl"></div>
                      <CardContent className="p-6 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <HousingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {listings.length === 0 && !isLoading && (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="text-center py-16">
                  <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties found</h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your filters or search in a different area.
                  </p>
                  <Button
                    onClick={() =>
                      setFilters({
                        priceMin: '',
                        priceMax: '',
                        propertyType: 'all',
                        bedrooms: 'all',
                        city: 'all',
                      })
                    }
                    variant="outline"
                    className="rounded-2xl"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="h-96 bg-gradient-to-br from-rose-100 to-orange-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Map className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Map View Coming Soon
                    </h3>
                    <p className="text-slate-600">
                      Interactive map with all housing listings will be available soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddListingModal
          isOpen={showAddListing}
          onClose={() => setShowAddListing(false)}
          onSubmit={handleAddListing}
        />
      </div>
    </div>
  );
}
