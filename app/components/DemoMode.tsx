"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DemoModeProps {
  onEnterDemo: (demoData: DemoData) => void;
}

export interface DemoData {
  projectName: string;
  testerName: string;
  email?: string;
}

export default function DemoMode({ onEnterDemo }: DemoModeProps) {
  const [projectName, setProjectName] = useState('');
  const [testerName, setTesterName] = useState('');
  const [email, setEmail] = useState('');

  const handleEnterDemo = () => {
    if (projectName.trim() && testerName.trim()) {
      onEnterDemo({
        projectName: projectName.trim(),
        testerName: testerName.trim(),
        email: email.trim() || undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🚀 Advanced Takeoff Demo
          </CardTitle>
          <CardDescription className="text-gray-600">
            Try our professional construction takeoff software
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., Demo House Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tester-name">Your Name</Label>
            <Input
              id="tester-name"
              placeholder="e.g., John Smith"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              We'll send you a summary of your demo session
            </p>
          </div>
          
          <Button 
            onClick={handleEnterDemo}
            disabled={!projectName.trim() || !testerName.trim()}
            className="w-full"
            size="lg"
          >
            Start Demo
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Demo includes: Takeoff measurements, calibration, zoom/pan, and more
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
