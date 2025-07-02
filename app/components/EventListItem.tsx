'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'

interface Event {
  id: string
  title: string
  description?: string | null
  startDate: Date
  endDate?: Date | null
  status: string
  percentComplete: number
  priority?: number
}

interface EventListItemProps {
  event: Event
  projectId: string
  onUpdate: (eventId: string, percentComplete: number) => void
  onDelete?: (eventId: string) => void
}

export default function EventListItem({ event, projectId, onUpdate, onDelete }: EventListItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [progress, setProgress] = useState(event.percentComplete)
  const [isLoading, setIsLoading] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: event.title,
    description: event.description || '',
    startDate: new Date(event.startDate).toISOString().split('T')[0],
    endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
    status: event.status,
    priority: event.priority || 0,
    percentComplete: event.percentComplete
  })

  const handleProgressChange = async (value: number[]) => {
    const newProgress = value[0]
    setProgress(newProgress)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentComplete: newProgress }),
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      onUpdate(event.id, newProgress)
    } catch (error) {
      console.error('Error updating progress:', error)
      // Revert progress on error
      setProgress(event.percentComplete)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Failed to update event')
      }

      const updatedEvent = await response.json()
      
      // Update local state
      setProgress(updatedEvent.percentComplete)
      setIsEditMode(false)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/projects/${projectId}/events/${event.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete event')
        }

        onDelete(event.id)
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <>
      <div className="flex items-start justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
        <div 
          onClick={() => setIsDialogOpen(true)}
          className="flex-1 cursor-pointer"
        >
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          {event.description && (
            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
          )}
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {new Date(event.startDate).toLocaleString()}
            {event.endDate && (
              <>
                <span className="mx-2">→</span>
                {new Date(event.endDate).toLocaleString()}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-32">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${event.percentComplete}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{event.percentComplete}%</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            event.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
            event.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
            event.status === 'Completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {event.status}
          </span>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditMode(true)
              }}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit event"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress - {event.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Progress</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[progress]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{progress}%</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={editForm.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={editForm.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select
                  name="priority"
                  value={editForm.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>None</option>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Progress (%)</label>
              <input
                type="number"
                name="percentComplete"
                value={editForm.percentComplete}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 