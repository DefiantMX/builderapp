"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Document, Page } from "react-pdf"
import { pdfjs } from "react-pdf"
import { Ruler, Move, Square, Save, Pencil, Trash2 } from "lucide-react"
import { Button } from '@/components/ui/button'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

import type { Plan } from "@prisma/client"

// Initialize PDF.js worker - simplified approach
if (typeof window !== 'undefined') {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  } catch (error) {
    console.error('Failed to set PDF worker:', error);
  }
}

type Point = {
  x: number
  y: number
}

type Measurement = {
  id: string
  planId: string
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
  onMeasurementUpdate?: (id: string, updates: Partial<Measurement>) => void
  onMeasurementDelete?: (id: string) => void
}

export default function TakeoffViewer({ plan, measurements, onMeasurementSave, onMeasurementUpdate, onMeasurementDelete }: TakeoffViewerProps) {
  // --- State Management ---
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // Measurement State
  const [measuring, setMeasuring] = useState(false);
  const [measurementType, setMeasurementType] = useState<'length' | 'area'>('length');
  const [points, setPoints] = useState<Point[]>([]);
  const [currentPos, setCurrentPos] = useState<Point | null>(null);

  // Editing State
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [editingPoints, setEditingPoints] = useState<boolean>(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(-1);

  // Calibration State
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [calibrationPixelLength, setCalibrationPixelLength] = useState<number | null>(null);
  const [calibrationInput, setCalibrationInput] = useState<string>("");
  const [calibrationUnit, setCalibrationUnit] = useState<'ft' | 'm' | 'in'>("ft");
  const [pixelToUnit, setPixelToUnit] = useState<number>(1); // real-world units per pixel
  const [calibrationModal, setCalibrationModal] = useState(false);

  // UI State
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [displayUnit, setDisplayUnit] = useState<'px' | 'ft' | 'in'>('px');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // --- PDF Loading ---
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;
    
    const fetchPdf = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching PDF from:', plan.fileUrl);
        const response = await fetch(plan.fileUrl);
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        
        const blob = await response.blob();
        if (blob.size === 0) throw new Error('PDF blob is empty');
        
        console.log('PDF blob size:', blob.size);
        // Create a new Blob URL
        objectUrl = URL.createObjectURL(blob);
        
        if (isMounted) {
          console.log('Setting PDF data URL');
          setPdfData(objectUrl);
          setError(null);
          setPdfLoaded(true);
        }
      } catch (err) {
        console.error('Error fetching PDF:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPdf();
    
    return () => {
      isMounted = false;
      // Clean up the object URL when component unmounts or URL changes
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [plan.fileUrl]);

  // --- Helper Functions ---
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas not available for mouse position');
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    console.log('Mouse position calculated:', { clientX: e.clientX, clientY: e.clientY, rectLeft: rect.left, rectTop: rect.top, scale, x, y });
    return { x, y };
  }, [scale]);



  // --- Drawing Functions ---

  const convertToDisplayUnit = useCallback((value: number, type: 'length' | 'area') => {
    if (pixelToUnit === 1) { // Not calibrated
        return { value, unit: type === 'length' ? 'px' : 'px²' };
    }
    const valueInFt = type === 'length' ? value * pixelToUnit : value * pixelToUnit * pixelToUnit;

    switch (displayUnit) {
        case 'ft':
            return { value: valueInFt, unit: type === 'length' ? 'ft' : 'sq ft' };
        case 'in':
            const valueInIn = type === 'length' ? valueInFt * 12 : valueInFt * 144;
            return { value: valueInIn, unit: type === 'length' ? 'in' : 'sq in' };
        default:
            return { value, unit: type === 'length' ? 'px' : 'px²' };
    }
  }, [pixelToUnit, displayUnit]);

  // --- Single Drawing Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      console.log('Drawing measurements:', { measurements: measurements.length, points: points.length, currentPos: !!currentPos });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw existing measurements
      measurements.forEach(m => {
        if (!m.points || m.points.length === 0) return;
        
        ctx.save();
        ctx.strokeStyle = m.id === selectedMeasurement?.id ? '#ef4444' : (m.type === 'length' ? '#3b82f6' : '#22c55e');
        ctx.lineWidth = m.id === selectedMeasurement?.id ? 4 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw the main path
        m.points.forEach((p, i) => {
          const x = p.x * scale;
          const y = p.y * scale;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        // Close path for area measurements
        if (m.type === 'area' && m.points.length > 2) {
          ctx.closePath();
        }
        
        ctx.stroke();
        
        // Draw points for selected measurement
        if (m.id === selectedMeasurement?.id) {
          ctx.fillStyle = '#ef4444';
          m.points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x * scale, p.y * scale, 5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.restore();
      });
      
      // Draw current measurement
      if (measuring && points.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x * scale, p.y * scale) : ctx.lineTo(p.x * scale, p.y * scale));
        if (currentPos) ctx.lineTo(currentPos.x * scale, currentPos.y * scale);
        ctx.stroke();

        // Draw length/area text during measurement
        if (points.length > 0 && currentPos) {
          ctx.font = `bold 14px Arial`;
          ctx.fillStyle = '#f97316';
          
          if (measurementType === 'length' && points.length === 1) {
            const length = Math.sqrt(
              Math.pow(currentPos.x - points[0].x, 2) + 
              Math.pow(currentPos.y - points[0].y, 2)
            );
            // Inline convertToDisplayUnit logic
            let displayValue = length;
            let displayUnit = 'px';
            if (pixelToUnit !== 1) {
              const valueInFt = length * pixelToUnit;
              if (displayUnit === 'ft') {
                displayValue = valueInFt;
                displayUnit = 'ft';
              } else if (displayUnit === 'in') {
                displayValue = valueInFt * 12;
                displayUnit = 'in';
              }
            }
            const midX = (points[0].x + currentPos.x) / 2 * scale;
            const midY = (points[0].y + currentPos.y) / 2 * scale;
            ctx.fillText(`${displayValue.toFixed(2)} ${displayUnit}`, midX + 10, midY - 10);
          } else if (measurementType === 'area' && points.length >= 2) {
            const tempPoints = [...points, currentPos];
            // Inline calculatePolygonArea logic
            let area = 0;
            if (tempPoints.length >= 3) {
              for (let i = 0; i < tempPoints.length; i++) {
                const j = (i + 1) % tempPoints.length;
                area += tempPoints[i].x * tempPoints[j].y;
                area -= tempPoints[j].x * tempPoints[i].y;
              }
              area = Math.abs(area / 2);
            }
            // Inline convertToDisplayUnit logic for area
            let displayValue = area;
            let displayUnit = 'px²';
            if (pixelToUnit !== 1) {
              const valueInFt = area * pixelToUnit * pixelToUnit;
              if (displayUnit === 'ft') {
                displayValue = valueInFt;
                displayUnit = 'sq ft';
              } else if (displayUnit === 'in') {
                displayValue = valueInFt * 144;
                displayUnit = 'sq in';
              }
            }
            const centerX = tempPoints.reduce((sum, p) => sum + p.x, 0) / tempPoints.length * scale;
            const centerY = tempPoints.reduce((sum, p) => sum + p.y, 0) / tempPoints.length * scale;
            ctx.fillText(`${displayValue.toFixed(2)} ${displayUnit}`, centerX, centerY);
          }
        }
        ctx.restore();
      }
      
      // Draw calibration line
      if (calibrating && calibrationPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(calibrationPoints[0].x * scale, calibrationPoints[0].y * scale);
        if (calibrationPoints.length === 2) {
            ctx.lineTo(calibrationPoints[1].x * scale, calibrationPoints[1].y * scale);
        } else if (currentPos) {
            ctx.lineTo(currentPos.x * scale, currentPos.y * scale);
        }
        ctx.stroke();

        if (calibrationPoints.length === 2 && calibrationPixelLength) {
            const midX = (calibrationPoints[0].x + calibrationPoints[1].x) / 2 * scale;
            const midY = (calibrationPoints[0].y + calibrationPoints[1].y) / 2 * scale;
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#f59e0b';
            const label = `${calibrationPixelLength.toFixed(2)} px`;
            ctx.fillText(label, midX + 10, midY - 10);
        }
        ctx.restore();
      }
    } else {
      console.log('Canvas or context not available:', { canvas: !!canvas, ctx: !!ctx });
    }
  }, [measurements, points, currentPos, measuring, measurementType, calibrating, calibrationPoints, calibrationPixelLength, selectedMeasurement, scale, pixelToUnit, displayUnit]);

  // --- Event Handlers ---
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Canvas click:', { measuring, editingPoints, points, measurementType });
    if (editingPoints) return;
    if (!measuring) return;

    const pos = getMousePos(e);
    if (!pos) return;

    console.log('Mouse position:', pos);
    const newPoints = [...points, pos];
    setPoints(newPoints);

    if (measurementType === 'length' && newPoints.length === 2) {
      const [start, end] = newPoints;
      const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      const newMeasurement = {
        planId: plan.id,
        type: 'length' as const,
        label: `Length ${measurements.length + 1}`,
        value: length,
        unit: 'px',
        points: newPoints,
      };
      console.log('Saving length measurement:', newMeasurement);
      onMeasurementSave(newMeasurement);
      setPoints([]);
      setMeasuring(false);
    }
  }, [measuring, editingPoints, getMousePos, points, measurementType, plan.id, measurements.length, onMeasurementSave]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingPoints && selectedPointIndex !== -1) {
        const pos = getMousePos(e);
        if (!pos || !selectedMeasurement || !onMeasurementUpdate) return;

        const updatedPoints = [...selectedMeasurement.points];
        updatedPoints[selectedPointIndex] = pos;

        let newValue = selectedMeasurement.value;
        if (selectedMeasurement.type === 'length') {
            const [start, end] = updatedPoints;
            newValue = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        } else if (selectedMeasurement.type === 'area') {
            // Inline calculatePolygonArea logic
            if (updatedPoints.length >= 3) {
              let area = 0;
              for (let i = 0; i < updatedPoints.length; i++) {
                const j = (i + 1) % updatedPoints.length;
                area += updatedPoints[i].x * updatedPoints[j].y;
                area -= updatedPoints[j].x * updatedPoints[i].y;
              }
              newValue = Math.abs(area / 2);
            }
        }
        onMeasurementUpdate(selectedMeasurement.id, { points: updatedPoints, value: newValue });

    } else if (measuring || calibrating) {
      setCurrentPos(getMousePos(e));
    }
  }, [editingPoints, selectedPointIndex, selectedMeasurement, measuring, getMousePos, onMeasurementUpdate]);

  const handleCanvasMouseUp = useCallback(() => {
    if (editingPoints) {
      setSelectedPointIndex(-1);
    }
  }, [editingPoints]);

  const handlePointSelect = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editingPoints || !selectedMeasurement) return;
    const pos = getMousePos(e);
    if (!pos) return;
    const pointIndex = selectedMeasurement.points.findIndex(p => Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2)) < (6 / scale));
    if (pointIndex !== -1) {
        setSelectedPointIndex(pointIndex);
    }
  };

  const handleCalibrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calibrationPixelLength || !calibrationInput) return;
    const realWorldLength = parseFloat(calibrationInput);
    if (isNaN(realWorldLength) || realWorldLength <= 0) return;
    setPixelToUnit(realWorldLength / calibrationPixelLength);
    setCalibrationModal(false);
    setCalibrating(false);
    setCalibrationPoints([]);
    setCalibrationInput("");
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Mouse down event captured:', { 
      calibrating, 
      editingPoints, 
      measuring, 
      measurementType,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target
    });
    
    if (calibrating) {
        const pos = getMousePos(e);
        if (!pos) return;
        const newCalPoints = [...calibrationPoints, pos];
        if (newCalPoints.length <= 2) {
            setCalibrationPoints(newCalPoints);
            if (newCalPoints.length === 2) {
                const [start, end] = newCalPoints;
                const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                setCalibrationPixelLength(dist);
                setCalibrationModal(true); // Show modal when calibration points are set
            }
        }
    } else if (editingPoints) {
        handlePointSelect(e);
    } else {
        handleCanvasClick(e);
    }
  }

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMeasuring(false);
        setEditingPoints(false);
        setPoints([]);
        setSelectedMeasurement(null);
        setCalibrating(false);
        setCalibrationPoints([]);
      }
      if (e.key === 'Enter' && measurementType === 'area' && points.length >= 3) {
        // Inline calculatePolygonArea logic
        let area = 0;
        if (points.length >= 3) {
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
          }
          area = Math.abs(area / 2);
        }
        const newMeasurement = {
          planId: plan.id,
          type: 'area' as const,
          label: `Area ${measurements.length + 1}`,
          value: area,
          unit: 'px',
          points: points,
        };
        onMeasurementSave(newMeasurement);
        setPoints([]);
        setMeasuring(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [points, measurementType, onMeasurementSave, plan.id, measurements.length]);

  // --- Component Lifecycle Handlers ---
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF document loaded with', numPages, 'pages');
    setNumPages(numPages);
  };

  const onPageLoadSuccess = ({ width, height }: { width: number; height: number }) => {
    console.log('PDF page loaded:', { width, height });
    const canvas = canvasRef.current;
    const container = containerRef.current;
    console.log('Canvas and container refs:', { canvas: !!canvas, container: !!container });
    
    if (canvas && container) {
      const containerWidth = container.offsetWidth;
      const newScale = containerWidth / width;
      console.log('Setting scale:', { containerWidth, width, newScale });
      
      // Only update if dimensions actually changed
      const newDimensions = { width: containerWidth, height: height * newScale };
      console.log('Setting page dimensions:', newDimensions);
      setPageDimensions(newDimensions);
      setScale(newScale);
      
      // Set canvas dimensions
      canvas.width = containerWidth;
      canvas.height = height * newScale;
      console.log('Canvas dimensions set:', { width: canvas.width, height: canvas.height });
      
      // Force a redraw
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Log canvas position for debugging
      setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        console.log('Canvas position:', { 
          left: rect.left, 
          top: rect.top, 
          width: rect.width, 
          height: rect.height,
          scale: newScale
        });
      }, 100);
    } else {
      console.error('Canvas or container not available:', { canvas: !!canvas, container: !!container });
    }
  };

  const onPageLoadError = (error: Error) => {
    console.error('PDF page load error:', error);
  };

  const handleMeasurementDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onMeasurementDelete) onMeasurementDelete(id);
    if (selectedMeasurement?.id === id) {
        setSelectedMeasurement(null);
        setEditingPoints(false);
    }
  }

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading PDF...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 p-4">
        <div className="text-red-500 text-lg font-medium mb-2">Error Loading PDF</div>
        <div className="text-red-600 text-sm text-center">{error}</div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  if (!pdfData || !pdfLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <div className="text-gray-500 mb-2">No PDF data available</div>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-white border-b">
            <div className="flex items-center gap-2">
                <Button variant={measuring && measurementType === 'length' ? 'secondary' : 'ghost'} onClick={() => { 
                  console.log('Length button clicked, current measuring state:', measuring);
                  setMeasuring(true); 
                  setMeasurementType('length'); 
                  setPoints([]); 
                  setSelectedMeasurement(null); 
                  setEditingPoints(false); 
                  setCalibrating(false); 
                  console.log('Length measuring mode activated');
                }}>
                    <Ruler className="h-4 w-4 mr-2" /> Length
                </Button>
                <Button variant={measuring && measurementType === 'area' ? 'secondary' : 'ghost'} onClick={() => { 
                  console.log('Area button clicked, current measuring state:', measuring);
                  setMeasuring(true); 
                  setMeasurementType('area'); 
                  setPoints([]); 
                  setSelectedMeasurement(null); 
                  setEditingPoints(false); 
                  setCalibrating(false); 
                  console.log('Area measuring mode activated');
                }}>
                    <Square className="h-4 w-4 mr-2" /> Area
                </Button>
                <Button variant={calibrating ? 'secondary' : 'ghost'} onClick={() => { 
                  console.log('Calibrate button clicked');
                  setCalibrating(true); 
                  setMeasuring(false); 
                  setPoints([]); 
                  setCalibrationPoints([]); 
                  setCalibrationPixelLength(null); 
                }}>
                    <Move className="h-4 w-4 mr-2" /> Calibrate
                </Button>
                {(measuring || calibrating) && (
                  <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                    {measuring ? `Measuring ${measurementType}` : 'Calibrating'}
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setScale(s => s * 1.2)}>Zoom In</Button>
                <Button variant="ghost" onClick={() => setScale(s => s / 1.2)}>Zoom Out</Button>
                <Button variant="ghost" onClick={() => setSidebarVisible(!sidebarVisible)}>{sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}</Button>
            </div>
        </div>

        {/* PDF Viewer */}
        <div 
          ref={containerRef} 
          className="flex-1 overflow-auto relative bg-white flex items-center justify-center"
          style={{ minHeight: '100%' }}
        >
          <div 
            ref={pdfContainerRef}
            className="relative" 
            style={{
              width: pageDimensions?.width || 'auto',
              height: pageDimensions?.height || 'auto',
              minWidth: '100%',
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {/* PDF Document */}
            {pdfData && pdfLoaded && (
              <div className="relative" style={{ zIndex: 1 }}>
                <Document 
                  file={pdfData} 
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  }
                  error={
                    <div className="text-red-500 p-4 bg-red-50 rounded">
                      Failed to load PDF document
                    </div>
                  }
                  className="shadow-lg"
                >
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale} 
                    onLoadSuccess={onPageLoadSuccess} 
                    onLoadError={onPageLoadError}
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    }
                    className="transition-opacity duration-300"
                  />
                </Document>
              </div>
            )}
            
            {/* Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-auto"
              width={pageDimensions?.width || 800}
              height={pageDimensions?.height || 600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onClick={(e) => console.log('Canvas clicked!', e)}
              style={{
                touchAction: 'none',
                zIndex: 10,
                opacity: measuring || calibrating ? 1 : 0.9,
                transition: 'opacity 0.2s ease-in-out',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'auto',
                cursor: measuring ? 'crosshair' : calibrating ? 'crosshair' : 'default',
                border: measuring || calibrating ? '2px solid #3b82f6' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarVisible && (
        <div className="w-80 bg-gray-50 border-l p-4 overflow-y-auto flex flex-col">
          <h2 className="text-lg font-bold mb-4">Measurements</h2>
          <div className="space-y-2 flex-1">
            {measurements.map(m => (
              <div key={m.id} className={`p-2 rounded-md cursor-pointer ${selectedMeasurement?.id === m.id ? 'bg-blue-100 border border-blue-400' : 'bg-white'}`} onClick={() => { setSelectedMeasurement(m); setMeasuring(false); }}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{m.label}</span>
                  <Button variant="ghost" size="icon" onClick={(e) => handleMeasurementDelete(e, m.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div>{convertToDisplayUnit(m.value, m.type).value.toFixed(2)} {convertToDisplayUnit(m.value, m.type).unit}</div>
              </div>
            ))}
          </div>
          {selectedMeasurement && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-bold">Edit: {selectedMeasurement.label}</h3>
              <Button onClick={() => setEditingPoints(p => !p)} className="mt-2 w-full">
                {editingPoints ? 'Finish Editing' : 'Edit Points'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Calibration Modal */}
      {calibrationModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Set Scale</h2>
            <form onSubmit={handleCalibrationSubmit}>
              <p className="mb-4">Click two points on the plan, then enter the known distance between them.</p>
              {calibrationPixelLength && <p className="text-sm text-gray-600 mb-2">Pixel distance: {calibrationPixelLength.toFixed(2)}px</p>}
              <div className="my-4">
                <label className="block text-sm font-medium text-gray-700">Known Distance</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="text" value={calibrationInput} onChange={(e) => setCalibrationInput(e.target.value)} className="border p-2 rounded-md w-full" placeholder="e.g., 10" required />
                  <select value={calibrationUnit} onChange={(e) => setCalibrationUnit(e.target.value as 'ft' | 'm' | 'in')} className="border p-2 rounded-md">
                    <option value="ft">Feet</option>
                    <option value="m">Meters</option>
                    <option value="in">Inches</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setCalibrationModal(false); setCalibrating(false); setCalibrationPoints([]); }}>Cancel</Button>
                <Button type="submit" disabled={!calibrationPixelLength}>Set Scale</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
