import React, { useState, useEffect, useCallback } from 'react';
import { housingService } from '@/services/housing.service';
import { authService } from '@/services/auth.service';
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
  Edit,
  Trash2,
  X,
  Settings,
} from 'lucide-react';
import HousingCard from '../components/housing/HousingCard';
import HousingFilters from '../components/housing/HousingFilters';
import AddListingModal from '../components/housing/AddListingModal';
import EditListingModal from '../components/housing/EditListingModal';

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
  const [showManageListings, setShowManageListings] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

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
  const {
    data: listingsData,
    isLoading,
    error,
  } = useQuery({
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

  // Fetch user's listings
  const { data: userListingsData } = useQuery({
    queryKey: ['housing', 'user', user?.id],
    queryFn: () => housingService.getUserListings(user?.id, 1, 100, true),
    enabled: !!user?.id && showManageListings,
  });

  const userListings = userListingsData?.listings ?? [];

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: (listingData) => housingService.createListing(listingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housing'] });
      setShowAddListing(false);
    },
  });

  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: (listingId) => housingService.deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housing'] });
    },
  });

  // Update listing mutation
  const updateListingMutation = useMutation({
    mutationFn: ({ listingId, data }) => housingService.updateListing(listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housing'] });
      setEditingListing(null);
    },
  });

  const handleAddListing = async (listingData) => {
    createListingMutation.mutate(listingData);
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      deleteListingMutation.mutate(listingId);
    }
  };

  const handleUpdateListing = async (listingData) => {
    updateListingMutation.mutate({ listingId: editingListing.id, data: listingData });
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
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setShowManageListings(true)}
              variant="outline"
              className="w-full sm:w-auto border-2 border-rose-500 text-rose-600 hover:bg-rose-50 rounded-2xl"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Listings
            </Button>
            <Button
              onClick={() => setShowAddListing(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl"
            >
              List Your Place
            </Button>
          </div>
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

        {/* Error Message */}
        {error && (
          <Card className="border-0 bg-red-50 shadow-lg">
            <CardContent className="p-6">
              <div className="text-red-800 font-semibold mb-2">Error loading listings</div>
              <div className="text-red-600 text-sm">
                {error?.response?.data?.detail ||
                  error?.message ||
                  'Failed to load housing listings. Please try again later.'}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Manage Listings Modal */}
        {showManageListings && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowManageListings(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center rounded-t-2xl z-10">
                <h3 className="text-lg font-semibold text-slate-900">My Listings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowManageListings(false)}
                  className="rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6">
                {userListings.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No listings yet</h3>
                    <p className="text-slate-600 mb-6">Create your first listing to get started!</p>
                    <Button
                      onClick={() => {
                        setShowManageListings(false);
                        setShowAddListing(true);
                      }}
                      className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-2xl"
                    >
                      Create Listing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userListings.map((listing) => (
                      <Card
                        key={listing.id}
                        className="border-0 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Listing Image */}
                            <div className="w-full md:w-48 h-32 flex-shrink-0">
                              <img
                                src={
                                  listing.images?.[0] ||
                                  `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop`
                                }
                                alt={listing.title}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            </div>

                            {/* Listing Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {listing.title}
                                  </h4>
                                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {listing.city}, {listing.state}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={listing.is_active ? 'default' : 'secondary'}
                                    className={
                                      listing.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-200 text-slate-700'
                                    }
                                  >
                                    {listing.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                                <span className="font-semibold text-rose-600 text-lg">
                                  ${listing.price}/mo
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  {listing.bedrooms} bed
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bath className="w-4 h-4" />
                                  {listing.bathrooms} bath
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => setEditingListing(listing)}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleDeleteListing(listing.id)}
                                  disabled={deleteListingMutation.isPending}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  {deleteListingMutation.isPending ? 'Deleting...' : 'Delete'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Listing Modal */}
        <EditListingModal
          isOpen={!!editingListing}
          onClose={() => setEditingListing(null)}
          onSubmit={handleUpdateListing}
          listing={editingListing}
        />
      </div>
    </div>
  );
}
