import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Home } from "lucide-react";

const studentHubs = [
  {
    name: "New York",
    country: "USA",
    position: { x: 25, y: 40 },
    students: 12500,
    housing: 890,
    universities: ["Columbia", "NYU", "Fordham"],
  },
  {
    name: "Boston",
    country: "USA",
    position: { x: 28, y: 38 },
    students: 8900,
    housing: 560,
    universities: ["Harvard", "MIT", "BU"],
  },
  {
    name: "London",
    country: "UK",
    position: { x: 48, y: 32 },
    students: 15600,
    housing: 1200,
    universities: ["Imperial", "UCL", "LSE"],
  },
  {
    name: "Sydney",
    country: "Australia",
    position: { x: 85, y: 75 },
    students: 6700,
    housing: 420,
    universities: ["USYD", "UNSW", "UTS"],
  },
  {
    name: "Toronto",
    country: "Canada",
    position: { x: 22, y: 30 },
    students: 7800,
    housing: 380,
    universities: ["UofT", "York", "Ryerson"],
  },
  {
    name: "Berlin",
    country: "Germany",
    position: { x: 52, y: 28 },
    students: 5400,
    housing: 340,
    universities: ["TU Berlin", "Humboldt", "FU Berlin"],
  },
];

export default function GlobalMap() {
  const [hoveredHub, setHoveredHub] = useState(null);

  return (
    <div className="relative w-full h-80 bg-gradient-to-br from-blue-900 to-emerald-900 rounded-2xl overflow-hidden">
      {/* World map background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Student hubs */}
      {studentHubs.map((hub, index) => (
        <div
          key={hub.name}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110"
          style={{
            left: `${hub.position.x}%`,
            top: `${hub.position.y}%`,
          }}
          onMouseEnter={() => setHoveredHub(hub)}
          onMouseLeave={() => setHoveredHub(null)}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full shadow-lg animate-pulse"></div>
            <div className="absolute inset-0 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
          </div>
        </div>
      ))}

      {/* Hover card */}
      {hoveredHub && (
        <Card className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border-0 shadow-xl z-10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-900">
                {hoveredHub.name}, {hoveredHub.country}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Students
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {hoveredHub.students.toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Housing
                </span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {hoveredHub.housing.toLocaleString()}
                </Badge>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Popular Universities:</p>
              <div className="flex flex-wrap gap-1">
                {hoveredHub.universities.map((uni) => (
                  <Badge key={uni} variant="outline" className="text-xs">
                    {uni}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
