"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, FileText, Trash2, Download } from "lucide-react"

type Plan = {
  id: number
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  createdAt: string
  updatedAt: string
}

export default function ProjectPlansPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    file: null as File | null,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchPlans()
    }
  }, [status, params.id])

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/plans`)
      if (!response.ok) {
        throw new Error("Failed to fetch plans")
      }
      const data = await response.json()
      setPlans(data)
    } catch (err) {
      setError("Error loading plans")
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlan.file) {
      setError("Please select a file")
      return
    }

    try {
      const formData = new FormData()
      formData.append("title", newPlan.title)
      formData.append("description", newPlan.description)
      formData.append("file", newPlan.file)

      const response = await fetch(`/api/projects/${params.id}/plans`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to create plan")
      }

      const createdPlan = await response.json()
      setPlans([...plans, createdPlan])
      setIsAddingPlan(false)
      setNewPlan({
        title: "",
        description: "",
        file: null,
      })
    } catch (err) {
      setError("Error creating plan")
      console.error("Error:", err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPlan({ ...newPlan, file: e.target.files[0] })
    }
  }

  const handleDelete = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${params.id}/plans/${planId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete plan")
      }

      setPlans(plans.filter((plan) => plan.id !== planId))
    } catch (err) {
      setError("Error deleting plan")
      console.error("Error:", err)
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href={`/projects/${params.id}`} className="text-blue-600 hover:text-blue-800">
              ← Back to Project
            </Link>
            <h1 className="text-2xl font-bold mt-2">Project Plans</h1>
          </div>
          <button
            onClick={() => setIsAddingPlan(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Plan
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

        {isAddingPlan && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Plan Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
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
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  File
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingPlan(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upload Plan
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No plans yet. Upload your first plan to get started!</p>
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{plan.title}</h3>
                      {plan.description && (
                        <p className="text-gray-600 mt-1">{plan.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Uploaded on {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={plan.fileUrl}
                      download
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

