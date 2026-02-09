"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, Trash2, Plus } from "lucide-react"

export interface ScheduleEvent {
  id: string
  title: string
  description?: string | null
  startDate: Date | string
  endDate?: Date | null
  status: string
  percentComplete: number
  priority: number
  assignee?: string | null
  parentId?: string | null
  predecessorIds?: string[]
}

interface ScheduleGridProps {
  events: ScheduleEvent[]
  projectId: string
  onEventsChange: () => void // refresh parent data after updates
}

const STATUS_OPTIONS = ["Scheduled", "In Progress", "Completed", "On Hold"]

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

function getDurationDays(start: Date | string, end: Date | string | null): number {
  if (!end) return 0
  const s = typeof start === "string" ? new Date(start) : start
  const e = typeof end === "string" ? new Date(end) : end
  const ms = e.getTime() - s.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export default function ScheduleGrid({ events: initialEvents, projectId, onEventsChange }: ScheduleGridProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents)
  const [editingCell, setEditingCell] = useState<{ eventId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const patchEvent = useCallback(
    async (eventId: string, data: Record<string, unknown>) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/projects/${projectId}/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Update failed")
        const updated = await res.json()
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...updated } : e)))
        onEventsChange()
      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
        setEditingCell(null)
      }
    },
    [projectId, onEventsChange]
  )

  const startEdit = (eventId: string, field: string, current: string | number) => {
    setEditingCell({ eventId, field })
    setEditValue(String(current))
  }

  const saveEdit = (eventId: string, field: string) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return
    if (editValue === String((event as Record<string, unknown>)[field])) {
      setEditingCell(null)
      return
    }
    if (field === "percentComplete") {
      const n = parseInt(editValue, 10)
      if (!Number.isNaN(n) && n >= 0 && n <= 100) patchEvent(eventId, { percentComplete: n })
      else setEditingCell(null)
      return
    }
    if (field === "startDate" || field === "endDate") {
      patchEvent(eventId, { [field]: editValue || null })
      return
    }
    if (field === "title" || field === "assignee") {
      patchEvent(eventId, { [field]: editValue })
      return
    }
    if (field === "status") {
      if (STATUS_OPTIONS.includes(editValue)) patchEvent(eventId, { status: editValue })
      else setEditingCell(null)
      return
    }
    if (field === "predecessorIds") {
      const ids = editValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      patchEvent(eventId, { predecessorIds: ids })
      return
    }
    setEditingCell(null)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Delete this task?")) return
    try {
      const res = await fetch(`/api/projects/${projectId}/events/${eventId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      onEventsChange()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddTask = async () => {
    setAdding(true)
    try {
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + 7)
      const res = await fetch(`/api/projects/${projectId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Task",
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          status: "Scheduled",
          priority: events.length,
        }),
      })
      if (!res.ok) throw new Error("Create failed")
      const created = await res.json()
      setEvents((prev) => [...prev, { ...created, predecessorIds: created.predecessorIds ?? [] }])
      onEventsChange()
      startEdit(created.id, "title", "New Task")
    } catch (e) {
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  const isEditing = (eventId: string, field: string) =>
    editingCell?.eventId === eventId && editingCell?.field === field

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-8 border-r border-gray-200" />
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200">
                Task name
              </th>
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[120px]">
                Start
              </th>
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[120px]">
                End
              </th>
              <th className="text-right px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[80px]">
                Duration
              </th>
              <th className="text-right px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[90px]">
                % Complete
              </th>
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[120px]">
                Status
              </th>
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[100px]">
                Assignee
              </th>
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-700 border-r border-gray-200 w-[120px]">
                Predecessors
              </th>
              <th className="w-10 px-2 py-2.5 border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-gray-100 hover:bg-gray-50/80 group"
              >
                <td className="px-1 py-1 border-r border-gray-100 text-gray-400 cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "title") ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "title")}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(event.id, "title")}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left text-sm text-gray-900 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() => startEdit(event.id, "title", event.title)}
                    >
                      {event.title || "—"}
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "startDate") ? (
                    <Input
                      type="date"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "startDate")}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(event.id, "startDate")}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() => startEdit(event.id, "startDate", formatDate(event.startDate))}
                    >
                      {formatDate(event.startDate)}
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "endDate") ? (
                    <Input
                      type="date"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "endDate")}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(event.id, "endDate")}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() =>
                        startEdit(
                          event.id,
                          "endDate",
                          event.endDate ? formatDate(event.endDate) : ""
                        )
                      }
                    >
                      {event.endDate ? formatDate(event.endDate) : "—"}
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100 text-right text-sm text-gray-600">
                  {getDurationDays(event.startDate, event.endDate ?? null)}d
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "percentComplete") ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "percentComplete")}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(event.id, "percentComplete")}
                      className="h-8 text-sm w-16 text-right"
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-right text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() =>
                        startEdit(event.id, "percentComplete", event.percentComplete ?? 0)
                      }
                    >
                      {event.percentComplete ?? 0}%
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "status") ? (
                    <select
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "status")}
                      className="h-8 text-sm border rounded px-2 w-full"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left text-sm hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() => startEdit(event.id, "status", event.status)}
                    >
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          event.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : event.status === "In Progress"
                              ? "bg-amber-100 text-amber-800"
                              : event.status === "On Hold"
                                ? "bg-gray-200 text-gray-700"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "assignee") ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "assignee")}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(event.id, "assignee")}
                      className="h-8 text-sm"
                      placeholder="Name"
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left text-sm text-gray-600 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() =>
                        startEdit(event.id, "assignee", event.assignee ?? "")
                      }
                    >
                      {event.assignee ?? "—"}
                    </button>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100">
                  {isEditing(event.id, "predecessorIds") ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(event.id, "predecessorIds")}
                      onKeyDown={(e) =>
                        e.key === "Enter" && saveEdit(event.id, "predecessorIds")
                      }
                      className="h-8 text-sm"
                      placeholder="ID1, ID2"
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left text-sm text-gray-600 hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                      onClick={() =>
                        startEdit(
                          event.id,
                          "predecessorIds",
                          (event.predecessorIds ?? []).join(", ")
                        )
                      }
                    >
                      {(event.predecessorIds ?? []).length
                        ? (event.predecessorIds ?? []).join(", ")
                        : "—"}
                    </button>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTask}
          disabled={adding || saving}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adding…" : "Add task"}
        </Button>
      </div>
    </div>
  )
}
