import React, { useRef, useState } from "react";
import { Stage, Layer, Line, Text } from "react-konva";

export type DrawingMode = "select" | "line" | "area";

export type MeasurementType = "line" | "area";
export interface Measurement {
  id: string;
  type: MeasurementType;
  points: number[];
}

interface TakeoffCanvasProps {
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
  mode?: DrawingMode;
  measurements?: Measurement[];
  selectedMeasurementId?: string | null;
  onAddMeasurement?: (type: MeasurementType, points: number[]) => void;
  onSelectMeasurement?: (id: string) => void;
}

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
  // Shoelace formula
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

export default function TakeoffCanvas({
  width = 900,
  height = 600,
  backgroundImageUrl,
  mode = "line",
  measurements = [],
  selectedMeasurementId = null,
  onAddMeasurement,
  onSelectMeasurement,
}: TakeoffCanvasProps) {
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const isDrawing = useRef(false);

  // Area (polygon) state
  const [currentPolygon, setCurrentPolygon] = useState<number[]>([]);
  const [isPolygonDrawing, setIsPolygonDrawing] = useState(false);

  // Helper to check if a point is near another point
  function isNearPoint(x1: number, y1: number, x2: number, y2: number, threshold = 10) {
    return Math.abs(x1 - x2) < threshold && Math.abs(y1 - y2) < threshold;
  }

  // --- LINE MODE ---
  const handleMouseDown = (e: any) => {
    if (mode === "line") {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        setCurrentLine([pos.x, pos.y]);
      }
    }
    if (mode === "area") {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      if (!isPolygonDrawing) {
        setCurrentPolygon([pos.x, pos.y]);
        setIsPolygonDrawing(true);
      } else {
        // If user clicks near the first point, close the polygon
        if (currentPolygon.length >= 4) {
          const [fx, fy] = [currentPolygon[0], currentPolygon[1]];
          if (isNearPoint(pos.x, pos.y, fx, fy)) {
            if (onAddMeasurement) onAddMeasurement("area", currentPolygon);
            setCurrentPolygon([]);
            setIsPolygonDrawing(false);
            return;
          }
        }
        setCurrentPolygon((prev) => [...prev, pos.x, pos.y]);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (mode === "line") {
      if (!isDrawing.current) return;
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        setCurrentLine((prev) => [...prev, pos.x, pos.y]);
      }
    }
    // For area mode, optionally show a preview line to the mouse (not implemented yet)
  };

  const handleMouseUp = () => {
    if (mode === "line") {
      if (currentLine.length > 2) {
        if (onAddMeasurement) onAddMeasurement("line", currentLine);
      }
      setCurrentLine([]);
      isDrawing.current = false;
    }
    // No action needed for area mode on mouse up
  };

  // Double click to finish polygon
  const handleDblClick = (e: any) => {
    if (mode === "area" && isPolygonDrawing && currentPolygon.length >= 6) {
      if (onAddMeasurement) onAddMeasurement("area", currentPolygon);
      setCurrentPolygon([]);
      setIsPolygonDrawing(false);
    }
  };

  // --- Measurement display ---
  let measurementText = "";
  let measurementX = 0;
  let measurementY = 0;
  if (mode === "line" && currentLine.length > 2) {
    const length = getLineLength(currentLine);
    measurementText = `${length.toFixed(2)} px`;
    measurementX = currentLine[currentLine.length - 2];
    measurementY = currentLine[currentLine.length - 1];
  }
  if (mode === "area" && currentPolygon.length >= 6) {
    const area = getPolygonArea(currentPolygon);
    measurementText = `${area.toFixed(2)} px²`;
    // Place label at centroid (approximate)
    let cx = 0, cy = 0, n = currentPolygon.length / 2;
    for (let i = 0; i < n; i++) {
      cx += currentPolygon[2 * i];
      cy += currentPolygon[2 * i + 1];
    }
    measurementX = cx / n;
    measurementY = cy / n;
  }

  // --- Selection ---
  const handleShapeClick = (id: string) => {
    if (onSelectMeasurement) onSelectMeasurement(id);
  };

  return (
    <Stage
      width={width}
      height={height}
      className="rounded-lg shadow-lg bg-white"
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onDblClick={handleDblClick}
      style={{ background: backgroundImageUrl ? `url(${backgroundImageUrl}) center/contain no-repeat` : "#fff" }}
    >
      <Layer>
        {/* Draw lines */}
        {measurements.filter(m => m.type === "line").map((m, idx) => (
          <Line
            key={m.id}
            points={m.points}
            stroke={selectedMeasurementId === m.id ? "#f59e42" : "#2563EB"}
            strokeWidth={selectedMeasurementId === m.id ? 5 : 3}
            tension={0.5}
            lineCap="round"
            globalCompositeOperation="source-over"
            onClick={() => handleShapeClick(m.id)}
          />
        ))}
        {currentLine.length > 0 && mode === "line" && (
          <Line
            points={currentLine}
            stroke="#60A5FA"
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            dash={[10, 5]}
            globalCompositeOperation="source-over"
          />
        )}
        {/* Draw polygons */}
        {measurements.filter(m => m.type === "area").map((m, idx) => (
          <Line
            key={m.id}
            points={m.points}
            stroke={selectedMeasurementId === m.id ? "#f59e42" : "#22C55E"}
            strokeWidth={selectedMeasurementId === m.id ? 5 : 3}
            closed
            fill="#22c55e22"
            lineCap="round"
            globalCompositeOperation="source-over"
            onClick={() => handleShapeClick(m.id)}
          />
        ))}
        {currentPolygon.length > 0 && mode === "area" && (
          <Line
            points={currentPolygon}
            stroke="#22C55E"
            strokeWidth={2}
            dash={[10, 5]}
            lineCap="round"
            globalCompositeOperation="source-over"
          />
        )}
        {/* Measurement label */}
        {measurementText && (
          <Text
            x={measurementX + 10}
            y={measurementY - 10}
            text={measurementText}
            fontSize={18}
            fill="#1e293b"
            fontStyle="bold"
            shadowColor="#fff"
            shadowBlur={2}
            shadowOffset={{ x: 1, y: 1 }}
            shadowOpacity={0.5}
          />
        )}
      </Layer>
    </Stage>
  );
} 