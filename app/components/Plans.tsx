"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

type Plan = {
  id: number
  name: string
  url: string
  uploadedAt: string
}

type PlansProps = {
  projectId: number
}

export default function Plans({ projectId }: PlansProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    fetchPlans()
  }, []) // Removed projectId from dependencies

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/plans`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      } else {
        setError("Failed to fetch plans")
      }
    } catch (err) {
      setError("An error occurred while fetching plans")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/projects/${projectId}/plans`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newPlan = await response.json()
        setPlans([...plans, newPlan])
        setFile(null)
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

  if (!user) {
    return <p>Please log in to view and upload plans.</p>
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Project Plans</h2>
      <form onSubmit={handleUpload} className="mb-4">
        <div className="flex items-center space-x-4">
          <input type="file" onChange={handleFileChange} className="border rounded px-2 py-1" accept=".pdf,.dwg,.dxf" />
          <button
            type="submit"
            disabled={!file || uploading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Plan"}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-sm text-gray-500">Uploaded on: {new Date(plan.uploadedAt).toLocaleString()}</p>
            <a href={plan.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              View Plan
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

