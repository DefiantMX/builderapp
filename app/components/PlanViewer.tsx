"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Document, Page } from "react-pdf"
import { pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Pencil, Ruler, Eraser } from "lucide-react"

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

type Plan = {
  id: number
  name: string
  url: string
  uploadedAt: string
  pageCount: number
}

type PlanViewerProps = {
  plan: Plan
}

type Annotation = {
  type: "drawing" | "measurement"
  points: { x: number; y: number }[]
}

const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentTool, setCurrentTool] = useState<"pan" | "draw" | "measure" | "erase">("pan")
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await fetch(plan.url)
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
  }, [plan.url, pdfData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const context = canvas.getContext("2d")
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        drawAnnotations(context)
      }
    }
  }, [annotations, scale])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset)
  }

  function zoomIn() {
    setScale((prevScale) => prevScale + 0.1)
  }

  function zoomOut() {
    setScale((prevScale) => Math.max(0.1, prevScale - 0.1))
  }

  function handleToolChange(tool: "pan" | "draw" | "measure" | "erase") {
    setCurrentTool(tool)
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (currentTool === "pan") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    setIsDrawing(true)
    setCurrentAnnotation({ type: currentTool === "measure" ? "measurement" : "drawing", points: [{ x, y }] })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !currentAnnotation) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    setCurrentAnnotation((prev) => ({
      ...prev!,
      points: [...prev!.points, { x, y }],
    }))
  }

  function handleMouseUp() {
    if (!isDrawing || !currentAnnotation) return

    setIsDrawing(false)
    setAnnotations((prev) => [...prev, currentAnnotation])
    setCurrentAnnotation(null)
  }

  function drawAnnotations(context: CanvasRenderingContext2D) {
    annotations.forEach((annotation) => {
      context.beginPath()
      context.moveTo(annotation.points[0].x * scale, annotation.points[0].y * scale)
      annotation.points.forEach((point) => {
        context.lineTo(point.x * scale, point.y * scale)
      })
      context.stroke()

      if (annotation.type === "measurement") {
        const start = annotation.points[0]
        const end = annotation.points[annotation.points.length - 1]
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
        context.fillText(`${distance.toFixed(2)} px`, ((start.x + end.x) / 2) * scale, ((start.y + end.y) / 2) * scale)
      }
    })
  }

  if (!pdfData) {
    return <div>Loading PDF...</div>
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <button
          onClick={() => handleToolChange("pan")}
          className={`mr-2 p-2 ${currentTool === "pan" ? "bg-gray-300" : ""}`}
        >
          Pan
        </button>
        <button
          onClick={() => handleToolChange("draw")}
          className={`mr-2 p-2 ${currentTool === "draw" ? "bg-gray-300" : ""}`}
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => handleToolChange("measure")}
          className={`mr-2 p-2 ${currentTool === "measure" ? "bg-gray-300" : ""}`}
        >
          <Ruler size={20} />
        </button>
        <button
          onClick={() => handleToolChange("erase")}
          className={`mr-2 p-2 ${currentTool === "erase" ? "bg-gray-300" : ""}`}
        >
          <Eraser size={20} />
        </button>
        <button onClick={zoomIn} className="mr-2 p-2">
          Zoom In
        </button>
        <button onClick={zoomOut} className="mr-2 p-2">
          Zoom Out
        </button>
      </div>
      <div style={{ position: "relative" }}>
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading PDF...</div>}
          error={<div>Error loading PDF. Please try again.</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
        <canvas
          ref={canvasRef}
          width={612 * scale}
          height={792 * scale}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: currentTool === "pan" ? "none" : "auto",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="mt-4">
        <button disabled={pageNumber <= 1} onClick={() => changePage(-1)} className="mr-2">
          <ChevronLeft size={20} />
        </button>
        <span>
          Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}
        </span>
        <button disabled={numPages !== null && pageNumber >= numPages} onClick={() => changePage(1)} className="ml-2">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

export default PlanViewer

