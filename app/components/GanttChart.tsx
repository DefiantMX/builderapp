"use client"

import { useEffect, useRef, useState } from 'react'
import EditEventModal from './EditEventModal'

interface Event {
  id: string
  title: string
  startDate: Date | string
  endDate: Date | string | null
  status: string
  description: string | null
  assignee?: string
  percentComplete?: number
  priority: number
}

interface GanttChartProps {
  events: Event[]
  projectId: string
}

const COLORS = {
  blue: { bar: '#3B82F6', light: '#93C5FD' },
  green: { bar: '#10B981', light: '#6EE7B7' },
  purple: { bar: '#8B5CF6', light: '#C4B5FD' },
  pink: { bar: '#EC4899', light: '#F9A8D4' }
}

export default function GanttChart({ events: initialEvents, projectId }: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [dragY, setDragY] = useState<number | null>(null)

  // Store event positions for click and drag detection
  const eventPositionsRef = useRef<Array<{
    event: Event
    x: number
    y: number
    width: number
    height: number
  }>>([])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const clickedEvent = eventPositionsRef.current.find(({ x: eventX, y: eventY, width, height }) => {
      return x >= eventX && x <= eventX + width && y >= eventY && y <= eventY + height
    })

    if (clickedEvent) {
      setDraggedEvent(clickedEvent.event)
      setDragY(y)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedEvent || dragY === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleY = canvas.height / rect.height
    const y = (e.clientY - rect.top) * scaleY

    // Calculate the difference in rows
    const rowHeight = 70
    const rowDiff = Math.round((y - dragY) / rowHeight)
    
    if (rowDiff !== 0) {
      const oldIndex = events.findIndex(e => e.id === draggedEvent.id)
      const newIndex = Math.max(0, Math.min(events.length - 1, oldIndex + rowDiff))
      
      if (oldIndex !== newIndex) {
        const newEvents = [...events]
        const [movedEvent] = newEvents.splice(oldIndex, 1)
        newEvents.splice(newIndex, 0, movedEvent)
        
        // Update priorities
        const updatedEvents = newEvents.map((event, index) => ({
          ...event,
          priority: index
        }))
        
        setEvents(updatedEvents)
        setDragY(y)
      }
    }
  }

  const handleCanvasMouseUp = async () => {
    if (draggedEvent) {
      // Find the updated event
      const updatedEvent = events.find(e => e.id === draggedEvent.id)
      if (updatedEvent) {
        try {
          // Update the priority in the database
          const response = await fetch(`/api/projects/${projectId}/events/${draggedEvent.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priority: updatedEvent.priority }),
          })

          if (!response.ok) {
            throw new Error('Failed to update event priority')
          }
        } catch (error) {
          console.error('Error updating event priority:', error)
          // Revert to initial events if the update fails
          setEvents(initialEvents)
        }
      }
    }
    setDraggedEvent(null)
    setDragY(null)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedEvent) return // Don't open modal if we were dragging

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const clickedEvent = eventPositionsRef.current.find(({ x: eventX, y: eventY, width, height }) => {
      return x >= eventX && x <= eventX + width && y >= eventY && y <= eventY + height
    })

    if (clickedEvent) {
      setSelectedEvent(clickedEvent.event)
      setIsModalOpen(true)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas and positions
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    eventPositionsRef.current = []

    // Set dimensions
    const leftPadding = 300
    const rightPadding = 60
    const topPadding = 80
    const rowHeight = 70
    const barHeight = 40
    const dayWidth = 30

    // Calculate date range
    const dates = events.flatMap(event => [
      new Date(event.startDate),
      event.endDate ? new Date(event.endDate) : new Date(event.startDate)
    ])
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    minDate.setDate(1)
    maxDate.setMonth(maxDate.getMonth() + 1, 0)

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    
    canvas.width = leftPadding + (totalDays * dayWidth) + rightPadding
    canvas.height = topPadding + (events.length * rowHeight) + 40

    // Draw background
    ctx.fillStyle = draggedEvent ? '#F3F4F6' : '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1

    // Draw vertical month lines and labels
    let currentDate = new Date(minDate)
    while (currentDate <= maxDate) {
      const x = leftPadding + ((currentDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth
      
      ctx.beginPath()
      ctx.moveTo(x, topPadding)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()

      ctx.fillStyle = '#374151'
      ctx.font = 'bold 28px Inter'
      ctx.fillText(
        currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        x + 10,
        40
      )

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Draw horizontal row lines
    for (let i = 0; i <= events.length; i++) {
      const y = topPadding + (i * rowHeight)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw left column headers
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 28px Inter'
    ctx.fillText('% Complete', 20, 45)
    ctx.fillText('Task', leftPadding - 250, 45)

    // Draw events
    events.forEach((event, index) => {
      const y = topPadding + (index * rowHeight) + 15
      const startX = leftPadding + ((new Date(event.startDate).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth
      const endX = event.endDate 
        ? leftPadding + ((new Date(event.endDate).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth
        : startX + (dayWidth * 5)

      // Store event position for click detection
      eventPositionsRef.current.push({
        event,
        x: startX,
        y,
        width: endX - startX,
        height: barHeight
      })

      // Highlight dragged event
      if (draggedEvent?.id === event.id) {
        ctx.fillStyle = '#E5E7EB'
        ctx.fillRect(0, y - 15, canvas.width, rowHeight)
      }

      // Draw completion percentage
      ctx.fillStyle = '#6B7280'
      ctx.font = '28px Inter'
      ctx.textAlign = 'right'
      ctx.fillText(`${event.percentComplete || 0}%`, leftPadding - 220, y + 25)

      // Draw task title
      ctx.fillStyle = '#111827'
      ctx.font = '28px Inter'
      ctx.textAlign = 'left'
      ctx.fillText(event.title, leftPadding - 200, y + 25)

      // Calculate color based on index
      const colorKeys = Object.keys(COLORS)
      const color = COLORS[colorKeys[index % colorKeys.length] as keyof typeof COLORS]

      // Draw progress bar background
      ctx.fillStyle = color.light
      ctx.fillRect(startX, y, endX - startX, barHeight)

      // Draw progress bar foreground (completed portion)
      ctx.fillStyle = color.bar
      ctx.fillRect(
        startX,
        y,
        (endX - startX) * ((event.percentComplete || 0) / 100),
        barHeight
      )

      // Draw assignee name
      if (event.assignee) {
        ctx.fillStyle = '#6B7280'
        ctx.font = '24px Inter'
        ctx.fillText(event.assignee, endX + 15, y + 25)
      }
    })

  }, [events, draggedEvent])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto relative">
      <canvas
        ref={canvasRef}
        height={Math.max(200, 80 + events.length * 70)}
        className="w-full cursor-move"
        style={{ minWidth: '1200px' }}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />
      {selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          projectId={projectId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}

