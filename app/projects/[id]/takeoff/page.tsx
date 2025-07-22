"use client"

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import SimplePDFViewer from "@/app/components/SimplePDFViewer";

// Types
type Plan = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

type LineItem = {
  id: string;
  division: string;
  description: string;
  quantity: number;
  unit: 'sq ft' | 'linear ft';
  pricePerUnit: number;
  total: number;
}

type ConstructionDivision = {
  code: string;
  name: string;
}

// Import divisions and subcategories from constants
import { DIVISIONS, DIVISION_SUBCATEGORIES } from "@/lib/constants";

// Construction divisions (matching constants)
const CONSTRUCTION_DIVISIONS: ConstructionDivision[] = Object.entries(DIVISIONS).map(([code, name]) => ({
  code,
  name
}));

export default function ProjectTakeoffPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Fetch plans for this project
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/plans`);
        if (response.ok) {
          const plansData = await response.json();
          setPlans(plansData);
          if (plansData.length > 0) {
            setSelectedPlanId(plansData[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [params.id]);

  // Filter line items by selected division
  const filteredLineItems = selectedDivision === "all" 
    ? lineItems 
    : lineItems.filter(item => item.division === selectedDivision);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Get division totals
  const divisionTotals = CONSTRUCTION_DIVISIONS.reduce((acc, division) => {
    const divisionItems = lineItems.filter(item => item.division === division.code);
    acc[division.code] = divisionItems.reduce((sum, item) => sum + item.total, 0);
    return acc;
  }, {} as Record<string, number>);

  // Get divisions that have line items
  const activeDivisions = CONSTRUCTION_DIVISIONS.filter(division => 
    lineItems.some(item => item.division === division.code)
  );

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      division: "",
      description: "",
      quantity: 0,
      unit: 'sq ft',
      pricePerUnit: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
    setShowAddForm(true);
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate total
        updated.total = updated.quantity * updated.pricePerUnit;
        return updated;
      }
      return item;
    }));
  };

  // Delete line item
  const deleteLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Division', 'Description', 'Quantity', 'Unit', 'Price Per Unit', 'Total'];
    const csvContent = [
      headers.join(','),
      ...lineItems.map(item => [
        item.division,
        `"${item.description}"`,
        item.quantity,
        item.unit,
        item.pricePerUnit,
        item.total
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takeoff-${params.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Upload plan functionality
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload file to Vercel Blob
      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      const { fileUrl, fileType } = uploadResult;

      // Step 2: Create plan record
      const planResponse = await fetch(`/api/projects/${params.id}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: uploadTitle,
          description: uploadDescription,
          fileUrl,
          fileType,
        }),
      });

      if (planResponse.ok) {
        const newPlan = await planResponse.json();
        setPlans([...plans, newPlan]);
        setSelectedPlanId(newPlan.id);
        setShowUploadForm(false);
        setUploadTitle("");
        setUploadDescription("");
        setUploadFile(null);
      } else {
        const errorData = await planResponse.json();
        throw new Error(errorData.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Takeoff</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Viewer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No plans uploaded yet</p>
                <p className="text-sm mb-4">Upload plans to start your takeoff</p>
                <Button 
                  onClick={() => setShowUploadForm(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Plans
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Select value={selectedPlanId || ""} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
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
                  <Button 
                    onClick={() => setShowUploadForm(true)} 
                    size="sm"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload More
                  </Button>
                </div>

                {selectedPlan && (
                  <div className="border rounded-lg bg-gray-50">
                    <div className="p-4 border-b bg-white">
                      <h3 className="font-semibold">{selectedPlan.title}</h3>
                      {selectedPlan.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
                      )}
                    </div>
                    <div className="h-96">
                      <SimplePDFViewer 
                        fileUrl={selectedPlan.fileUrl} 
                        title={selectedPlan.title}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Line Items</span>
              <Button onClick={addLineItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No line items yet</p>
                <p className="text-sm">Click "Add Item" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Division Tabs */}
                <div className="border-b">
                  <div className="flex space-x-1 overflow-x-auto pb-2">
                    {/* All Items Tab */}
                    <button
                      onClick={() => setSelectedDivision("all")}
                      className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                        selectedDivision === "all"
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All Items
                      {lineItems.length > 0 && (
                        <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                          {lineItems.length}
                        </span>
                      )}
                    </button>
                    
                    {/* Division Tabs */}
                    {activeDivisions.map((division) => (
                      <button
                        key={division.code}
                        onClick={() => setSelectedDivision(division.code)}
                        className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                          selectedDivision === division.code
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {division.code} - {division.name}
                        {divisionTotals[division.code] > 0 && (
                          <span className="ml-2 bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
                            ${divisionTotals[division.code].toFixed(0)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Division Summary */}
                {selectedDivision !== "all" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      {CONSTRUCTION_DIVISIONS.find(d => d.code === selectedDivision)?.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">
                        {filteredLineItems.length} item{filteredLineItems.length !== 1 ? 's' : ''}
                      </span>
                      <span className="font-bold text-blue-900">
                        ${divisionTotals[selectedDivision]?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Line Items List */}
                {filteredLineItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        {/* Division */}
                        <div>
                          <Label htmlFor={`division-${item.id}`}>Division</Label>
                          <Select 
                            value={item.division} 
                            onValueChange={(value) => updateLineItem(item.id, 'division', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONSTRUCTION_DIVISIONS.map((div) => (
                                <SelectItem key={div.code} value={div.code}>
                                  {div.code} - {div.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Description */}
                        <div>
                          <Label htmlFor={`description-${item.id}`}>Description</Label>
                          <Input
                            id={`description-${item.id}`}
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            placeholder="Enter description"
                          />
                        </div>

                        {/* Quantity and Unit */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                            <Input
                              id={`quantity-${item.id}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                            <Select 
                              value={item.unit} 
                              onValueChange={(value: 'sq ft' | 'linear ft') => updateLineItem(item.id, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sq ft">Square Feet</SelectItem>
                                <SelectItem value="linear ft">Linear Feet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Price Per Unit */}
                        <div>
                          <Label htmlFor={`price-${item.id}`}>Price Per Unit</Label>
                          <Input
                            id={`price-${item.id}`}
                            type="number"
                            step="0.01"
                            value={item.pricePerUnit}
                            onChange={(e) => updateLineItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>

                        {/* Total */}
                        <div className="bg-gray-50 p-3 rounded">
                          <Label>Total</Label>
                          <div className="text-lg font-semibold">
                            ${item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLineItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  {selectedDivision === "all" ? (
                    <>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%):</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Division Total:</span>
                        <span>${divisionTotals[selectedDivision]?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Project Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Project Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Plan Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Upload Plan</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-title">Plan Title *</Label>
                <Input
                  id="plan-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter plan title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="plan-description">Description (Optional)</Label>
                <Input
                  id="plan-description"
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter plan description"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="plan-file">PDF File *</Label>
                <Input
                  id="plan-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Only PDF files are supported</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadTitle("");
                    setUploadDescription("");
                    setUploadFile(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile || !uploadTitle.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

