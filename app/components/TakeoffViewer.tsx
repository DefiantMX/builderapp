"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import { pdfjs } from "react-pdf"
import { Ruler, Move, Square, Save } from "lucide-react"
import { Button } from '@/components/ui/button'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

type Point = {
  x: number
  y: number
}

type Plan = {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  createdAt: string
  updatedAt: string
}

type Measurement = {
  id: number
  planId: number
  type: "length" | "area"
  label: string
  value: number
  unit: string
  points: Point[]
}

type TakeoffViewerProps = {
  plan: Plan
  measurements: Measurement[]
  onMeasurementSave: (measurement: Omit<Measurement, "id">) => void
}

const SCALE_FACTOR = 0.0254 // 1 pixel = 0.0254 meters (approximate)

export default function TakeoffViewer({ plan, measurements, onMeasurementSave }: TakeoffViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [measuring, setMeasuring] = useState(false)
  const [measurementType, setMeasurementType] = useState<'length' | 'area'>('length')
  const [points, setPoints] = useState<Point[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [measurementLabel, setMeasurementLabel] = useState("")
  const [showLabelInput, setShowLabelInput] = useState(false)

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await fetch(plan.fileUrl)
        const blob = await response.blob()
        const dataUrl = URL.createObjectURL(blob)
        setPdfData(dataUrl)
      } catch (error) {
        console.error("Error loading PDF:", error)
      }
    }

    fetchPdf()
    return () => {
      if (pdfData) {
        URL.revokeObjectURL(pdfData)
      }
    }
  }, [plan.fileUrl, pdfData])

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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!measuring) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setPoints([...points, { x, y }])

    if (measurementType === 'length' && points.length === 1) {
      // Calculate length measurement
      const dx = x - points[0].x
      const dy = y - points[0].y
      const length = Math.sqrt(dx * dx + dy * dy)

      onMeasurementSave({
        planId: plan.id,
        type: 'length',
        label: `Length ${measurements.length + 1}`,
        value: length * scale, // Convert pixels to actual units
        unit: 'ft',
        points: [...points, { x, y }],
      })

      setPoints([])
      setMeasuring(false)
    } else if (measurementType === 'area' && points.length === 2) {
      // Calculate area measurement
      const area = calculatePolygonArea([...points, { x, y }])

      onMeasurementSave({
        planId: plan.id,
        type: 'area',
        label: `Area ${measurements.length + 1}`,
        value: area * scale * scale, // Convert square pixels to actual units
        unit: 'sq ft',
        points: [...points, { x, y }],
      })

      setPoints([])
      setMeasuring(false)
    }
  }

  function calculatePolygonArea(points: Point[]): number {
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    return Math.abs(area / 2)
  }

  function drawMeasurements(context: CanvasRenderingContext2D) {
    measurements.forEach((measurement) => {
      context.beginPath()
      context.moveTo(measurement.points[0].x * scale, measurement.points[0].y * scale)
      measurement.points.forEach((point) => {
        context.lineTo(point.x * scale, point.y * scale)
      })
      if (measurement.type === "area") {
        context.closePath()
        context.fillStyle = "rgba(0, 0, 255, 0.1)"
        context.fill()
      }
      context.strokeStyle = "blue"
      context.stroke()

      // Draw label
      const lastPoint = measurement.points[measurement.points.length - 1]
      context.fillStyle = "blue"
      context.font = "12px Arial"
      context.fillText(
        `${measurement.label}: ${measurement.value.toFixed(2)} ${measurement.unit}`,
        lastPoint.x * scale + 5,
        lastPoint.y * scale + 5
      )
    })
  }

  function drawCurrentMeasurement(context: CanvasRenderingContext2D) {
    if (points.length === 0) return

    context.beginPath()
    context.moveTo(points[0].x * scale, points[0].y * scale)
    points.forEach((point) => {
      context.lineTo(point.x * scale, point.y * scale)
    })
    if (measurementType === "area" && points.length >= 3) {
      context.closePath()
      context.fillStyle = "rgba(255, 0, 0, 0.1)"
      context.fill()
    }
    context.strokeStyle = "red"
    context.stroke()

    if (points.length >= 2) {
      const value = calculatePolygonArea(points)
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length
      context.fillStyle = "red"
      context.fillText(`${value.toFixed(2)}${measurementType === "length" ? "ft" : "sq ft"}`, centerX * scale, centerY * scale)
    }
  }

  if (!pdfData) {
    return <div>Loading PDF...</div>
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button
            variant={measuring && measurementType === 'length' ? 'default' : 'outline'}
            onClick={() => {
              setMeasuring(true)
              setMeasurementType('length')
              setPoints([])
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
            }}
          >
            <Ruler className="w-4 h-4 mr-2" />
            Measure Area
          </Button>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setScale(scale => scale - 0.1)}
            disabled={scale <= 0.5}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            onClick={() => setScale(scale => scale + 0.1)}
            disabled={scale >= 2.0}
          >
            Zoom In
          </Button>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden">
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading PDF...</div>}
          error={<div>Error loading PDF. Please try again.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair"
          style={{ opacity: measuring ? 1 : 0.7 }}
        />
      </div>

      {numPages && numPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-4">
          <Button
            variant="outline"
            onClick={() => setPageNumber(page => Math.max(1, page - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <span>
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

