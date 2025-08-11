"use client"

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Text, Circle, Rect, Group } from "react-konva";
import { 
  Ruler, 
  Square, 
  MousePointer, 
  Type, 
  Layers, 
  Settings,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  Copy,
  Save,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TakeoffTool = "select" | "line" | "area" | "count" | "text" | "calibrate";
export type MeasurementType = "line" | "area" | "count" | "text";

export interface TakeoffMeasurement {
  id: string;
  type: MeasurementType;
  points: number[];
  label: string;
  value: number;
  unit: string;
  division: string;
  subcategory: string;
  materialType?: string;
  pricePerUnit?: number;
  layer: string;
  color: string;
  notes?: string;
  createdAt: Date;
}

export interface CalibrationData {
  pixelDistance: number;
  realDistance: number;
  unit: string;
  scale: number; // pixels per unit
}

interface AdvancedTakeoffCanvasProps {
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
  measurements: TakeoffMeasurement[];
  selectedMeasurementId?: string | null;
  onAddMeasurement?: (measurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'>) => void;
  onUpdateMeasurement?: (id: string, updates: Partial<TakeoffMeasurement>) => void;
  onDeleteMeasurement?: (id: string) => void;
  onSelectMeasurement?: (id: string | null) => void;
}

const TOOL_COLORS = {
  line: "#2563EB",
  area: "#22C55E", 
  count: "#F59E0B",
  text: "#8B5CF6",
  select: "#6B7280"
};

const LAYERS = [
  "General",
  "Foundation", 
  "Framing",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Finishes",
  "Site Work"
];

export default function AdvancedTakeoffCanvas({
  width = 1200,
  height = 800,
  backgroundImageUrl,
  measurements = [],
  selectedMeasurementId = null,
  onAddMeasurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
  onSelectMeasurement,
}: AdvancedTakeoffCanvasProps) {
  // Tool state
  const [currentTool, setCurrentTool] = useState<TakeoffTool>("select");
  const [currentLayer, setCurrentLayer] = useState<string>("General");
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [previewPoint, setPreviewPoint] = useState<number[]>([]);
  
  // Calibration state
  const [calibration, setCalibration] = useState<CalibrationData>({
    pixelDistance: 0,
    realDistance: 0,
    unit: "ft",
    scale: 1
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<number[]>([]);
  
  // UI state
  const [scale, setScale] = useState(1);
  const [showProperties, setShowProperties] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  
  // Text tool state
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<number[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  
  // Count tool state
  const [countItems, setCountItems] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [isCounting, setIsCounting] = useState(false);

  const stageRef = useRef<any>(null);

  // Helper functions
  const calculateDistance = useCallback((points: number[]): number => {
    if (points.length < 4) return 0;
    let distance = 0;
    for (let i = 2; i < points.length; i += 2) {
      const dx = points[i] - points[i - 2];
      const dy = points[i + 1] - points[i - 1];
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance * calibration.scale;
  }, [calibration.scale]);

  const calculateArea = useCallback((points: number[]): number => {
    if (points.length < 6) return 0;
    let area = 0;
    const n = points.length / 2;
    for (let i = 0; i < n; i++) {
      const x1 = points[2 * i];
      const y1 = points[2 * i + 1];
      const x2 = points[2 * ((i + 1) % n)];
      const y2 = points[2 * ((i + 1) % n) + 1];
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area / 2) * calibration.scale * calibration.scale;
  }, [calibration.scale]);

  const formatValue = useCallback((value: number, unit: string): string => {
    if (unit === "ft") return `${value.toFixed(2)} ft`;
    if (unit === "sq ft") return `${value.toFixed(2)} sq ft`;
    if (unit === "count") return `${Math.round(value)} ea`;
    return `${value.toFixed(2)} ${unit}`;
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (currentTool === "calibrate") {
      if (calibrationPoints.length === 0) {
        setCalibrationPoints([pos.x, pos.y]);
      } else if (calibrationPoints.length === 2) {
        const pixelDist = Math.sqrt(
          Math.pow(pos.x - calibrationPoints[0], 2) + 
          Math.pow(pos.y - calibrationPoints[1], 2)
        );
        setCalibration(prev => ({ ...prev, pixelDistance: pixelDist }));
        setCalibrationPoints([]);
        setIsCalibrating(false);
      }
      return;
    }

    if (currentTool === "text") {
      setTextPosition([pos.x, pos.y]);
      setIsAddingText(true);
      return;
    }

    if (currentTool === "count") {
      const newItem = { id: Date.now().toString(), x: pos.x, y: pos.y };
      setCountItems(prev => [...prev, newItem]);
      return;
    }

    if (currentTool === "select") {
      // Handle selection logic
      return;
    }

    // Start drawing for line and area tools
    setIsDrawing(true);
    setCurrentPoints([pos.x, pos.y]);
  };

  const handleMouseMove = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (currentTool === "calibrate" && calibrationPoints.length === 2) {
      setPreviewPoint([calibrationPoints[0], calibrationPoints[1], pos.x, pos.y]);
      return;
    }

    if (isDrawing && currentPoints.length > 0) {
      setPreviewPoint([...currentPoints, pos.x, pos.y]);
    }
  };

  const handleMouseUp = (e: any) => {
    if (!isDrawing) return;

    const pos = e.target.getStage().getPointerPosition();
    if (!pos || currentPoints.length === 0) return;

    const finalPoints = [...currentPoints, pos.x, pos.y];

    if (currentTool === "line" && finalPoints.length >= 4) {
      const distance = calculateDistance(finalPoints);
      const newMeasurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'> = {
        type: "line",
        points: finalPoints,
        label: `Line ${measurements.filter(m => m.type === "line").length + 1}`,
        value: distance,
        unit: "ft",
        division: "03",
        subcategory: "Foundation",
        layer: currentLayer,
        color: TOOL_COLORS.line
      };
      onAddMeasurement?.(newMeasurement);
    }

    if (currentTool === "area" && finalPoints.length >= 6) {
      const area = calculateArea(finalPoints);
      const newMeasurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'> = {
        type: "area",
        points: finalPoints,
        label: `Area ${measurements.filter(m => m.type === "area").length + 1}`,
        value: area,
        unit: "sq ft",
        division: "03",
        subcategory: "Foundation",
        layer: currentLayer,
        color: TOOL_COLORS.area
      };
      onAddMeasurement?.(newMeasurement);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
    setPreviewPoint([]);
  };

  const handleDoubleClick = (e: any) => {
    if (currentTool === "area" && isDrawing) {
      const finalPoints = [...currentPoints];
      if (finalPoints.length >= 6) {
        const area = calculateArea(finalPoints);
        const newMeasurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'> = {
          type: "area",
          points: finalPoints,
          label: `Area ${measurements.filter(m => m.type === "area").length + 1}`,
          value: area,
          unit: "sq ft",
          division: "03",
          subcategory: "Foundation",
          layer: currentLayer,
          color: TOOL_COLORS.area
        };
        onAddMeasurement?.(newMeasurement);
      }
      setIsDrawing(false);
      setCurrentPoints([]);
      setPreviewPoint([]);
    }
  };

  // Toolbar actions
  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));
  const handleResetZoom = () => setScale(1);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setCurrentTool("calibrate");
  };

  const handleCalibrationComplete = (realDistance: number) => {
    if (calibration.pixelDistance > 0) {
      const newScale = realDistance / calibration.pixelDistance;
      setCalibration(prev => ({ ...prev, realDistance, scale: newScale }));
    }
  };

  const handleAddText = () => {
    if (textInput.trim() && textPosition.length === 2) {
      const newMeasurement: Omit<TakeoffMeasurement, 'id' | 'createdAt'> = {
        type: "text",
        points: textPosition,
        label: textInput,
        value: 0,
        unit: "text",
        division: "00",
        subcategory: "Notes",
        layer: currentLayer,
        color: TOOL_COLORS.text
      };
      onAddMeasurement?.(newMeasurement);
      setTextInput("");
      setIsAddingText(false);
    }
  };

  const selectedMeasurement = measurements.find(m => m.id === selectedMeasurementId);

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-16 bg-gray-100 border-r flex flex-col items-center py-4 space-y-2">
        <Button
          variant={currentTool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTool("select")}
          title="Select"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "line" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTool("line")}
          title="Line Measurement"
        >
          <Ruler className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "area" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTool("area")}
          title="Area Measurement"
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "count" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTool("count")}
          title="Count Items"
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "text" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCurrentTool("text")}
          title="Add Text"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <div className="border-t border-gray-300 w-8 my-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <div className="border-t border-gray-300 w-8 my-2" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCalibrate}
          title="Calibrate"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Scale: {scale.toFixed(2)}x</span>
            {calibration.scale !== 1 && (
              <span className="text-sm text-gray-600">
                1 {calibration.unit} = {calibration.scale.toFixed(2)} pixels
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={showLayers ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowLayers(!showLayers)}
            >
              <Layers className="h-4 w-4 mr-1" />
              Layers
            </Button>
            <Button
              variant={showProperties ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowProperties(!showProperties)}
            >
              Properties
            </Button>
          </div>
        </div>

        <div className="flex-1 relative">
          <Stage
            ref={stageRef}
            width={width}
            height={height}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDblClick={handleDoubleClick}
            style={{ 
              background: backgroundImageUrl ? `url(${backgroundImageUrl}) center/contain no-repeat` : "#f8fafc",
              cursor: currentTool === "select" ? "default" : "crosshair"
            }}
          >
            <Layer>
              {/* Background grid */}
              {Array.from({ length: Math.ceil(width / 20) }, (_, i) => (
                <Line
                  key={`v${i}`}
                  points={[i * 20, 0, i * 20, height]}
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                />
              ))}
              {Array.from({ length: Math.ceil(height / 20) }, (_, i) => (
                <Line
                  key={`h${i}`}
                  points={[0, i * 20, width, i * 20]}
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                />
              ))}

              {/* Existing measurements */}
              {measurements.map((measurement) => (
                <Group key={measurement.id}>
                  {measurement.type === "line" && (
                    <Line
                      points={measurement.points}
                      stroke={selectedMeasurementId === measurement.id ? "#f59e0b" : measurement.color}
                      strokeWidth={selectedMeasurementId === measurement.id ? 4 : 2}
                      tension={0.5}
                      lineCap="round"
                      onClick={() => onSelectMeasurement?.(measurement.id)}
                    />
                  )}
                  
                  {measurement.type === "area" && (
                    <Line
                      points={measurement.points}
                      stroke={selectedMeasurementId === measurement.id ? "#f59e0b" : measurement.color}
                      strokeWidth={selectedMeasurementId === measurement.id ? 4 : 2}
                      closed
                      fill={`${measurement.color}22`}
                      onClick={() => onSelectMeasurement?.(measurement.id)}
                    />
                  )}
                  
                  {measurement.type === "text" && (
                    <Text
                      x={measurement.points[0]}
                      y={measurement.points[1]}
                      text={measurement.label}
                      fontSize={14}
                      fill={measurement.color}
                      fontStyle="bold"
                      onClick={() => onSelectMeasurement?.(measurement.id)}
                    />
                  )}
                  
                  {/* Measurement labels */}
                  {measurement.type !== "text" && (
                    <Text
                      x={measurement.points[measurement.points.length - 2] + 10}
                      y={measurement.points[measurement.points.length - 1] - 10}
                      text={formatValue(measurement.value, measurement.unit)}
                      fontSize={12}
                      fill="#1e293b"
                      fontStyle="bold"
                      shadowColor="#fff"
                      shadowBlur={2}
                      shadowOffset={{ x: 1, y: 1 }}
                      shadowOpacity={0.8}
                    />
                  )}
                </Group>
              ))}

              {/* Current drawing preview */}
              {isDrawing && previewPoint.length > 0 && (
                <Line
                  points={previewPoint}
                  stroke={TOOL_COLORS[currentTool as keyof typeof TOOL_COLORS]}
                  strokeWidth={2}
                  dash={[5, 5]}
                  tension={0.5}
                  lineCap="round"
                />
              )}

              {/* Calibration line */}
              {isCalibrating && calibrationPoints.length === 2 && previewPoint.length === 4 && (
                <Line
                  points={previewPoint}
                  stroke="#ef4444"
                  strokeWidth={3}
                  lineCap="round"
                />
              )}

              {/* Count items */}
              {countItems.map((item) => (
                <Circle
                  key={item.id}
                  x={item.x}
                  y={item.y}
                  radius={8}
                  fill={TOOL_COLORS.count}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-l flex flex-col">
        {showLayers && (
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Layers</h3>
            <Select value={currentLayer} onValueChange={setCurrentLayer}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYERS.map((layer) => (
                  <SelectItem key={layer} value={layer}>
                    {layer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-3 space-y-1">
              {LAYERS.map((layer) => (
                <div key={layer} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={measurements.some(m => m.layer === layer)}
                    readOnly
                    className="rounded"
                  />
                  <span className="text-sm">{layer}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showProperties && selectedMeasurement && (
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Properties</h3>
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input
                  value={selectedMeasurement.label}
                  onChange={(e) => onUpdateMeasurement?.(selectedMeasurement.id, { label: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={selectedMeasurement.value}
                  onChange={(e) => onUpdateMeasurement?.(selectedMeasurement.id, { value: parseFloat(e.target.value) })}
                />
              </div>
              
              <div>
                <Label>Unit</Label>
                <Select 
                  value={selectedMeasurement.unit} 
                  onValueChange={(value) => onUpdateMeasurement?.(selectedMeasurement.id, { unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft">Feet</SelectItem>
                    <SelectItem value="sq ft">Square Feet</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteMeasurement?.(selectedMeasurement.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Calibration panel */}
        {isCalibrating && (
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Calibration</h3>
            <div className="space-y-3">
              <div>
                <Label>Real Distance ({calibration.unit})</Label>
                <Input
                  type="number"
                  placeholder="Enter known distance"
                  onChange={(e) => handleCalibrationComplete(parseFloat(e.target.value))}
                />
              </div>
              <p className="text-sm text-gray-600">
                Click two points on the drawing to measure a known distance.
              </p>
            </div>
          </div>
        )}

        {/* Text input panel */}
        {isAddingText && (
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Add Text</h3>
            <div className="space-y-3">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
              />
              <Button onClick={handleAddText} size="sm">
                Add Text
              </Button>
            </div>
          </div>
        )}

        {/* Measurements summary */}
        <div className="flex-1 p-4 overflow-auto">
          <h3 className="font-semibold mb-3">Measurements</h3>
          <div className="space-y-2">
            {measurements.map((measurement) => (
              <div
                key={measurement.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedMeasurementId === measurement.id ? 'bg-blue-100' : 'bg-white'
                }`}
                onClick={() => onSelectMeasurement?.(measurement.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{measurement.label}</span>
                  <span className="text-sm text-gray-600">
                    {formatValue(measurement.value, measurement.unit)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{measurement.layer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
