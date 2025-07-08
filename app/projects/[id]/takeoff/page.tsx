"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Upload, Ruler, Square, Undo2, Redo2, Download, MousePointerClick, Trash2 } from "lucide-react";
import TakeoffCanvas, { DrawingMode, Measurement, MeasurementType } from "@/app/components/TakeoffCanvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSession } from "next-auth/react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Remove mock plan data and add real plan fetching
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

// Set PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ProjectTakeoffModern({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("select")
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null)
  const [scale, setScale] = useState({ pixels: 100, units: 1, unitType: "ft" })
  const [materials, setMaterials] = useState([
    { id: "1", name: "Concrete", unit: "sq ft", price: 8.50 },
    { id: "2", name: "Lumber", unit: "linear ft", price: 2.25 },
    { id: "3", name: "Drywall", unit: "sq ft", price: 1.75 },
    { id: "4", name: "Paint", unit: "sq ft", price: 0.85 },
  ])
  const [measurementMaterials, setMeasurementMaterials] = useState<Record<string, string>>({})
  
  // Real plan data
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  // PDF state
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(900);
  const [pdfHeight, setPdfHeight] = useState(600);

  // Store measurements per page
  const [pageMeasurements, setPageMeasurements] = useState<Record<number, Measurement[]>>({});

  // Fetch measurements for the selected plan
  const fetchMeasurements = useCallback(async () => {
    if (!selectedPlanId) return;
    try {
      const res = await fetch(`/api/projects/${params.id}/takeoff?planId=${selectedPlanId}`);
      if (res.ok) {
        const data = await res.json();
        setMeasurements(
          data.map((m: any) => ({
            id: m.id,
            type: m.type,
            points: typeof m.points === "string" ? JSON.parse(m.points) : m.points,
          }))
        );
      } else {
        setMeasurements([]);
      }
    } catch {
      setMeasurements([]);
    }
  }, [params.id, selectedPlanId]);

  // Fetch plans for this project
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/plans`)
        if (response.ok) {
          const plansData = await response.json()
          setPlans(plansData)
          if (plansData.length > 0) {
            setSelectedPlanId(plansData[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [params.id])

  // When measurements change, update for current page
  useEffect(() => {
    setPageMeasurements((prev) => ({ ...prev, [currentPage]: measurements }));
  }, [measurements, currentPage]);

  // When page changes, load measurements for that page
  useEffect(() => {
    setMeasurements(pageMeasurements[currentPage] || []);
  }, [currentPage]);

  // PDF page change handler
  const handlePageChange = (offset: number) => {
    setCurrentPage((prev) => {
      let next = prev + offset;
      if (next < 1) next = 1;
      if (next > pdfPageCount) next = pdfPageCount;
      return next;
    });
  };

  // Add a new measurement (from canvas)
  const handleAddMeasurement = async (type: MeasurementType, points: number[]) => {
    // Optimistically add to UI
    const tempId = `${type}-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMeasurements((prev) => [
      ...prev,
      { id: tempId, type, points },
    ]);
    // Save to backend
    try {
      const res = await fetch(`/api/projects/${params.id}/takeoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          type,
          points: JSON.stringify(points),
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMeasurements((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: saved.id } : m))
        );
      }
    } catch {
      // Optionally show error
    }
  };

  // Delete a measurement
  const handleDeleteMeasurement = async (id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    if (selectedMeasurementId === id) setSelectedMeasurementId(null);
    // Delete from backend
    try {
      await fetch(`/api/projects/${params.id}/takeoff?measurementId=${id}`, {
        method: "DELETE",
      });
    } catch {}
  };

  // Select a measurement
  const handleSelectMeasurement = (id: string) => {
    setSelectedMeasurementId(id);
  };

  // Export measurements as CSV
  const handleExportCSV = () => {
    if (measurements.length === 0) return;
    const rows = [
      ["Type", "Value (px or px²)", "Points"],
      ...measurements.map((m) => {
        let value = "";
        if (m.type === "line") {
          value = getLineLength(m.points).toFixed(2);
        } else if (m.type === "area") {
          value = getPolygonArea(m.points).toFixed(2);
        }
        return [m.type, value, JSON.stringify(m.points)];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takeoff-${selectedPlanId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export measurements as PDF
  const handleExportPDF = () => {
    if (measurements.length === 0) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Takeoff Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Project: ${params.id}`, 20, 30);
    doc.text(`Plan: ${selectedPlanId}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    
    // Summary table
    const lineMeasurements = measurements.filter(m => m.type === "line");
    const areaMeasurements = measurements.filter(m => m.type === "area");
    
    const totalLineLength = lineMeasurements.reduce((sum, m) => sum + getLineLength(m.points), 0);
    const totalArea = areaMeasurements.reduce((sum, m) => sum + getPolygonArea(m.points), 0);
    
    autoTable(doc, {
      startY: 70,
      head: [["Type", "Count", "Total Value"]],
      body: [
        ["Lines", lineMeasurements.length.toString(), `${totalLineLength.toFixed(2)} px`],
        ["Areas", areaMeasurements.length.toString(), `${totalArea.toFixed(2)} px²`],
        ["Total", measurements.length.toString(), ""]
      ],
      theme: "grid"
    });
    
    // Detailed measurements table
    const tableData = measurements.map((m, index) => {
      let value = "";
      if (m.type === "line") {
        value = `${getLineLength(m.points).toFixed(2)} px`;
      } else if (m.type === "area") {
        value = `${getPolygonArea(m.points).toFixed(2)} px²`;
      }
      
      const materialId = measurementMaterials[m.id];
      const material = materials.find(mat => mat.id === materialId);
      const materialName = material ? material.name : "None";
      
      const pixelValue = m.type === "line" ? getLineLength(m.points) : getPolygonArea(m.points);
      const realValue = (pixelValue * scale.units) / scale.pixels;
      const cost = material ? realValue * material.price : 0;
      
      return [`${index + 1}`, m.type, value, materialName, `$${cost.toFixed(2)}`];
    });
    
    autoTable(doc, {
      startY: 120,
      head: [["#", "Type", "Value", "Material", "Cost"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add total cost
    const totalCost = calculateTotalCost();
    doc.setFontSize(14);
    doc.text(`Total Estimated Cost: $${totalCost.toFixed(2)}`, 20, 200);
    
    // Save the PDF
    doc.save(`takeoff-report-${selectedPlanId}.pdf`);
  };

  // Export annotated plan image
  const handleExportImage = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Create a temporary link to download the canvas as image
    const link = document.createElement("a");
    link.download = `takeoff-annotated-${selectedPlanId}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert pixel measurements to real-world units
  const convertToRealUnits = (pixelValue: number): string => {
    const realValue = (pixelValue * scale.units) / scale.pixels;
    return `${realValue.toFixed(2)} ${scale.unitType}`;
  };

  // Calculate total cost
  const calculateTotalCost = (): number => {
    return measurements.reduce((total, measurement) => {
      const materialId = measurementMaterials[measurement.id];
      if (!materialId) return total;
      
      const material = materials.find(m => m.id === materialId);
      if (!material) return total;
      
      const pixelValue = measurement.type === "line" 
        ? getLineLength(measurement.points)
        : getPolygonArea(measurement.points);
      
      const realValue = (pixelValue * scale.units) / scale.pixels;
      return total + (realValue * material.price);
    }, 0);
  };

  // Utility functions for measurement calculations
  function getLineLength(points: number[]): number {
    let length = 0;
    for (let i = 2; i < points.length; i += 2) {
      const dx = points[i] - points[i - 2];
      const dy = points[i + 1] - points[i - 1];
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  function getPolygonArea(points: number[]): number {
    let area = 0;
    const n = points.length / 2;
    for (let i = 0; i < n; i++) {
      const x1 = points[2 * i];
      const y1 = points[2 * i + 1];
      const x2 = points[2 * ((i + 1) % n)];
      const y2 = points[2 * ((i + 1) % n) + 1];
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area / 2);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900 text-white shadow">
        <div className="font-bold text-xl">Project Name / {selectedPlan?.title}</div>
        <div className="flex items-center gap-4">
          <button className="bg-slate-800 px-3 py-1 rounded hover:bg-slate-700">Back to Projects</button>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">U</div>
        </div>
      </header>

      {/* Toolbar */}
      <nav className="flex items-center gap-4 px-8 py-3 bg-white shadow-sm border-b">
        <button
          className={`p-2 rounded ${drawingMode === "select" ? "bg-blue-200" : "hover:bg-blue-100"}`}
          title="Select"
          onClick={() => setDrawingMode("select")}
        >
          <MousePointerClick className="w-5 h-5" />
        </button>
        <button
          className={`p-2 rounded ${drawingMode === "line" ? "bg-blue-200" : "hover:bg-blue-100"}`}
          title="Draw Line"
          onClick={() => setDrawingMode("line")}
        >
          <Ruler className="w-5 h-5" />
        </button>
        <button
          className={`p-2 rounded ${drawingMode === "area" ? "bg-blue-200" : "hover:bg-blue-100"}`}
          title="Draw Area"
          onClick={() => setDrawingMode("area")}
        >
          <Square className="w-5 h-5" />
        </button>
        <button className="p-2 rounded hover:bg-blue-100" title="Upload Plan"><Upload className="w-5 h-5" /></button>
        <button className="p-2 rounded hover:bg-blue-100" title="Export"><Download className="w-5 h-5" /></button>
        <button className="p-2 rounded hover:bg-blue-100" title="Undo"><Undo2 className="w-5 h-5" /></button>
        <button className="p-2 rounded hover:bg-blue-100" title="Redo"><Redo2 className="w-5 h-5" /></button>
      </nav>

      {/* Plan Thumbnails */}
      <div className="flex gap-2 px-8 py-2 bg-gray-50 border-b">
        {loading ? (
          <div className="text-center py-4">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-4">No plans found for this project.</div>
        ) : (
          plans.map((plan) => (
            <button
              key={plan.id}
              className={`w-16 h-12 rounded shadow flex items-center justify-center text-sm font-medium ${selectedPlanId === plan.id ? "bg-blue-200 border-2 border-blue-500" : "bg-gray-200"}`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {plan.title}
            </button>
          ))
        )}
        <button className="w-16 h-12 bg-blue-100 rounded shadow flex items-center justify-center text-blue-600 font-bold text-2xl">+</button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-3xl h-[600px] bg-white rounded-lg shadow-lg flex items-center justify-center">
            {/* PDF Plan Background */}
            {selectedPlan && selectedPlan.fileType === 'application/pdf' && (
              <Document
                file={selectedPlan.fileUrl}
                onLoadSuccess={({ numPages }) => setPdfPageCount(numPages)}
                loading={<div>Loading PDF...</div>}
                className="absolute top-0 left-0 w-full h-full z-0"
              >
                <Page
                  pageNumber={currentPage}
                  width={pdfWidth}
                  onRenderSuccess={({ width, height }) => {
                    setPdfWidth(width || 900);
                    setPdfHeight(height || 600);
                  }}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
            )}
            {/* Drawing Canvas Overlay */}
            {selectedPlan && selectedPlan.fileType === 'application/pdf' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: pdfWidth, height: pdfHeight, pointerEvents: 'auto' }}>
                <TakeoffCanvas
                  width={pdfWidth}
                  height={pdfHeight}
                  backgroundImageUrl={undefined} // No image, PDF is rendered below
                  mode={drawingMode}
                  measurements={measurements}
                  selectedMeasurementId={selectedMeasurementId}
                  onAddMeasurement={handleAddMeasurement}
                  onSelectMeasurement={handleSelectMeasurement}
                />
              </div>
            )}
            {/* If not PDF, fallback to image rendering */}
            {selectedPlan && selectedPlan.fileType !== 'application/pdf' && (
              <TakeoffCanvas
                width={900}
                height={600}
                backgroundImageUrl={selectedPlan.fileUrl}
                mode={drawingMode}
                measurements={measurements}
                selectedMeasurementId={selectedMeasurementId}
                onAddMeasurement={handleAddMeasurement}
                onSelectMeasurement={handleSelectMeasurement}
              />
            )}
          </div>
        </main>
        {/* PDF Page Navigation */}
        {selectedPlan && selectedPlan.fileType === 'application/pdf' && pdfPageCount > 1 && (
          <div className="flex justify-center items-center gap-4 mt-2">
            <button onClick={() => handlePageChange(-1)} disabled={currentPage === 1} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
            <span>Page {currentPage} of {pdfPageCount}</span>
            <button onClick={() => handlePageChange(1)} disabled={currentPage === pdfPageCount} className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
          </div>
        )}
        {/* Sidebar */}
        <aside className="w-96 bg-white border-l shadow-lg p-6 flex flex-col gap-6">
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Summary</h2>
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex justify-between mb-2">
                <span>Lines:</span>
                <span className="font-medium">{measurements.filter(m => m.type === "line").length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Areas:</span>
                <span className="font-medium">{measurements.filter(m => m.type === "area").length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Total Length:</span>
                <span className="font-medium">
                  {(() => {
                    const pixelValue = measurements
                      .filter(m => m.type === "line")
                      .reduce((sum, m) => sum + getLineLength(m.points), 0);
                    return `${pixelValue.toFixed(2)} px (${convertToRealUnits(pixelValue)})`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Area:</span>
                <span className="font-medium">
                  {(() => {
                    const pixelValue = measurements
                      .filter(m => m.type === "area")
                      .reduce((sum, m) => sum + getPolygonArea(m.points), 0);
                    return `${pixelValue.toFixed(2)} px² (${convertToRealUnits(pixelValue)}²)`;
                  })()}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Measurements</h2>
            <div className="space-y-2">
              {measurements.length === 0 && <div className="text-gray-500">No measurements yet</div>}
              {measurements.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer ${selectedMeasurementId === m.id ? "bg-blue-100 border border-blue-400" : "hover:bg-gray-100"}`}
                  onClick={() => handleSelectMeasurement(m.id)}
                >
                  <span className="font-medium text-gray-800">{m.type === "line" ? "Line" : "Area"}</span>
                  <button
                    className="ml-2 p-1 rounded hover:bg-red-100"
                    onClick={e => { e.stopPropagation(); handleDeleteMeasurement(m.id); }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Info</h2>
            {selectedMeasurementId ? (
              (() => {
                const measurement = measurements.find(m => m.id === selectedMeasurementId);
                if (!measurement) return <div className="text-gray-500">Measurement not found</div>;
                
                const value = measurement.type === "line" 
                  ? `${getLineLength(measurement.points).toFixed(2)} px`
                  : `${getPolygonArea(measurement.points).toFixed(2)} px²`;
                
                return (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900 capitalize">{measurement.type}</span>
                      <button
                        className="p-1 rounded hover:bg-red-100"
                        onClick={() => handleDeleteMeasurement(measurement.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">
                          {(() => {
                            const pixelValue = measurement.type === "line" 
                              ? getLineLength(measurement.points)
                              : getPolygonArea(measurement.points);
                            const unit = measurement.type === "line" ? "px" : "px²";
                            const realUnit = measurement.type === "line" ? scale.unitType : `${scale.unitType}²`;
                            return `${pixelValue.toFixed(2)} ${unit} (${convertToRealUnits(pixelValue)}${measurement.type === "area" ? "²" : ""})`;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-medium">{measurement.points.length / 2}</span>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <select
                          value={measurementMaterials[measurement.id] || ""}
                          onChange={(e) => setMeasurementMaterials(prev => ({
                            ...prev,
                            [measurement.id]: e.target.value
                          }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select material...</option>
                          {materials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.name} (${material.price}/{material.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      {measurementMaterials[measurement.id] && (() => {
                        const material = materials.find(m => m.id === measurementMaterials[measurement.id]);
                        if (!material) return null;
                        
                        const pixelValue = measurement.type === "line" 
                          ? getLineLength(measurement.points)
                          : getPolygonArea(measurement.points);
                        const realValue = (pixelValue * scale.units) / scale.pixels;
                        const cost = realValue * material.price;
                        
                        return (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <div className="text-sm font-medium text-green-800">
                              Cost: ${cost.toFixed(2)}
                            </div>
                            <div className="text-xs text-green-600">
                              {realValue.toFixed(2)} {material.unit} × ${material.price}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-gray-500">Select a measurement to view details</div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Materials</h2>
            <div className="space-y-2">
              {materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{material.name}</div>
                    <div className="text-xs text-gray-500">${material.price}/{material.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Cost Estimate</h2>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <div className="text-2xl font-bold text-green-800">
                ${calculateTotalCost().toFixed(2)}
              </div>
              <div className="text-sm text-green-600">Total estimated cost</div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Scale</h2>
            <div className="bg-gray-50 p-3 rounded space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scale</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={scale.pixels}
                    onChange={(e) => setScale(prev => ({ ...prev, pixels: Number(e.target.value) }))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                  />
                  <span className="text-sm text-gray-600">px =</span>
                  <input
                    type="number"
                    value={scale.units}
                    onChange={(e) => setScale(prev => ({ ...prev, units: Number(e.target.value) }))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0.1"
                    step="0.1"
                  />
                  <select
                    value={scale.unitType}
                    onChange={(e) => setScale(prev => ({ ...prev, unitType: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                    <option value="in">in</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Example: 100px = 1ft means 100 pixels on screen equals 1 foot in reality
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Export</h2>
            <button onClick={handleExportCSV} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Export CSV</button>
            <button onClick={handleExportPDF} className="w-full bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700">Export PDF</button>
            <button onClick={handleExportImage} className="w-full bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700">Export Image</button>
          </div>
          <div>
            <h2 className="font-semibold text-lg mb-2">Summary</h2>
            <div className="text-gray-500">[Summary Table Placeholder]</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

