import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/backendAdapter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MapPin,
  GraduationCap,
  Users,
  Plus,
  Instagram,
  Linkedin,
  Heart,
} from "lucide-react";
import StudentCard from "../components/community/StudentCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CommunityPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const studentProfiles = await base44.entities.Student.list();
      setStudents(studentProfiles);
    } catch (error) {
      console.error("Error loading community:", error);
    }
    setIsLoading(false);
  };

  const applyFilters = useCallback(() => {
    let filtered = students.filter((student) => {
      const matchesSearch =
        !searchTerm ||
        student.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.created_by?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (filterBy !== "all") {
        switch (filterBy) {
          case "same_university":
            matchesFilter = student.university === currentUser?.university;
            break;
          case "same_location":
            matchesFilter = student.location === currentUser?.location;
            break;
          case "graduate":
            matchesFilter = student.year === "Graduate" || student.year === "PhD";
            break;
          case "undergraduate":
            matchesFilter = !["Graduate", "PhD"].includes(student.year);
            break;
        }
      }

      return matchesSearch && matchesFilter;
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterBy, currentUser]); // Dependencies for useCallback

  useEffect(() => {
    applyFilters();
  }, [applyFilters]); // Now depends on the memoized applyFilters

  const uniqueUniversities = [...new Set(students.map((s) => s.university).filter(Boolean))];
  const uniqueLocations = [...new Set(students.map((s) => s.location).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-purple-50/20 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Student Community</h1>
          <p className="text-slate-600">Connect with fellow students around the world</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <Users className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">{students.length}</div>
              <div className="text-sm text-slate-600">Students</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <GraduationCap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">
                {uniqueUniversities.length}
              </div>
              <div className="text-sm text-slate-600">Universities</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <MapPin className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">
                {uniqueLocations.length}
              </div>
              <div className="text-sm text-slate-600">Cities</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 lg:p-6 text-center">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <div className="text-xl lg:text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-sm text-slate-600">Support</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by university, program, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl border-slate-200 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full lg:w-48 rounded-2xl">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="same_university">Same University</SelectItem>
                  <SelectItem value="same_location">Same Location</SelectItem>
                  <SelectItem value="undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="graduate">Graduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Student Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Card
                  key={i}
                  className="animate-pulse border-0 bg-white/80 backdrop-blur-sm shadow-lg"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-3 bg-slate-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} currentUser={currentUser} />
            ))}
          </div>
        )}

        {filteredStudents.length === 0 && !isLoading && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No students found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your search or filters.</p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                }}
                variant="outline"
                className="rounded-2xl"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
