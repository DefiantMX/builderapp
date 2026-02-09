"use client"

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, Square, Settings, ZoomIn } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function DemoLink() {
  const { user, loading } = useAuth();

  // Don't render the demo link if user is signed in or still loading
  if (user || loading) {
    return null;
  }
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          🚀 Try Advanced Takeoff
        </CardTitle>
        <CardDescription className="text-gray-600">
          Experience professional construction takeoff software
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Ruler className="h-4 w-4 text-blue-600" />
            <span>Line Measurements</span>
          </div>
          <div className="flex items-center space-x-2">
            <Square className="h-4 w-4 text-green-600" />
            <span>Area Calculations</span>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-orange-600" />
            <span>Smart Calibration</span>
          </div>
          <div className="flex items-center space-x-2">
            <ZoomIn className="h-4 w-4 text-purple-600" />
            <span>Zoom & Pan</span>
          </div>
        </div>
        
        <Link href="/demo" className="block">
          <Button className="w-full" size="lg">
            Start Free Demo
          </Button>
        </Link>
        
        <p className="text-xs text-gray-500 text-center">
          No registration required • Sample data included
        </p>
      </CardContent>
    </Card>
  );
}
