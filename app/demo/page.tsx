"use client"

import React, { useState } from 'react';
import AdvancedTakeoffCanvas, { TakeoffMeasurement, CalibrationData } from '@/app/components/AdvancedTakeoffCanvas';
import DemoMode, { DemoData } from '@/app/components/DemoMode';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Share2, Mail } from "lucide-react";

// Sample measurements for demo
const SAMPLE_MEASUREMENTS: TakeoffMeasurement[] = [
  {
    id: "1",
    type: "line",
    points: [100, 100, 300, 100],
    label: "Foundation Wall 1",
    value: 16.67,
    unit: "ft",
    division: "03",
    subcategory: "Foundation",
    layer: "Foundation",
    color: "#2563EB",
    createdAt: new Date()
  },
  {
    id: "2",
    type: "area",
    points: [100, 100, 300, 100, 300, 200, 100, 200],
    label: "Living Room",
    value: 333.33,
    unit: "sq ft",
    division: "09",
    subcategory: "Finishes",
    layer: "Finishes",
    color: "#22C55E",
    createdAt: new Date()
  },
  {
    id: "3",
    type: "count",
    points: [150, 150],
    label: "Windows",
    value: 4,
    unit: "count",
    division: "08",
    subcategory: "Openings",
    layer: "Framing",
    color: "#F59E0B",
    createdAt: new Date()
  }
];

// Sample calibration data
const SAMPLE_CALIBRATION: CalibrationData = {
  pixelDistance: 200,
  realDistance: 20,
  unit: "ft",
  scale: 10 // 10 pixels = 1 foot
};

export default function DemoPage() {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [measurements, setMeasurements] = useState<TakeoffMeasurement[]>(SAMPLE_MEASUREMENTS);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<CalibrationData>(SAMPLE_CALIBRATION);

  const handleEnterDemo = (data: DemoData) => {
    setDemoData(data);
  };

  const handleAddMeasurement = (measurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'>) => {
    const newMeasurement: TakeoffMeasurement = {
      ...measurement,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setMeasurements(prev => [...prev, newMeasurement]);
  };

  const handleUpdateMeasurement = (id: string, updates: Partial<TakeoffMeasurement>) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveCalibration = (calibrationData: CalibrationData) => {
    setCalibration(calibrationData);
  };

  const handleExportDemo = () => {
    const demoSummary = {
      tester: demoData,
      measurements: measurements,
      calibration: calibration,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(demoSummary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takeoff-demo-${demoData?.testerName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareDemo = () => {
    const demoUrl = window.location.href;
    navigator.clipboard.writeText(demoUrl);
    alert('Demo URL copied to clipboard!');
  };

  if (!demoData) {
    return <DemoMode onEnterDemo={handleEnterDemo} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Demo Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDemoData(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {demoData.projectName}
              </h1>
              <p className="text-sm text-gray-600">
                Demo by {demoData.testerName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDemo}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareDemo}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {demoData.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const subject = encodeURIComponent(`Takeoff Demo Feedback - ${demoData.projectName}`);
                  const body = encodeURIComponent(`Hi,\n\nI tried the takeoff demo and would like to provide feedback.\n\nProject: ${demoData.projectName}\nTester: ${demoData.testerName}\n\nFeedback:\n`);
                  window.open(`mailto:your-email@example.com?subject=${subject}&body=${body}`);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Feedback
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Demo Canvas */}
      <div className="flex-1">
        <AdvancedTakeoffCanvas
          width={1200}
          height={800}
          backgroundImageUrl="/images/sample-floor-plan.jpg"
          measurements={measurements}
          selectedMeasurementId={selectedMeasurementId}
          initialCalibration={calibration}
          onSaveCalibration={handleSaveCalibration}
          onAddMeasurement={handleAddMeasurement}
          onUpdateMeasurement={handleUpdateMeasurement}
          onDeleteMeasurement={handleDeleteMeasurement}
          onSelectMeasurement={setSelectedMeasurementId}
        />
      </div>

      {/* Demo Tips */}
      <div className="bg-blue-50 border-t p-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Demo Tips:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>🎯 Try Calibration:</strong> Use the calibration tool to set accurate scale
            </div>
            <div>
              <strong>📐 Shift + Area:</strong> Hold Shift while drawing areas for straight lines
            </div>
            <div>
              <strong>🔍 Zoom & Pan:</strong> Use mouse wheel to zoom, drag to pan around
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
