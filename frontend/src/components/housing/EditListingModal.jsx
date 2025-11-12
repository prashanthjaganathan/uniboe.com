import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

export default function EditListingModal({ isOpen, onClose, onSubmit, listing }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    property_type: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    amenities: [],
    available_from: '',
    available_until: '',
    contact_email: '',
    contact_phone: '',
  });
  const [currentAmenity, setCurrentAmenity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form with listing data
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        address: listing.address || '',
        city: listing.city || '',
        state: listing.state || '',
        zip_code: listing.zip_code || '',
        price: listing.price?.toString() || '',
        property_type: listing.property_type || '',
        bedrooms: listing.bedrooms?.toString() || '',
        bathrooms: listing.bathrooms?.toString() || '',
        square_feet: listing.square_feet?.toString() || '',
        amenities: listing.amenities || [],
        available_from: listing.available_from || '',
        available_until: listing.available_until || '',
        contact_email: listing.contact_email || '',
        contact_phone: listing.contact_phone || '',
      });
    }
  }, [listing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare listing data matching backend model
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim() || undefined,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
        property_type: formData.property_type,
        amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
        available_from: formData.available_from || undefined,
        available_until: formData.available_until || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
      };

      // Validate at least one contact method
      if (!listingData.contact_email && !listingData.contact_phone) {
        alert('Please provide at least one contact method (email or phone)');
        setIsSubmitting(false);
        return;
      }

      await onSubmit(listingData);
    } catch (error) {
      console.error('Error updating listing:', error);
      alert(error.message || 'Failed to update listing. Please try again.');
    }

    setIsSubmitting(false);
  };

  const addAmenity = () => {
    if (currentAmenity.trim() && !formData.amenities.includes(currentAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, currentAmenity.trim()],
      }));
      setCurrentAmenity('');
    }
  };

  const removeAmenity = (amenityToRemove) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((amenity) => amenity !== amenityToRemove),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Edit Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Cozy Studio Near NYU"
                className="rounded-xl"
                required
                minLength={5}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your property..."
                className="min-h-24 rounded-xl resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, Apt 4B"
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="New York"
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="NY"
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData((prev) => ({ ...prev, zip_code: e.target.value }))}
                placeholder="10003"
                className="rounded-xl"
                pattern="\d{5}(-\d{4})?"
              />
            </div>

            <div>
              <Label htmlFor="price">Monthly Rent ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="1500"
                className="rounded-xl"
                required
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="property_type">Property Type *</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, property_type: value }))
                }
                required
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="sublet">Sublet</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: e.target.value }))}
                placeholder="1"
                className="rounded-xl"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: e.target.value }))}
                placeholder="1"
                className="rounded-xl"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="square_feet">Square Feet</Label>
              <Input
                id="square_feet"
                type="number"
                value={formData.square_feet}
                onChange={(e) => setFormData((prev) => ({ ...prev, square_feet: e.target.value }))}
                placeholder="900"
                className="rounded-xl"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="available_from">Available From</Label>
              <Input
                id="available_from"
                type="date"
                value={formData.available_from}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, available_from: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="available_until">Available Until</Label>
              <Input
                id="available_until"
                type="date"
                value={formData.available_until}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, available_until: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input
                  value={currentAmenity}
                  onChange={(e) => setCurrentAmenity(e.target.value)}
                  placeholder="Add amenity (e.g., parking, laundry)"
                  className="rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <Button
                  type="button"
                  onClick={addAmenity}
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline" className="gap-1">
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
                }
                placeholder="your.email@university.edu"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))
                }
                placeholder="+1-555-0100"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
