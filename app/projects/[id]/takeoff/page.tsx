"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Upload, FileText, Calculator } from "lucide-react"
import TakeoffViewer from "../../../components/TakeoffViewer" // Import TakeoffViewer component

type Plan = {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  createdAt: string
  updatedAt: string
}

type Measurement = {
  id: number
  planId: number
  type: "length" | "area"
  label: string
  value: number
  unit: string
  points: { x: number; y: number }[]
}

export default function ProjectTakeoff({ params }: { params: { id: string } }) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    file: null as File | null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPlans()
    fetchMeasurements()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/plans`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      } else {
        setError("Failed to fetch plans")
      }
    } catch (err) {
      setError("An error occurred while fetching plans")
    } finally {
      setLoading(false)
    }
  }

  const fetchMeasurements = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/takeoff`)
      if (response.ok) {
        const data = await response.json()
        setMeasurements(data)
      }
    } catch (err) {
      console.error("Error fetching measurements:", err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setNewPlan(prev => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlan.file) return

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", newPlan.file)
    formData.append("title", newPlan.title)
    formData.append("description", newPlan.description)

    try {
      const response = await fetch(`/api/projects/${params.id}/plans`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newPlanData = await response.json()
        setPlans([...plans, newPlanData])
        setShowUploadForm(false)
        setNewPlan({
          title: "",
          description: "",
          file: null,
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to upload plan")
      }
    } catch (err) {
      setError("An error occurred while uploading the plan")
    } finally {
      setUploading(false)
    }
  }

  const handleMeasurementSave = async (measurement: Omit<Measurement, "id">) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/takeoff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(measurement),
      })

      if (response.ok) {
        const savedMeasurement = await response.json()
        setMeasurements([...measurements, savedMeasurement])
      }
    } catch (err) {
      console.error("Error saving measurement:", err)
    }
  }

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Takeoff for Project {params.id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="mr-2" />
              Project Plans
            </h2>
            <button
              onClick={() => setShowUploadForm(true)}
              className={`flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Plan"}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {showUploadForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">File</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.dwg,.dxf"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !newPlan.file}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <ul className="space-y-2">
            {plans.map((plan) => (
              <li key={plan.id}>
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full text-left p-2 rounded ${
                    selectedPlan?.id === plan.id ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"
                  }`}
                >
                  {plan.title}
                </button>
              </li>
            ))}
            {plans.length === 0 && <li className="text-gray-500 text-sm">No plans uploaded yet</li>}
          </ul>
        </div>

        <div className="md:col-span-3">
          {selectedPlan ? (
            <div className="bg-white p-4 rounded-lg shadow">
              <TakeoffViewer
                plan={selectedPlan}
                measurements={measurements.filter((m) => m.planId === selectedPlan.id)}
                onMeasurementSave={handleMeasurementSave}
              />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              {plans.length > 0 ? "Select a plan to begin takeoff" : "Upload a plan to begin takeoff"}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calculator className="mr-2" />
          Measurements Summary
        </h2>
        {measurements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Label</th>
                  <th className="text-right p-2">Value</th>
                  <th className="text-left p-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((measurement) => (
                  <tr key={measurement.id} className="border-b">
                    <td className="p-2">{plans.find((p) => p.id === measurement.planId)?.title}</td>
                    <td className="p-2 capitalize">{measurement.type}</td>
                    <td className="p-2">{measurement.label}</td>
                    <td className="p-2 text-right">{measurement.value.toFixed(2)}</td>
                    <td className="p-2">{measurement.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">No measurements recorded yet</p>
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

