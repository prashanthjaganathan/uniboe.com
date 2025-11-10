import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WelcomeCard() {
  return (
    <Card className="border-0 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-2xl">
      <CardContent className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 lg:w-8 h-6 lg:h-8 text-cyan-200" />
          <h3 className="text-xl lg:text-2xl font-bold">Welcome to Uniboe!</h3>
        </div>
        <p className="text-cyan-100 mb-6 text-base lg:text-lg">
          Complete your profile to connect with students in your area and get personalized recommendations.
        </p>
        <Link to={createPageUrl("Profile")}>
          <Button className="w-full sm:w-auto bg-white text-cyan-700 hover:bg-cyan-50 shadow-lg">
            Complete Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}