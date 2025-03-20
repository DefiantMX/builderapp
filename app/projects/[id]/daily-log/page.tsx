"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import DailyLogForm from "../../../components/DailyLogForm"
import { Sun, FileText, AlertTriangle, User, Calendar, ChevronDown, ChevronUp } from "lucide-react"

type DailyLogEntry = {
  id: number
  date: string
  content: string
  author: string
  currentConditions: string
  incidentReport: string
  imageUrl?: string
}

export default function DailyLog({ params }: { params: { id: string } }) {
  const [entries, setEntries] = useState<DailyLogEntry[]>([])
  const [expandedEntries, setExpandedEntries] = useState<number[]>([])

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/daily-log`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Error fetching daily log entries:", error)
    }
  }

  const handleNewEntry = (newEntry: DailyLogEntry) => {
    setEntries([newEntry, ...entries])
  }

  const toggleExpand = (id: number) => {
    setExpandedEntries((prev) => (prev.includes(id) ? prev.filter((entryId) => entryId !== id) : [...prev, id]))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Daily Log for Project {params.id}</h1>
      <DailyLogForm projectId={params.id} onNewEntry={handleNewEntry} />
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Entries</h2>
        {entries.length === 0 ? (
          <p className="text-gray-600">No entries yet.</p>
        ) : (
          <ul className="space-y-6">
            {entries.map((entry) => (
              <li key={entry.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-lg text-gray-800 flex items-center">
                        <Calendar className="mr-2" size={18} />
                        {new Date(entry.date).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <User className="mr-2" size={16} />
                        {entry.author}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      {expandedEntries.includes(entry.id) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </button>
                  </div>
                  <div className="flex items-center text-gray-700 mb-2">
                    <Sun className="mr-2" size={18} />
                    <p>{entry.currentConditions}</p>
                  </div>
                  {expandedEntries.includes(entry.id) && (
                    <>
                      <div className="mt-4">
                        <p className="font-semibold flex items-center text-gray-700 mb-2">
                          <FileText className="mr-2" size={18} />
                          Log Entry:
                        </p>
                        <p className="text-gray-600">{entry.content}</p>
                      </div>
                      {entry.incidentReport && (
                        <div className="mt-4">
                          <p className="font-semibold flex items-center text-gray-700 mb-2">
                            <AlertTriangle className="mr-2" size={18} />
                            Incident Report:
                          </p>
                          <p className="text-gray-600">{entry.incidentReport}</p>
                        </div>
                      )}
                      {entry.imageUrl && (
                        <div className="mt-4">
                          <Image
                            src={entry.imageUrl || "/placeholder.svg"}
                            alt="Daily log image"
                            width={400}
                            height={300}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
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

