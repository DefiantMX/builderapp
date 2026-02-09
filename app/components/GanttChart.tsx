"use client"

import { useEffect, useRef, useState } from 'react'
import EditEventModal from './EditEventModal'

export interface GanttEvent {
  id: string
  title: string
  startDate: Date | string
  endDate: Date | string | null
  status: string
  description: string | null
  assignee?: string
  percentComplete?: number
  priority: number
  parentId?: string | null
}

interface GanttChartProps {
  events: GanttEvent[]
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
  const [selectedEvent, setSelectedEvent] = useState<GanttEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<GanttEvent[]>(initialEvents)
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set())
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])
  type DragMode = 'row' | 'move' | 'resize-start' | 'resize-end'
  const [draggedEvent, setDraggedEvent] = useState<GanttEvent | null>(null)
  const [dragY, setDragY] = useState<number | null>(null)
  const [dragMode, setDragMode] = useState<DragMode | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; startDate: Date; endDate: Date; barStartX: number; barWidth: number } | null>(null)

  // Flatten hierarchy for display (parent then children, with depth)
  const flattenedEvents = (() => {
    const byParent = new Map<string | null, GanttEvent[]>()
    events.forEach((e) => {
      const key = e.parentId ?? null
      if (!byParent.has(key)) byParent.set(key, [])
      byParent.get(key)!.push(e)
    })
    const ordered = events.slice().sort((a, b) => a.priority - b.priority)
    const result: { event: GanttEvent; depth: number }[] = []
    function add(parentId: string | null, depth: number) {
      const children = (byParent.get(parentId) ?? []).slice()
      children.sort((a, b) => {
        const aIdx = ordered.findIndex((e) => e.id === a.id)
        const bIdx = ordered.findIndex((e) => e.id === b.id)
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
      })
      children.forEach((ev) => {
        const isParent = byParent.has(ev.id)
        const isCollapsed = isParent && collapsedParents.has(ev.id)
        result.push({ event: ev, depth })
        if (isParent && !isCollapsed) add(ev.id, depth + 1)
      })
    }
    add(null, 0)
    return result
  })()

  const displayEvents = flattenedEvents.map(({ event }) => event)
  const eventDepths = new Map(flattenedEvents.map(({ event, depth }) => [event.id, depth]))
  const hasChildren = new Set(events.filter((e) => e.parentId).map((e) => e.parentId))

  // Store event positions and timeline scale for drag-to-resize/move
  const eventPositionsRef = useRef<Array<{
    event: GanttEvent
    x: number
    y: number
    width: number
    height: number
  }>>([])
  const timelineRef = useRef<{ leftPadding: number; minDate: Date; dayWidth: number } | null>(null)

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const clicked = eventPositionsRef.current.find(({ x: eventX, y: eventY, width, height }) => {
      return x >= eventX && x <= eventX + width && y >= eventY && y <= eventY + height
    })

    if (clicked) {
      const barStartX = clicked.x
      const barWidth = clicked.width
      const relX = (x - barStartX) / barWidth
      const startDate = new Date(clicked.event.startDate)
      const endDate = clicked.event.endDate ? new Date(clicked.event.endDate) : new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000)
      setDraggedEvent(clicked.event)
      setDragY(y)
      setDragMode(null)
      dragStartRef.current = {
        x,
        y,
        startDate,
        endDate,
        barStartX,
        barWidth,
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedEvent || dragStartRef.current === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const deltaX = x - dragStartRef.current.x
    const deltaY = y - dragStartRef.current.y
    const rowHeight = 70
    const dayWidth = timelineRef.current?.dayWidth ?? 30

    // Decide drag mode on first significant move
    if (dragMode === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          const barStartX = dragStartRef.current.barStartX
          const barWidth = dragStartRef.current.barWidth
          const relX = (dragStartRef.current.x - barStartX) / barWidth
          if (relX < 0.2) setDragMode('resize-start')
          else if (relX > 0.8) setDragMode('resize-end')
          else setDragMode('move')
        } else {
          setDragMode('row')
        }
      }
    }

    const mode = dragMode

    if (mode === 'row' && dragY !== null) {
      const rowHeight = 44
      const rowDiff = Math.round((y - dragY) / rowHeight)
      if (rowDiff !== 0) {
        const oldIndex = displayEvents.findIndex((ev) => ev.id === draggedEvent.id)
        const newIndex = Math.max(0, Math.min(displayEvents.length - 1, oldIndex + rowDiff))
        if (oldIndex !== newIndex) {
          const reordered = [...displayEvents]
          const [moved] = reordered.splice(oldIndex, 1)
          reordered.splice(newIndex, 0, moved)
          setEvents(reordered.map((ev, i) => ({ ...ev, priority: i })))
          setDragY(y)
        }
      }
      return
    }

    if ((mode === 'move' || mode === 'resize-start' || mode === 'resize-end') && dayWidth > 0) {
      const dayDelta = Math.round(deltaX / dayWidth)
      if (dayDelta === 0) return

      setEvents(prev => prev.map(ev => {
        if (ev.id !== draggedEvent.id) return ev
        const start = new Date(ev.startDate)
        const end = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000)
        if (mode === 'move') {
          start.setDate(start.getDate() + dayDelta)
          end.setDate(end.getDate() + dayDelta)
        } else if (mode === 'resize-start') {
          start.setDate(start.getDate() + dayDelta)
          if (start >= end) end.setTime(start.getTime() + 24 * 60 * 60 * 1000)
        } else {
          end.setDate(end.getDate() + dayDelta)
          if (end <= start) start.setTime(end.getTime() - 24 * 60 * 60 * 1000)
        }
        return {
          ...ev,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
        }
      }))
      dragStartRef.current = { ...dragStartRef.current, x, y }
    }
  }

  const handleCanvasMouseUp = async () => {
    if (draggedEvent) {
      if (dragMode !== null) didDragRef.current = true
      const updatedEvent = events.find(e => e.id === draggedEvent.id)
      if (updatedEvent) {
        try {
          const payload: Record<string, unknown> = { priority: updatedEvent.priority }
          if (dragMode === 'move' || dragMode === 'resize-start' || dragMode === 'resize-end') {
            payload.startDate = new Date(updatedEvent.startDate).toISOString().slice(0, 10)
            payload.endDate = updatedEvent.endDate ? new Date(updatedEvent.endDate).toISOString().slice(0, 10) : null
          }
          const response = await fetch(`/api/projects/${projectId}/events/${draggedEvent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!response.ok) throw new Error('Failed to update')
        } catch (err) {
          console.error(err)
          setEvents(initialEvents)
        }
      }
    }
    setDraggedEvent(null)
    setDragY(null)
    setDragMode(null)
    dragStartRef.current = null
  }

  const didDragRef = useRef(false)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    if (draggedEvent) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const chevron = chevronZonesRef.current.find((z) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h)
    if (chevron) {
      setCollapsedParents((prev) => {
        const next = new Set(prev)
        if (next.has(chevron.eventId)) next.delete(chevron.eventId)
        else next.add(chevron.eventId)
        return next
      })
      return
    }

    const clickedEvent = eventPositionsRef.current.find(({ x: eventX, y: eventY, width, height }) => {
      return x >= eventX && x <= eventX + width && y >= eventY && y <= eventY + height
    })

    if (clickedEvent) {
      setSelectedEvent(clickedEvent.event)
      setIsModalOpen(true)
    }
  }

  const chevronZonesRef = useRef<Array<{ eventId: string; x: number; y: number; w: number; h: number }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    eventPositionsRef.current = []
    chevronZonesRef.current = []

    const leftPadding = 320
    const rightPadding = 80
    const topPadding = 72
    const rowHeight = 44
    const barHeight = 26
    const dayWidth = 24
    const taskColWidth = 200
    const pctColWidth = 72

    // Date range from all events so every bar is visible
    const dates = displayEvents.flatMap((event) => [
      new Date(event.startDate),
      event.endDate ? new Date(event.endDate) : new Date(event.startDate),
    ])
    if (dates.length === 0) return
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
    minDate.setDate(Math.max(1, minDate.getDate() - 3))
    maxDate.setDate(maxDate.getDate() + 7)
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))
    timelineRef.current = { leftPadding, minDate, dayWidth }

    canvas.width = leftPadding + totalDays * dayWidth + rightPadding
    canvas.height = topPadding + displayEvents.length * rowHeight + 24

    ctx.fillStyle = draggedEvent ? '#F9FAFB' : '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1

    // Header row background
    ctx.fillStyle = '#F3F4F6'
    ctx.fillRect(0, 0, canvas.width, topPadding - 2)
    ctx.strokeStyle = '#D1D5DB'
    ctx.beginPath()
    ctx.moveTo(0, topPadding - 2)
    ctx.lineTo(canvas.width, topPadding - 2)
    ctx.stroke()

    // Column headers: % Complete (narrow), then Task (indented for hierarchy)
    ctx.fillStyle = '#374151'
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('% Complete', 12, 22)
    ctx.fillText('Task', pctColWidth + 12, 22)

    // Month labels on timeline
    ctx.font = '10px Inter, system-ui, sans-serif'
    let currentDate = new Date(minDate)
    const monthEnd = new Date(maxDate)
    while (currentDate <= monthEnd) {
      const x = leftPadding + ((currentDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth
      ctx.strokeStyle = '#E5E7EB'
      ctx.beginPath()
      ctx.moveTo(x, topPadding)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
      ctx.fillStyle = '#6B7280'
      ctx.fillText(
        currentDate.toLocaleString('default', { month: 'short', year: '2-digit' }),
        x + 4,
        52
      )
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    for (let i = 0; i <= displayEvents.length; i++) {
      const y = topPadding + i * rowHeight
      ctx.strokeStyle = '#E5E7EB'
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    const minBarWidth = dayWidth * 2

    displayEvents.forEach((event, index) => {
      const y = topPadding + index * rowHeight + (rowHeight - barHeight) / 2
      const depth = eventDepths.get(event.id) ?? 0
      const indent = depth * 18

      const startDay = (new Date(event.startDate).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      const endDay = event.endDate
        ? (new Date(event.endDate).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
        : startDay + 5
      let startX = leftPadding + startDay * dayWidth
      let endX = leftPadding + Math.max(startDay, endDay) * dayWidth
      let barW = endX - startX
      if (barW < minBarWidth) {
        endX = startX + minBarWidth
        barW = minBarWidth
      }

      eventPositionsRef.current.push({ event, x: startX, y, width: barW, height: barHeight })

      if (draggedEvent?.id === event.id) {
        ctx.fillStyle = '#EFF6FF'
        ctx.fillRect(0, topPadding + index * rowHeight, canvas.width, rowHeight)
      }

      // Chevron zone for parents
      const isParent = hasChildren.has(event.id)
      if (isParent) {
        const cx = pctColWidth + 8 + indent
        const cy = topPadding + index * rowHeight + rowHeight / 2
        chevronZonesRef.current.push({ eventId: event.id, x: cx - 10, y: cy - 10, w: 20, h: 20 })
        ctx.fillStyle = collapsedParents.has(event.id) ? '#9CA3AF' : '#4B5563'
        ctx.font = '12px Inter'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(collapsedParents.has(event.id) ? '\u25B6' : '\u25BC', cx, cy)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }

      ctx.fillStyle = '#6B7280'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${event.percentComplete ?? 0}%`, pctColWidth - 8, y + barHeight / 2 + 4)

      ctx.textAlign = 'left'
      const titleX = pctColWidth + 12 + indent + (isParent ? 20 : 0)
      const maxTitleW = leftPadding - titleX - 8
      let titleText = event.title
      if (ctx.measureText(titleText).width > maxTitleW) {
        while (titleText.length > 2 && ctx.measureText(titleText + '\u2026').width > maxTitleW)
          titleText = titleText.slice(0, -1)
        titleText += '\u2026'
      }
      ctx.fillStyle = '#111827'
      ctx.fillText(titleText, titleX, y + barHeight / 2 + 4)

      const colorKeys = Object.keys(COLORS)
      const color = COLORS[colorKeys[index % colorKeys.length] as keyof typeof COLORS]
      ctx.fillStyle = color.light
      ctx.fillRect(startX, y, barW, barHeight)
      const pct = (event.percentComplete ?? 0) / 100
      ctx.fillStyle = color.bar
      ctx.fillRect(startX, y, barW * pct, barHeight)

      if (event.assignee) {
        ctx.fillStyle = '#6B7280'
        ctx.font = '10px Inter'
        ctx.fillText(event.assignee, endX + 8, y + barHeight / 2 + 4)
      }
    })
  }, [displayEvents, draggedEvent, collapsedParents, eventDepths, hasChildren])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto relative">
      <canvas
        ref={canvasRef}
        height={Math.max(200, 80 + displayEvents.length * 44)}
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
          event={{
            ...selectedEvent,
            startDate: typeof selectedEvent.startDate === 'string' ? selectedEvent.startDate : new Date(selectedEvent.startDate).toISOString().slice(0, 10),
            endDate: selectedEvent.endDate
              ? (typeof selectedEvent.endDate === 'string' ? selectedEvent.endDate : new Date(selectedEvent.endDate).toISOString().slice(0, 10))
              : null,
          }}
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

