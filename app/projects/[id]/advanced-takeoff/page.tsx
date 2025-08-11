"use client"

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Settings, 
  FileText, 
  Calculator,
  Layers,
  Filter,
  Save,
  Share2,
  Printer,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdvancedTakeoffCanvas, { 
  TakeoffMeasurement, 
  TakeoffTool 
} from "@/app/components/AdvancedTakeoffCanvas";
import { DIVISIONS, DIVISION_SUBCATEGORIES } from "@/lib/constants";

interface Plan {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function AdvancedTakeoffPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<TakeoffMeasurement[]>([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI state
  const [showSummary, setShowSummary] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [filterDivision, setFilterDivision] = useState<string>("all");
  const [filterLayer, setFilterLayer] = useState<string>("all");
  
  // Export state
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [showExportModal, setShowExportModal] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Fetch project and plans
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project
        const projectResponse = await fetch(`/api/projects/${params.id}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProject(projectData);
        }

        // Fetch plans
        const plansResponse = await fetch(`/api/projects/${params.id}/plans`);
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setPlans(plansData);
          if (plansData.length > 0) {
            setSelectedPlanId(plansData[0].id);
          }
        }

        // Fetch existing measurements
        const measurementsResponse = await fetch(`/api/projects/${params.id}/takeoff`);
        if (measurementsResponse.ok) {
          const measurementsData = await measurementsResponse.json();
          setMeasurements(measurementsData.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt)
          })));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [params.id, session]);

  // Handle measurement operations
  const handleAddMeasurement = async (measurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/takeoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...measurement,
          planId: selectedPlanId,
          points: JSON.stringify(measurement.points)
        })
      });

      if (response.ok) {
        const newMeasurement = await response.json();
        setMeasurements(prev => [...prev, {
          ...newMeasurement,
          createdAt: new Date(newMeasurement.createdAt)
        }]);
      }
    } catch (error) {
      console.error("Failed to add measurement:", error);
    }
  };

  const handleUpdateMeasurement = async (id: string, updates: Partial<TakeoffMeasurement>) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/takeoff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          points: updates.points ? JSON.stringify(updates.points) : undefined
        })
      });

      if (response.ok) {
        const updatedMeasurement = await response.json();
        setMeasurements(prev => prev.map(m => 
          m.id === id ? { ...m, ...updatedMeasurement } : m
        ));
      }
    } catch (error) {
      console.error("Failed to update measurement:", error);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/takeoff/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMeasurements(prev => prev.filter(m => m.id !== id));
        setSelectedMeasurementId(null);
      }
    } catch (error) {
      console.error("Failed to delete measurement:", error);
    }
  };

  // Filter measurements
  const filteredMeasurements = measurements.filter(m => {
    if (filterDivision !== "all" && m.division !== filterDivision) return false;
    if (filterLayer !== "all" && m.layer !== filterLayer) return false;
    return true;
  });

  // Calculate totals by division
  const totalsByDivision = measurements.reduce((acc, m) => {
    const division = DIVISIONS[m.division as keyof typeof DIVISIONS] || m.division;
    if (!acc[division]) {
      acc[division] = { line: 0, area: 0, count: 0, text: 0 };
    }
    
    if (m.type === "line") acc[division].line += m.value;
    else if (m.type === "area") acc[division].area += m.value;
    else if (m.type === "count") acc[division].count += m.value;
    else if (m.type === "text") acc[division].text += 1;
    
    return acc;
  }, {} as Record<string, { line: number; area: number; count: number; text: number }>);

  // Export functions
  const handleExport = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/takeoff/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
          measurements: filteredMeasurements
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `takeoff-${project?.name}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setSaving(false);
      setShowExportModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${params.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project?.name} - Advanced Takeoff</h1>
              <p className="text-sm text-gray-600">Professional takeoff and measurement tools</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
            >
              {showSummary ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaving(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex items-center space-x-4">
          <Label className="text-sm font-medium">Plan:</Label>
          <Select value={selectedPlanId || ""} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">Division:</Label>
            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {Object.entries(DIVISIONS).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1">
          {selectedPlan ? (
            <AdvancedTakeoffCanvas
              width={1200}
              height={800}
              backgroundImageUrl={selectedPlan.fileUrl}
              measurements={filteredMeasurements}
              selectedMeasurementId={selectedMeasurementId}
              onAddMeasurement={handleAddMeasurement}
              onUpdateMeasurement={handleUpdateMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
              onSelectMeasurement={setSelectedMeasurementId}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Plan Selected</h3>
                <p className="text-gray-600">Please select a plan to begin takeoff</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Panel */}
        {showSummary && (
          <div className="w-96 bg-white border-l overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Takeoff Summary</h3>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {measurements.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {measurements.filter(m => m.type === "area").reduce((sum, m) => sum + m.value, 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Total Area (sq ft)</div>
                  </CardContent>
                </Card>
              </div>

              {/* Division Totals */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Division Totals</h4>
                {Object.entries(totalsByDivision).map(([division, totals]) => (
                  <Card key={division}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{division}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1 text-sm">
                        {totals.line > 0 && (
                          <div className="flex justify-between">
                            <span>Linear:</span>
                            <span className="font-medium">{totals.line.toFixed(2)} ft</span>
                          </div>
                        )}
                        {totals.area > 0 && (
                          <div className="flex justify-between">
                            <span>Area:</span>
                            <span className="font-medium">{totals.area.toFixed(2)} sq ft</span>
                          </div>
                        )}
                        {totals.count > 0 && (
                          <div className="flex justify-between">
                            <span>Count:</span>
                            <span className="font-medium">{totals.count} ea</span>
                          </div>
                        )}
                        {totals.text > 0 && (
                          <div className="flex justify-between">
                            <span>Notes:</span>
                            <span className="font-medium">{totals.text}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Export Takeoff</h3>
            <div className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: "pdf" | "excel" | "csv") => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={saving}
                >
                  {saving ? "Exporting..." : "Export"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
