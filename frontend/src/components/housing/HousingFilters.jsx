import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

export default function HousingFilters({ filters, setFilters, cities }) {
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priceMin: "",
      priceMax: "",
      propertyType: "all",
      bedrooms: "all",
      city: "all",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== "all");

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="font-medium text-slate-900">Filters</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-1 w-full">
            <div className="col-span-2 md:col-span-1 lg:col-span-2 grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min price"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                className="rounded-xl"
              />
              <Input
                type="number"
                placeholder="Max price"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Select
              value={filters.city}
              onValueChange={(value) => handleFilterChange("city", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.propertyType}
              onValueChange={(value) => handleFilterChange("propertyType", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="shared_room">Shared Room</SelectItem>
                <SelectItem value="private_room">Private Room</SelectItem>
                <SelectItem value="house">House</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.bedrooms}
              onValueChange={(value) => handleFilterChange("bedrooms", value)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-xl flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
