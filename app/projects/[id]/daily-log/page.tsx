"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import DailyLogForm from "@/app/components/DailyLogForm"
import { Sun, FileText, AlertTriangle, User, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"

interface DailyLogEntry {
  id: string
  date: string
  content: string
  author: string
  currentConditions: string
  incidentReport: string
  imageUrl?: string
}

interface Project {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  dailyLogs: DailyLogEntry[]
}

export default function DailyLogPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedEntries, setExpandedEntries] = useState<number[]>([])

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

  const handleNewEntry = (entry: DailyLogEntry) => {
    setProject(prev => {
      if (!prev) return null
      return {
        ...prev,
        dailyLogs: [...prev.dailyLogs, entry]
      }
    })
  }

  const toggleExpand = (id: number) => {
    setExpandedEntries((prev) => (prev.includes(id) ? prev.filter((entryId) => entryId !== id) : [...prev, id]))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Log</h1>
      </div>

      <DailyLogForm projectId={project.id} onNewEntry={handleNewEntry} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Log Entries</h2>
        {(!project.dailyLogs || project.dailyLogs.length === 0) ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No log entries yet</h3>
            <p className="text-gray-500">Add your first log entry to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {project.dailyLogs.map((entry) => (
              <div key={entry.id} className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {format(new Date(entry.date), 'MMMM d, yyyy')}
                    </h3>
                    <p className="text-sm text-gray-500">By {entry.author}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(entry.date), 'h:mm a')}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Current Conditions</h4>
                  <p className="text-gray-600">{entry.currentConditions}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Log Entry</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{entry.content}</p>
                </div>

                {entry.incidentReport && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Incident Report</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{entry.incidentReport}</p>
                  </div>
                )}

                {entry.imageUrl && (
                  <div className="mt-4">
                    <img
                      src={entry.imageUrl}
                      alt="Daily log image"
                      className="max-w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Link
        href={`/projects/${params.id}`}
        className="mt-8 inline-block text-blue-500 hover:text-blue-700 font-semibold hover:underline"
      >
        ← Back to Project
      </Link>
    </div>
  )
}

