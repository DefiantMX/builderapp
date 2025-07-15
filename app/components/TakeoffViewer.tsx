"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Document, Page } from "react-pdf"
import { pdfjs } from "react-pdf"
import { Ruler, Move, Square, Save, Pencil, Trash2 } from "lucide-react"
import { Button } from '@/components/ui/button'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Plan } from "@prisma/client"

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  // Try to disable worker for testing
  try {
    // Option 1: Try using a local worker
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  } catch (error) {
    console.error('Failed to set local PDF worker:', error);
    try {
      // Option 2: Try jsdelivr CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    } catch (fallbackError) {
      console.error('Failed to set PDF worker with jsdelivr:', fallbackError);
      try {
        // Option 3: Try unpkg
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      } catch (finalError) {
        console.error('Failed to set PDF worker with unpkg:', finalError);
        // Option 4: Final fallback to original CDN
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }
    }
  }
}

type Point = {
  x: number
  y: number
}

type Measurement = {
  id: number
  planId: number
  type: "length" | "area"
  label: string
  value: number
  unit: string
  points: Point[]
  materialType?: string
  pricePerUnit?: number
}

type TakeoffViewerProps = {
  plan: Plan
  measurements: Measurement[]
  onMeasurementSave: (measurement: Omit<Measurement, "id">) => void
  onMeasurementUpdate?: (id: number, updates: Partial<Measurement>) => void
  onMeasurementDelete?: (id: number) => void
}

const SCALE_FACTOR = 0.0254 // 1 pixel = 0.0254 meters (approximate)

// Add scale options
const SCALE_OPTIONS = [
  { label: "1/4\" = 1'-0\"", value: 48 },    // 1:48
  { label: "1/8\" = 1'-0\"", value: 96 },    // 1:96
  { label: "3/16\" = 1'-0\"", value: 64 },   // 1:64
  { label: "3/32\" = 1'-0\"", value: 128 },  // 1:128
  { label: "1/16\" = 1'-0\"", value: 192 },  // 1:192
  { label: "1/32\" = 1'-0\"", value: 384 },  // 1:384
  { label: "1\" = 1'-0\"", value: 12 },      // 1:12
  { label: "1/2\" = 1'-0\"", value: 24 },    // 1:24
];

// Add material options
const MATERIAL_OPTIONS = [
  { label: "Siding", value: "siding", defaultPrice: 8.50 },
  { label: "Concrete", value: "concrete", defaultPrice: 12.00 },
  { label: "Roofing", value: "roofing", defaultPrice: 5.75 },
  { label: "Flooring", value: "flooring", defaultPrice: 3.50 },
  { label: "Drywall", value: "drywall", defaultPrice: 2.25 },
  { label: "Insulation", value: "insulation", defaultPrice: 1.75 },
  { label: "Paint", value: "paint", defaultPrice: 2.00 },
  { label: "Tile", value: "tile", defaultPrice: 4.50 },
  { label: "Carpet", value: "carpet", defaultPrice: 3.00 },
  { label: "Custom", value: "custom", defaultPrice: 0 }
];

export default function TakeoffViewer({ plan, measurements, onMeasurementSave, onMeasurementUpdate, onMeasurementDelete }: TakeoffViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [measuring, setMeasuring] = useState(false)
  const [measurementType, setMeasurementType] = useState<'length' | 'area'>('length')
  const [points, setPoints] = useState<Point[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [measurementLabel, setMeasurementLabel] = useState("")
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFinishingArea, setIsFinishingArea] = useState(false)
  const [archScale, setArchScale] = useState<number>(48) // Default to 1/4" = 1'-0"
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [pricePerUnit, setPricePerUnit] = useState<number>(0)
  const [showPricingInput, setShowPricingInput] = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<string>("")
  const [editingPrice, setEditingPrice] = useState<number>(0)
  const [editingPoints, setEditingPoints] = useState<boolean>(false)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(-1)

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true)
        console.log('Fetching PDF from:', plan.fileUrl);
        
        // Test if the URL is accessible
        const testResponse = await fetch(plan.fileUrl, { method: 'HEAD' });
        console.log('PDF URL test response:', testResponse.status, testResponse.statusText);
        
        const response = await fetch(plan.fileUrl)
        console.log('PDF fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
        }
        const blob = await response.blob()
        console.log('PDF blob size:', blob.size, 'bytes');
        if (blob.size === 0) {
          throw new Error('PDF blob is empty (0 bytes)');
        }
        const dataUrl = URL.createObjectURL(blob)
        console.log('PDF data URL created:', dataUrl.substring(0, 50) + '...');
        setPdfData(dataUrl)
        setError(null)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError(`Error loading PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPdf()
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData)
      }
    }
  }, [plan.fileUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const context = canvas.getContext("2d")
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        drawMeasurements(context)
        drawCurrentMeasurement(context)
      }
    }
  }, [measurements, points, scale])

  // Function to convert pixels to feet based on architectural scale
  const pixelsToFeet = (pixels: number) => {
    return (pixels / (72 * scale)) * (archScale / 12);
  };

  // Function to convert square pixels to square feet
  const squarePixelsToSquareFeet = (squarePixels: number) => {
    const scaleFactor = archScale / 12;
    return (squarePixels / (72 * 72 * scale * scale)) * (scaleFactor * scaleFactor);
  };

  function calculatePolygonArea(points: Point[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      // Account for scale in the area calculation
      area += (points[i].x) * (points[j].y);
      area -= (points[j].x) * (points[i].y);
    }
    return Math.abs(area / 2);
  }

  // Updated finishAreaMeasurement function
  const finishAreaMeasurement = useCallback(() => {
    if (points.length < 3) return;
    
    const allPoints = [...points, points[0]]; // Close the polygon
    const area = calculatePolygonArea(allPoints);
    const sqFeet = squarePixelsToSquareFeet(area);
    
    const newMeasurement = {
      planId: plan.id,
      type: 'area' as const,
      label: `Area ${measurements.length + 1}`,
      value: sqFeet,
      unit: 'sq ft',
      points: allPoints.map(p => ({ x: p.x, y: p.y })), // Store unscaled coordinates
      materialType: selectedMaterial,
      pricePerUnit: pricePerUnit || MATERIAL_OPTIONS.find(opt => opt.value === selectedMaterial)?.defaultPrice || 0
    };

    onMeasurementSave(newMeasurement);

    // Reset the measurement state
    setPoints([]);
    setMeasuring(false);
    setIsFinishingArea(false);
    setSelectedMaterial("");
    setPricePerUnit(0);
    setShowPricingInput(false);
  }, [points, plan.id, measurements.length, onMeasurementSave, selectedMaterial, pricePerUnit, scale, archScale]);

  // Updated keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key); // Debug log
      console.log('Current state:', { measuring, measurementType, pointsLength: points.length }); // Debug log
      
      if (e.key === 'Enter' && measuring && measurementType === 'area' && points.length >= 3) {
        e.preventDefault(); // Prevent form submission if any
        console.log('Attempting to save area measurement...'); // Debug log
        finishAreaMeasurement();
      } else if (e.key === 'Escape') {
        // Cancel measurement
        setPoints([]);
        setMeasuring(false);
        setIsFinishingArea(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [measuring, measurementType, points, finishAreaMeasurement]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('Document loaded successfully with', numPages, 'pages');
    setNumPages(numPages)
    setPageNumber(1)
  }

  function onPageLoadSuccess({ width, height }: { width: number; height: number }) {
    // Defensive: log and fallback for invalid width/height/scale
    console.log('onPageLoadSuccess width:', width, 'height:', height, 'scale:', scale);
    let safeWidth = (typeof width === 'number' && width > 0 && isFinite(width)) ? width : 800;
    let safeHeight = (typeof height === 'number' && height > 0 && isFinite(height)) ? height : 600;
    let safeScale = (typeof scale === 'number' && scale > 0 && isFinite(scale)) ? scale : 1;
    console.log('Using safe dimensions:', { safeWidth, safeHeight, safeScale });
    setPageDimensions({ width: safeWidth, height: safeHeight });
    // Update canvas dimensions
    if (canvasRef.current) {
      canvasRef.current.width = safeWidth * safeScale;
      canvasRef.current.height = safeHeight * safeScale;
      console.log('Canvas dimensions set to:', canvasRef.current.width, 'x', canvasRef.current.height);
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawMeasurements(context);
        drawCurrentMeasurement(context);
      }
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!measuring || !canvasRef.current || !pageDimensions) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // Calculate the scale factor between canvas display size and actual size
    const scaleFactorX = canvas.width / rect.width
    const scaleFactorY = canvas.height / rect.height

    // Get click coordinates relative to canvas display size
    const displayX = e.clientX - rect.left
    const displayY = e.clientY - rect.top

    // Convert to actual canvas coordinates, accounting for zoom scale
    const x = (displayX * scaleFactorX) / scale
    const y = (displayY * scaleFactorY) / scale

    if (measurementType === 'length') {
      setPoints([...points, { x, y }])
      
      if (points.length === 1) {
        // Calculate length measurement
        const dx = x - points[0].x
        const dy = y - points[0].y
        const pixelLength = Math.sqrt(dx * dx + dy * dy)
        const feet = pixelsToFeet(pixelLength);

        const newMeasurement = {
          planId: plan.id,
          type: 'length' as const,
          label: `Length ${measurements.length + 1}`,
          value: feet,
          unit: 'ft',
          points: [...points, { x, y }],
        };

        onMeasurementSave(newMeasurement);
        setPoints([]);
        setMeasuring(false);
      }
    } else if (measurementType === 'area') {
      setPoints([...points, { x, y }])
      if (points.length >= 2) {
        setIsFinishingArea(true)
      }
    }
  }

  // Function to calculate the center point of a set of points
  function getCenterPoint(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  // Updated drawMeasurements function to ensure measurements are visible
  function drawMeasurements(context: CanvasRenderingContext2D) {
    context.save();
    context.font = 'bold 14px Arial';
    context.lineWidth = 2;

    measurements.forEach((measurement) => {
      context.beginPath();
      context.strokeStyle = '#2563eb'; // blue-600
      context.fillStyle = '#2563eb';

      measurement.points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x * scale, point.y * scale);
        } else {
          context.lineTo(point.x * scale, point.y * scale);
        }
      });

      if (measurement.type === 'area') {
        context.closePath();
        context.stroke();

        // Calculate center point for label
        const center = getCenterPoint(measurement.points);
        
        // Draw measurement value
        const measurementLabel = `${measurement.value.toFixed(2)} ${measurement.unit}`;
        context.font = 'bold 14px Arial';
        const metrics = context.measureText(measurementLabel);
        
        // Background for measurement value
        context.fillStyle = 'white';
        context.fillRect(
          center.x * scale - metrics.width/2 - 4,
          center.y * scale - 28,
          metrics.width + 8,
          20
        );
        
        // Draw measurement value
        context.fillStyle = '#2563eb';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(measurementLabel, center.x * scale, center.y * scale - 18);

        // If material type and price exist, draw them
        if (measurement.materialType && measurement.pricePerUnit) {
          const materialLabel = `${measurement.materialType} - $${measurement.pricePerUnit.toFixed(2)}/sq ft`;
          const totalPrice = measurement.value * measurement.pricePerUnit;
          const priceLabel = `Total: $${totalPrice.toFixed(2)}`;
          
          context.font = '12px Arial';
          const materialMetrics = context.measureText(materialLabel);
          const priceMetrics = context.measureText(priceLabel);
          
          // Background for material and price
          context.fillStyle = 'white';
          context.fillRect(
            center.x * scale - Math.max(materialMetrics.width, priceMetrics.width)/2 - 4,
            center.y * scale - 4,
            Math.max(materialMetrics.width, priceMetrics.width) + 8,
            36
          );
          
          // Draw material type and price
          context.fillStyle = '#2563eb';
          context.fillText(materialLabel, center.x * scale, center.y * scale + 8);
          context.fillText(priceLabel, center.x * scale, center.y * scale + 24);
        }
      } else {
        // Length measurement
        context.stroke();
        
        // Calculate midpoint for label
        const start = measurement.points[0];
        const end = measurement.points[1];
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const label = `${measurement.value.toFixed(2)} ${measurement.unit}`;
        context.font = 'bold 14px Arial';
        const metrics = context.measureText(label);
        
        // Background for label
        context.fillStyle = 'white';
        context.fillRect(
          midX * scale - metrics.width/2 - 4,
          midY * scale - 10,
          metrics.width + 8,
          20
        );
        
        // Draw measurement text
        context.fillStyle = '#2563eb';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, midX * scale, midY * scale);
      }
    });

    context.restore();
  }

  function drawCurrentMeasurement(context: CanvasRenderingContext2D) {
    if (points.length === 0) return;

    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(points[0].x * scale, points[0].y * scale);
    points.forEach((point) => {
      context.lineTo(point.x * scale, point.y * scale);
    });

    if (measurementType === "area" && points.length >= 3) {
      context.lineTo(points[0].x * scale, points[0].y * scale);
      context.closePath();
      context.fillStyle = "rgba(239, 68, 68, 0.1)";
      context.fill();
    }

    context.strokeStyle = "#ef4444";
    context.lineWidth = 2;
    context.stroke();

    // Draw points
    points.forEach((point) => {
      context.beginPath();
      context.arc(point.x * scale, point.y * scale, 4, 0, 2 * Math.PI);
      context.fillStyle = "#ef4444";
      context.fill();
    });

    // Draw current measurement value
    if (points.length >= 2) {
      let value: number;
      let unit: string;

      if (measurementType === "length") {
        const dx = points[points.length - 1].x - points[0].x;
        const dy = points[points.length - 1].y - points[0].y;
        const pixelLength = Math.sqrt(dx * dx + dy * dy);
        value = pixelsToFeet(pixelLength);
        unit = "ft";
      } else {
        const tempPoints = points.length >= 3 ? [...points, points[0]] : points;
        const area = calculatePolygonArea(tempPoints);
        value = squarePixelsToSquareFeet(area);
        unit = "sq ft";
      }

      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      
      const label = `${value.toFixed(2)} ${unit}`;
      context.font = "bold 14px Inter";
      const metrics = context.measureText(label);
      const padding = 4;

      context.fillStyle = "white";
      context.fillRect(
        centerX * scale + 5,
        centerY * scale + 5 - 14,
        metrics.width + padding * 2,
        22
      );
      
      context.fillStyle = "#ef4444";
      context.fillText(
        label,
        centerX * scale + 5 + padding,
        centerY * scale + 5
      );
    }
  }

  // Add function to handle measurement selection
  const handleMeasurementSelect = (measurement: Measurement) => {
    setSelectedMeasurement(measurement);
    setEditingMaterial(measurement.materialType || "");
    setEditingPrice(measurement.pricePerUnit || 0);
    setEditingPoints(false);
    setSelectedPointIndex(-1);
  };

  // Add function to handle measurement update
  const handleMeasurementUpdate = () => {
    if (!selectedMeasurement || !onMeasurementUpdate) return;
    
    onMeasurementUpdate(selectedMeasurement.id, {
      materialType: editingMaterial,
      pricePerUnit: editingPrice
    });
    
    setSelectedMeasurement(null);
    setEditingMaterial("");
    setEditingPrice(0);
  };

  // Add function to handle point dragging
  const handlePointDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editingPoints || !selectedMeasurement || selectedPointIndex === -1 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleFactorX = canvas.width / rect.width;
    const scaleFactorY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleFactorX / scale;
    const y = (e.clientY - rect.top) * scaleFactorY / scale;

    const updatedPoints = [...selectedMeasurement.points];
    updatedPoints[selectedPointIndex] = { x, y };

    if (selectedMeasurement.type === 'area' && 
        selectedPointIndex === 0 && 
        updatedPoints[updatedPoints.length - 1].x === selectedMeasurement.points[0].x) {
      updatedPoints[updatedPoints.length - 1] = { x, y };
    }

    let newValue: number;
    if (selectedMeasurement.type === 'length') {
      const dx = updatedPoints[1].x - updatedPoints[0].x;
      const dy = updatedPoints[1].y - updatedPoints[0].y;
      const pixelLength = Math.sqrt(dx * dx + dy * dy);
      newValue = pixelsToFeet(pixelLength);
    } else {
      const area = calculatePolygonArea(updatedPoints);
      newValue = squarePixelsToSquareFeet(area);
    }

    onMeasurementUpdate?.(selectedMeasurement.id, {
      points: updatedPoints,
      value: newValue
    });
  };

  // Add function to handle point selection
  const handlePointSelect = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editingPoints || !selectedMeasurement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleFactorX = canvas.width / rect.width;
    const scaleFactorY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleFactorX;
    const y = (e.clientY - rect.top) * scaleFactorY;

    // Find if we clicked near any point
    const pointIndex = selectedMeasurement.points.findIndex(point => {
      const dx = point.x - x;
      const dy = point.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 10; // 10px radius for selection
    });

    setSelectedPointIndex(pointIndex);
  };

  // Update canvas event handlers
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingPoints && selectedPointIndex !== -1) {
      handlePointDrag(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setSelectedPointIndex(-1);
  };

  // Add function to handle measurement deletion
  const handleMeasurementDelete = (e: React.MouseEvent, measurementId: number) => {
    e.stopPropagation(); // Prevent triggering measurement selection
    console.log('Handling measurement deletion:', measurementId); // Debug log
    if (onMeasurementDelete) {
      onMeasurementDelete(measurementId);
      if (selectedMeasurement?.id === measurementId) {
        setSelectedMeasurement(null);
        setEditingMaterial("");
        setEditingPrice(0);
        setEditingPoints(false);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading PDF...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
  }

  if (!pdfData) {
    return <div className="flex justify-center items-center h-64">No PDF data available</div>
  }

  // Simple test: render just the PDF without overlays
  const renderSimplePDF = () => (
    <div className="border-2 border-red-500 p-4" style={{ width: '100%' }}>
      <h3 className="text-lg font-bold mb-2">PDF Test (No Overlays)</h3>
      <div style={{ width: '100%', minHeight: '600px', display: 'flex', justifyContent: 'center' }}>
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex justify-center items-center h-64">Loading PDF...</div>}
          error={<div className="flex justify-center items-center h-64 text-red-500">Error loading PDF. Please try again.</div>}
        >
          <Page
            pageNumber={1}
            scale={2.0}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={<div className="flex justify-center items-center h-64">Loading page...</div>}
            onLoadSuccess={onPageLoadSuccess}
            onLoadError={(error) => {
              console.error('Page load error:', error);
            }}
          />
        </Document>
      </div>
    </div>
  );

  // Uncomment the line below to test simple PDF rendering
  return renderSimplePDF();

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="space-x-2 flex items-center">
          <Button
            variant={measuring && measurementType === 'length' ? 'default' : 'outline'}
            onClick={() => {
              setMeasuring(true)
              setMeasurementType('length')
              setPoints([])
              setIsFinishingArea(false)
            }}
          >
            <Ruler className="w-4 h-4 mr-2" />
            Measure Length
          </Button>
          <Button
            variant={measuring && measurementType === 'area' ? 'default' : 'outline'}
            onClick={() => {
              setMeasuring(true)
              setMeasurementType('area')
              setPoints([])
              setIsFinishingArea(false)
            }}
          >
            <Square className="w-4 h-4 mr-2" />
            Measure Area
          </Button>
          
          <div className="ml-4 flex items-center space-x-2">
            <span className="text-sm font-medium">Scale:</span>
            <select
              className="border rounded px-2 py-1 text-sm bg-background"
              value={archScale}
              onChange={(e) => setArchScale(Number(e.target.value))}
            >
              {SCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setScale(scale => Math.max(0.5, scale - 0.1))}
            disabled={scale <= 0.5}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            onClick={() => setScale(scale => Math.min(2.0, scale + 0.1))}
            disabled={scale >= 2.0}
          >
            Zoom In
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1 overflow-auto">
          <div className="relative border rounded-lg overflow-hidden bg-white h-full" ref={containerRef} style={{ minHeight: '400px' }}>
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex justify-center items-center h-64">Loading PDF...</div>}
              error={<div className="flex justify-center items-center h-64 text-red-500">Error loading PDF. Please try again.</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                loading={<div className="flex justify-center items-center h-64">Loading page...</div>}
                onLoadSuccess={onPageLoadSuccess}
                onLoadError={(error) => {
                  console.error('Page load error:', error);
                }}
              />
            </Document>
            <canvas
              ref={canvasRef}
              onClick={editingPoints ? handlePointSelect : handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
              style={{ 
                opacity: measuring || editingPoints ? 1 : 0.7,
                pointerEvents: measuring || editingPoints ? 'auto' : 'none',
                cursor: editingPoints ? 'pointer' : 'crosshair'
              }}
            />
          </div>
        </div>

        <div className="w-80 flex flex-col bg-white border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Measurement Summary</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Division Totals */}
            {measurements.length > 0 && (
              <div className="mb-6 border-b pb-4">
                <h4 className="font-medium mb-3">Division Totals</h4>
                {Object.entries(
                  measurements.reduce((acc, m) => {
                    if (m.type === 'area' && m.materialType && m.pricePerUnit) {
                      const total = m.value * m.pricePerUnit;
                      acc[m.materialType] = (acc[m.materialType] || 0) + total;
                    }
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([material, total]) => (
                  <div key={material} className="flex justify-between items-center py-1">
                    <span className="capitalize">{material}:</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span>
                    ${measurements
                      .filter(m => m.type === 'area' && m.materialType && m.pricePerUnit)
                      .reduce((sum, m) => sum + (m.value * m.pricePerUnit!), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Individual Measurements */}
            <div className="space-y-4">
              <h4 className="font-medium mb-2">Individual Measurements</h4>
              {measurements.map((measurement) => (
                <div 
                  key={measurement.id}
                  className={`relative p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMeasurement?.id === measurement.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleMeasurementSelect(measurement)}
                >
                  {onMeasurementDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Delete button clicked for measurement:', measurement.id); // Debug log
                        handleMeasurementDelete(e, measurement.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete measurement"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                  <div className="flex flex-col">
                    <div className="font-medium">{measurement.label}</div>
                    <div className="text-sm text-gray-600">
                      {measurement.value.toFixed(2)} {measurement.unit}
                    </div>
                    {measurement.materialType && (
                      <div className="text-sm text-gray-600">
                        {measurement.materialType} - ${measurement.pricePerUnit?.toFixed(2)}/sq ft
                      </div>
                    )}
                    {measurement.type === 'area' && measurement.materialType && measurement.pricePerUnit && (
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        Total: ${(measurement.value * measurement.pricePerUnit).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Panel */}
            {selectedMeasurement && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Edit Measurement</h4>
                  {selectedMeasurement.type === 'area' && (
                    <Button
                      variant={editingPoints ? 'default' : 'outline'}
                      onClick={() => setEditingPoints(!editingPoints)}
                      className="text-sm"
                    >
                      {editingPoints ? 'Done Editing' : 'Edit Points'}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material
                    </label>
                    <select
                      className="w-full border rounded px-2 py-1 text-sm bg-background"
                      value={editingMaterial}
                      onChange={(e) => {
                        setEditingMaterial(e.target.value);
                        const material = MATERIAL_OPTIONS.find(opt => opt.value === e.target.value);
                        if (material) {
                          setEditingPrice(material.defaultPrice);
                        }
                      }}
                    >
                      <option value="">Select Material</option>
                      {MATERIAL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - ${option.defaultPrice}/sq ft
                        </option>
                      ))}
                    </select>
                  </div>

                  {editingMaterial && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price per sq ft
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="border rounded px-2 py-1 text-sm w-full"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(Number(e.target.value))}
                          placeholder="Price per sq ft"
                        />
                        <span className="text-sm text-gray-600">/ sq ft</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMeasurement(null);
                        setEditingMaterial("");
                        setEditingPrice(0);
                        setEditingPoints(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMeasurementUpdate}
                      disabled={!editingMaterial || editingPrice <= 0}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {numPages && numPages > 1 && (
        <div className="flex justify-center items-center py-2 bg-white border-t">
          <Button
            variant="outline"
            onClick={() => setPageNumber(page => Math.max(1, page - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <span className="mx-4">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
            disabled={pageNumber >= numPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

