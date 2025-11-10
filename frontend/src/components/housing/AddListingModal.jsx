import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

export default function AddListingModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    city: "",
    country: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    furnished: false,
    utilities_included: false,
    amenities: [],
    available_from: "",
    lease_length: "",
    is_sublease: false,
    looking_for_roommate: false,
    contact_info: "",
  });
  const [currentAmenity, setCurrentAmenity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setFormData({
        title: "",
        description: "",
        price: "",
        location: "",
        city: "",
        country: "",
        property_type: "",
        bedrooms: "",
        bathrooms: "",
        furnished: false,
        utilities_included: false,
        amenities: [],
        available_from: "",
        lease_length: "",
        is_sublease: false,
        looking_for_roommate: false,
        contact_info: "",
      });
    } catch (error) {
      console.error("Error adding listing:", error);
    }

    setIsSubmitting(false);
  };

  const addAmenity = () => {
    if (currentAmenity.trim() && !formData.amenities.includes(currentAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, currentAmenity.trim()],
      }));
      setCurrentAmenity("");
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
          <DialogTitle className="text-xl font-bold text-slate-900">List Your Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Property Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Cozy Studio Near NYU"
                className="rounded-xl"
                required
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

            <div>
              <Label htmlFor="price">Monthly Rent ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) }))
                }
                placeholder="1500"
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="property_type">Property Type</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, property_type: value }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="shared_room">Shared Room</SelectItem>
                  <SelectItem value="private_room">Private Room</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
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
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="USA"
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bedrooms: parseInt(e.target.value) }))
                }
                placeholder="1"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bathrooms: parseInt(e.target.value) }))
                }
                placeholder="1"
                className="rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="location">Full Address</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="123 Main St, Brooklyn, NY 11201"
                className="rounded-xl"
                required
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
              <Label htmlFor="lease_length">Lease Length</Label>
              <Input
                id="lease_length"
                value={formData.lease_length}
                onChange={(e) => setFormData((prev) => ({ ...prev, lease_length: e.target.value }))}
                placeholder="12 months"
                className="rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input
                  value={currentAmenity}
                  onChange={(e) => setCurrentAmenity(e.target.value)}
                  placeholder="Add amenity"
                  className="rounded-xl"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
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

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="furnished"
                  checked={formData.furnished}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, furnished: checked }))
                  }
                />
                <Label htmlFor="furnished">Furnished</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="utilities"
                  checked={formData.utilities_included}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, utilities_included: checked }))
                  }
                />
                <Label htmlFor="utilities">Utilities Included</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sublease"
                  checked={formData.is_sublease}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_sublease: checked }))
                  }
                />
                <Label htmlFor="sublease">This is a sublease</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="roommate"
                  checked={formData.looking_for_roommate}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, looking_for_roommate: checked }))
                  }
                />
                <Label htmlFor="roommate">Looking for roommate</Label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="contact">Contact Information</Label>
              <Input
                id="contact"
                value={formData.contact_info}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_info: e.target.value }))}
                placeholder="Email or phone number"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-xl"
            >
              {isSubmitting ? "Adding..." : "Add Listing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
