"use client"

import { useState } from "react"

interface Event {
  id: string
  title: string
  startDate: string
  endDate: string | null
  status: string
  description: string | null
  assignee?: string
  percentComplete?: number
}

interface EditEventModalProps {
  event: Event
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export default function EditEventModal({ event, projectId, isOpen, onClose }: EditEventModalProps) {
  const [percentComplete, setPercentComplete] = useState(event.percentComplete || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      console.log('Submitting update for project:', projectId, 'event:', event.id)
      const response = await fetch(`/api/projects/${projectId}/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ percentComplete }),
      })

      if (!response.ok) {
        throw new Error("Failed to update event")
      }

      onClose()
    } catch (err) {
      console.error("Error updating event:", err)
      setError("Failed to update event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Edit Event: {event.title}</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Percent Complete
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={percentComplete}
                onChange={(e) => setPercentComplete(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium w-12">{percentComplete}%</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 