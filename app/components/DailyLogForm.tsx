"use client"

import type React from "react"
import { useState, useRef } from "react"
import { CloudUpload, Sun, FileText, User, AlertTriangle } from "lucide-react"

type DailyLogEntry = {
  id: number
  date: string
  content: string
  author: string
  currentConditions: string
  incidentReport: string
  imageUrl?: string
}

type DailyLogFormProps = {
  projectId: string
  onNewEntry: (entry: DailyLogEntry) => void
}

export default function DailyLogForm({ projectId, onNewEntry }: DailyLogFormProps) {
  const [content, setContent] = useState("")
  const [author, setAuthor] = useState("")
  const [currentConditions, setCurrentConditions] = useState("")
  const [incidentReport, setIncidentReport] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("content", content)
    formData.append("author", author)
    formData.append("currentConditions", currentConditions)
    formData.append("incidentReport", incidentReport)
    if (image) {
      formData.append("image", image)
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/daily-log`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newEntry = await response.json()
        onNewEntry(newEntry)
        setContent("")
        setAuthor("")
        setCurrentConditions("")
        setIncidentReport("")
        setImage(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        console.error("Failed to create daily log entry")
      }
    } catch (error) {
      console.error("Error creating daily log entry:", error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Log Entry</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="currentConditions">
            <Sun className="mr-2" size={18} />
            Current Conditions
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="currentConditions"
            type="text"
            value={currentConditions}
            onChange={(e) => setCurrentConditions(e.target.value)}
            required
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="content">
            <FileText className="mr-2" size={18} />
            Log Entry
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="incidentReport">
            <AlertTriangle className="mr-2" size={18} />
            Incident Report
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="incidentReport"
            value={incidentReport}
            onChange={(e) => setIncidentReport(e.target.value)}
            rows={4}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="author">
            <User className="mr-2" size={18} />
            Author
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center" htmlFor="image">
            <CloudUpload className="mr-2" size={18} />
            Upload Image
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          type="submit"
        >
          Add Entry
        </button>
      </div>
    </form>
  )
}

