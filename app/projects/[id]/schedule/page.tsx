"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

type Event = {
  id: number
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  status: string
  projectId: number
  createdAt: string
  updatedAt: string
}

export default function ProjectSchedulePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Scheduled",
  })
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchEvents()
    }
  }, [status, params.id])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/schedule`)
      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError("Error loading schedule")
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${params.id}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      })

      if (!response.ok) {
        throw new Error("Failed to create event")
      }

      const createdEvent = await response.json()
      setEvents([...events, createdEvent])
      setIsAddingEvent(false)
      setNewEvent({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "Scheduled",
      })
    } catch (err) {
      setError("Error creating event")
      console.error("Error:", err)
    }
  }

  const handleDelete = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${params.id}/schedule/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete event")
      }

      setEvents(events.filter((event) => event.id !== eventId))
    } catch (err) {
      setError("Error deleting event")
      console.error("Error:", err)
    }
  }

  const handleStatusChange = async (eventId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/schedule/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update event")
      }

      const updatedEvent = await response.json()
      setEvents(events.map((event) => (event.id === eventId ? updatedEvent : event)))
    } catch (err) {
      setError("Error updating event")
      console.error("Error:", err)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsByDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate)
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      )
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1))))
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href={`/projects/${params.id}`} className="text-blue-600 hover:text-blue-800">
              ← Back to Project
            </Link>
            <h1 className="text-2xl font-bold mt-2">Project Schedule</h1>
          </div>
          <button
            onClick={() => setIsAddingEvent(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isAddingEvent && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}

            {Array.from({ length: 42 }, (_, i) => {
              const dayOffset = i - getFirstDayOfMonth(currentDate)
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 + dayOffset)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const dayEvents = getEventsByDate(date)

              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-2 ${
                    isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                  }`}
                >
                  <div className="font-medium mb-1">{date.getDate()}</div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded ${
                          event.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : event.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {events
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map((event) => (
                <div key={event.id} className="bg-white shadow-md rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-medium">{event.title}</h4>
                      {event.description && (
                        <p className="text-gray-600 mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center mt-2 space-x-4">
                        <p className="text-sm text-gray-500">
                          Start: {new Date(event.startDate).toLocaleString()}
                        </p>
                        {event.endDate && (
                          <p className="text-sm text-gray-500">
                            End: {new Date(event.endDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

