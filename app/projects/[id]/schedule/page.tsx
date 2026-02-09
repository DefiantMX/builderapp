'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import GanttChart from "@/app/components/GanttChart"
import EventListItem from "@/app/components/EventListItem"
import ScheduleExportPDF from "@/app/components/ScheduleExportPDF"
import ScheduleGrid, { type ScheduleEvent } from "@/app/components/ScheduleGrid"
import { LayoutGrid, GanttChartIcon, List } from "lucide-react"

interface Event {
  id: string
  title: string
  description?: string | null
  startDate: Date
  endDate?: Date | null
  status: string
  percentComplete: number
  priority?: number
  assignee?: string | null
  predecessorIds?: string[]
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

type ScheduleView = "grid" | "gantt" | "list"

export default function SchedulePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ScheduleView>("grid")

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

  const refreshData = () => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setProject(data))
  }

  const eventsForGrid: ScheduleEvent[] = project.events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    startDate: e.startDate,
    endDate: e.endDate ?? null,
    status: e.status,
    percentComplete: e.percentComplete,
    priority: e.priority ?? 0,
    assignee: (e as Event).assignee ?? null,
    parentId: null,
    predecessorIds: (e as Event).predecessorIds ?? [],
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Project Schedule</h1>
        <div className="flex flex-wrap items-center gap-3">
          {project.events.length > 0 && (
            <>
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "grid" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                  title="Sheet view"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setView("gantt")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "gantt" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                  title="Timeline view"
                >
                  <GanttChartIcon className="h-4 w-4" />
                  Gantt
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === "list" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
              <ScheduleExportPDF
                events={project.events}
                projectName={project.name}
                projectId={project.id}
              />
            </>
          )}
          <Link
            href={`/projects/${params.id}/schedule/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add task
          </Link>
        </div>
      </div>

      {project.events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500 mb-4">Add your first task to keep the project on track</p>
          <Link
            href={`/projects/${params.id}/schedule/new`}
            className="text-blue-600 hover:text-blue-700"
          >
            Add your first task →
          </Link>
        </div>
      ) : view === "grid" ? (
        <ScheduleGrid
          events={eventsForGrid}
          projectId={project.id}
          onEventsChange={refreshData}
        />
      ) : view === "gantt" ? (
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">Drag bars to move; drag left/right edges to resize. Drag vertically to reorder.</p>
          <GanttChart
            events={project.events.map((e) => ({
              id: e.id,
              title: e.title,
              description: e.description ?? null,
              startDate: e.startDate,
              endDate: e.endDate ?? null,
              status: e.status,
              percentComplete: e.percentComplete,
              priority: e.priority ?? 0,
              assignee: (e as Event).assignee ?? undefined,
            }))}
            projectId={project.id}
          />
        </div>
      ) : (
        <div>
          {Object.entries(groupedEvents).map(([monthYear, events]) => (
            <div key={monthYear} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">{monthYear}</h3>
              <div className="space-y-4">
                {events.map((event) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    projectId={project.id}
                    onUpdate={() => router.refresh()}
                    onDelete={() => router.refresh()}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

