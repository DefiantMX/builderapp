"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Upload, FileText, Calculator } from "lucide-react"
import TakeoffViewer from "../../../components/TakeoffViewer" // Import TakeoffViewer component

type Plan = {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  createdAt: string
  updatedAt: string
}

type Measurement = {
  id: string
  planId: string
  type: "length" | "area"
  label: string
  value: number
  unit: string
  points: { x: number; y: number }[]
  materialType?: string
  pricePerUnit?: number
}

export default function ProjectTakeoff({ params }: { params: { id: string } }) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    file: null as File | null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProject()
    fetchPlans()
    fetchMeasurements()
  }, [params.id, selectedPlan?.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        setError("Failed to fetch project")
      }
    } catch (err) {
      setError("An error occurred while fetching project")
    }
  }

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
        console.log('Fetched measurements:', data) // Debug log
        // Parse the points JSON string for each measurement
        const parsedData = data.map((measurement: any) => {
          try {
            return {
              ...measurement,
              points: typeof measurement.points === 'string' 
                ? JSON.parse(measurement.points)
                : measurement.points
            }
          } catch (err) {
            console.error('Error parsing measurement:', measurement, err)
            return measurement
          }
        })
        setMeasurements(parsedData)
      } else {
        const errorText = await response.text()
        console.error("Failed to fetch measurements:", errorText)
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
        setMeasurements(prevMeasurements => [...prevMeasurements, savedMeasurement])
        fetchMeasurements()
      } else {
        console.error("Failed to save measurement:", await response.text())
      }
    } catch (err) {
      console.error("Error saving measurement:", err)
    }
  }

  const handleMeasurementDelete = async (measurementId: string) => {
    try {
      console.log('Deleting measurement:', measurementId); // Debug log
      const response = await fetch(`/api/projects/${params.id}/takeoff?measurementId=${measurementId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Successfully deleted measurement'); // Debug log
        setMeasurements(prevMeasurements => 
          prevMeasurements.filter(m => m.id !== measurementId)
        );
        // Refresh measurements to ensure sync with server
        await fetchMeasurements();
      } else {
        const errorText = await response.text();
        console.error("Failed to delete measurement:", errorText);
      }
    } catch (err) {
      console.error("Error deleting measurement:", err);
    }
  };

  const handleMeasurementUpdate = async (id: string, updates: Partial<Measurement>) => {
    try {
      console.log('Updating measurement:', id, updates); // Debug log
      const response = await fetch(`/api/projects/${params.id}/takeoff/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        console.log('Successfully updated measurement'); // Debug log
        // Update the measurement in local state immediately
        const updatedMeasurement = await response.json();
        setMeasurements(prevMeasurements => 
          prevMeasurements.map(m => 
            m.id === id ? { ...m, ...updatedMeasurement } : m
          )
        );
      } else {
        const errorText = await response.text();
        console.error("Failed to update measurement:", errorText);
      }
    } catch (err) {
      console.error("Error updating measurement:", err);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center h-16 px-4 border-b">
        <h1 className="text-2xl font-bold">Takeoff for {project?.name || 'Loading...'}</h1>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
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
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    ref={fileInputRef}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      uploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 mb-2">HUB PLANS</h3>
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedPlan?.id === plan.id
                    ? "bg-blue-50 border-blue-500"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                } border`}
              >
                <div className="font-medium text-gray-900">{plan.title}</div>
                {plan.description && (
                  <div className="text-sm text-gray-500 mt-1">{plan.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {selectedPlan ? (
            <TakeoffViewer
              plan={selectedPlan}
              measurements={measurements}
              onMeasurementSave={handleMeasurementSave}
              onMeasurementUpdate={handleMeasurementUpdate}
              onMeasurementDelete={handleMeasurementDelete}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a plan to begin takeoff
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
            <table className="min-w-full text-base">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-lg font-semibold">Plan</th>
                  <th className="text-left p-3 text-lg font-semibold">Type</th>
                  <th className="text-left p-3 text-lg font-semibold">Label</th>
                  <th className="text-right p-3 text-lg font-semibold">Value</th>
                  <th className="text-left p-3 text-lg font-semibold">Unit</th>
                  <th className="text-left p-3 text-lg font-semibold">Material</th>
                  <th className="text-right p-3 text-lg font-semibold">Price/Unit</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((measurement) => (
                  <tr key={measurement.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-base">{plans.find((p) => p.id === measurement.planId)?.title}</td>
                    <td className="p-3 text-base capitalize">{measurement.type}</td>
                    <td className="p-3 text-base">{measurement.label}</td>
                    <td className="p-3 text-base text-right font-medium">{measurement.value.toFixed(2)}</td>
                    <td className="p-3 text-base">{measurement.unit}</td>
                    <td className="p-3 text-base">{measurement.materialType || '-'}</td>
                    <td className="p-3 text-base text-right">{measurement.pricePerUnit ? `$${measurement.pricePerUnit.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-base">No measurements recorded yet</p>
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

