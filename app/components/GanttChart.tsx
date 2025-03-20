"use client"

import { useRef, useEffect } from "react"
import type React from "react"

export const TASK_CATEGORIES = {
  1: { name: "Planning", color: "#FFD700" },
  2: { name: "In Progress", color: "#90EE90" },
  3: { name: "Inspection", color: "#FFA07A" },
  4: { name: "Critical", color: "#FF6B6B" },
  5: { name: "Complete", color: "#87CEEB" },
}

type Task = {
  id: number
  title: string
  startDate: string
  endDate: string
  status: string
  dependencies?: number[]
  category?: 1 | 2 | 3 | 4 | 5
}

type GanttChartProps = {
  tasks: Task[]
  scale?: number
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

const GanttChart: React.FC<GanttChartProps> = ({ tasks, scale = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        drawGanttChart(ctx, tasks)
      }
    }
  }, [tasks])

  const drawGanttChart = (ctx: CanvasRenderingContext2D, tasks: Task[]) => {
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Chart dimensions
    const chartTop = 60 // Space for headers
    const chartBottom = height - 40 // Space for legend
    const chartHeight = chartBottom - chartTop
    const taskHeight = Math.min(30, (chartHeight - tasks.length * 5) / tasks.length)
    const monthWidth = (width / 12) * scale

    // Draw background grid
    ctx.strokeStyle = "#E5E7EB"
    ctx.lineWidth = 1

    // Vertical lines (months)
    for (let i = 0; i <= 12; i++) {
      const x = (i * width * scale) / 12
      ctx.beginPath()
      ctx.moveTo(x, chartTop)
      ctx.lineTo(x, chartBottom)
      ctx.stroke()
    }

    // Horizontal lines (tasks)
    for (let i = 0; i <= tasks.length; i++) {
      const y = chartTop + (i * chartHeight) / tasks.length
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width * scale, y)
      ctx.stroke()
    }

    // Draw quarters
    ctx.fillStyle = "#6B7280"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    QUARTERS.forEach((quarter, i) => {
      const x = (i * width * scale) / 4 + (width * scale) / 8
      ctx.fillText(quarter, x, 25)
    })

    // Draw months
    MONTHS.forEach((month, i) => {
      const x = (i * width * scale) / 12 + (width * scale) / 24
      ctx.fillText(month, x, 50)
    })

    // Draw tasks
    tasks.forEach((task, index) => {
      const startDate = new Date(task.startDate)
      const endDate = new Date(task.endDate)

      const startMonth = startDate.getMonth()
      const endMonth = endDate.getMonth()
      const startDay = startDate.getDate()
      const endDay = endDate.getDate()

      const x = (startMonth * width * scale) / 12 + (startDay * width * scale) / (12 * 31)
      const taskWidth =
        ((endMonth - startMonth) * width * scale) / 12 + ((endDay - startDay) * width * scale) / (12 * 31)
      const y = chartTop + (index * chartHeight) / tasks.length + 5

      // Draw task bar
      ctx.fillStyle = task.category ? TASK_CATEGORIES[task.category].color : TASK_CATEGORIES[1].color
      ctx.beginPath()
      ctx.roundRect(x, y, taskWidth, taskHeight - 10, 5)
      ctx.fill()

      // Draw task label
      ctx.fillStyle = "#374151"
      ctx.textAlign = "right"
      ctx.fillText(task.title, x - 10, y + taskHeight / 2)

      // Draw dependencies
      if (task.dependencies) {
        task.dependencies.forEach((depId) => {
          const depTask = tasks.find((t) => t.id === depId)
          if (depTask) {
            const depIndex = tasks.indexOf(depTask)
            const depY = chartTop + (depIndex * chartHeight) / tasks.length + taskHeight / 2 - 5
            const depEndX = (new Date(depTask.endDate).getMonth() * width * scale) / 12

            ctx.strokeStyle = "#9CA3AF"
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(depEndX, depY)
            ctx.lineTo(x, y + taskHeight / 2 - 5)
            ctx.stroke()
            ctx.setLineDash([])
          }
        })
      }
    })

    // Draw legend
    const legendY = height - 30
    const legendWidth = width / 5
    Object.entries(TASK_CATEGORIES).forEach(([category, { name, color }], index) => {
      const x = index * legendWidth + 20

      // Draw color box
      ctx.fillStyle = color
      ctx.fillRect(x, legendY, 15, 15)

      // Draw label
      ctx.fillStyle = "#374151"
      ctx.textAlign = "left"
      ctx.fillText(name, x + 25, legendY + 12)
    })
  }

  return (
    <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto bg-white" style={{ maxWidth: "100%" }} />
  )
}

export default GanttChart

