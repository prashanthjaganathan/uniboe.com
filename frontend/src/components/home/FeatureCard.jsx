import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeatureCard({ icon: Icon, title, description, gradient, link }) {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-slate-600 mb-6 leading-relaxed">{description}</p>
        <Link to={link}>
          <Button
            variant="ghost"
            className="group-hover:bg-blue-50 group-hover:text-blue-700 transition-all duration-300 p-0 h-auto font-semibold"
          >
            Explore
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
