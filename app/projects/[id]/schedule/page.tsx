'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import GanttChart from "@/app/components/GanttChart"
import EventListItem from "@/app/components/EventListItem"
import ScheduleExportPDF from "@/app/components/ScheduleExportPDF"

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

interface Project {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  events: Event[]
}

export default function SchedulePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          router.push('/projects')
          return
        }
        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error('Error fetching project:', error)
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id, router])

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!project) {
    return null
  }

  // Group events by month and year
  const groupedEvents = project.events.reduce((acc: Record<string, Event[]>, event: Event) => {
    const date = new Date(event.startDate)
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
    
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    acc[monthYear].push(event)
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Schedule</h1>
        <div className="flex gap-3">
          {project.events.length > 0 && (
            <ScheduleExportPDF 
              events={project.events} 
              projectName={project.name} 
              projectId={project.id} 
            />
          )}
          <Link
            href={`/projects/${params.id}/schedule/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Event
          </Link>
        </div>
      </div>

      {project.events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
          <p className="text-gray-500 mb-4">Add your first event to get started</p>
          <Link
            href={`/projects/${params.id}/schedule/new`}
            className="text-blue-600 hover:text-blue-700"
          >
            Add your first event →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Gantt Chart View */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Timeline View</h2>
            <GanttChart events={project.events} projectId={project.id} />
          </div>

          {/* List View */}
          <div>
            <h2 className="text-xl font-semibold mb-4">List View</h2>
            {Object.entries(groupedEvents).map(([monthYear, events]) => (
              <div key={monthYear} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">{monthYear}</h3>
                <div className="space-y-4">
                  {events.map((event) => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      projectId={project.id}
                      onUpdate={(eventId, percentComplete) => {
                        // Refresh the page data
                        router.refresh()
                      }}
                      onDelete={(eventId) => {
                        // Refresh the page data
                        router.refresh()
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

