"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, FileText, ChevronRight, Calendar, MapPin, Users, FileCheck, Archive, CheckCircle, Trash2, X } from "lucide-react"
import { auth } from "@/lib/auth"

type BiddingProject = {
  id: string
  name: string
  description: string | null
  projectNumber: string | null
  location: string | null
  bidDueDate: string | null
  status: string
  archivedAt: string | null
  createdAt: string
  _count: {
    bidders: number
    bidSubmissions: number
    biddingPlans: number
  }
}

export default function BiddingPage() {
  const [projects, setProjects] = useState<BiddingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<BiddingProject | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectNumber: "",
    location: "",
    bidDueDate: ""
  })

  useEffect(() => {
    fetchProjects()
  }, [showArchived])

  const fetchProjects = async () => {
    try {
      const url = showArchived 
        ? "/api/bidding/projects?archived=true"
        : "/api/bidding/projects"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        setError("Failed to fetch bidding projects")
      }
    } catch (err) {
      setError("An error occurred while fetching bidding projects")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/bidding/projects/${projectId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: true })
      })

      if (response.ok) {
        fetchProjects()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to complete project")
      }
    } catch (err) {
      alert("An error occurred")
    }
  }

  const handleArchive = async (projectId: string) => {
    try {
      const response = await fetch(`/api/bidding/projects/${projectId}/archive`, {
        method: "POST"
      })

      if (response.ok) {
        fetchProjects()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to archive project")
      }
    } catch (err) {
      alert("An error occurred")
    }
  }

  const handleUnarchive = async (projectId: string) => {
    try {
      const response = await fetch(`/api/bidding/projects/${projectId}/archive`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchProjects()
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to unarchive project")
      }
    } catch (err) {
      alert("An error occurred")
    }
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    setDeletingId(projectToDelete.id)
    try {
      const response = await fetch(`/api/bidding/projects/${projectToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchProjects()
        setShowDeleteConfirm(false)
        setProjectToDelete(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || "Failed to delete project")
      }
    } catch (err) {
      alert("An error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/bidding/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          bidDueDate: formData.bidDueDate || null
        })
      })

      if (response.ok) {
        const newProject = await response.json()
        setProjects([newProject, ...projects])
        setShowCreateForm(false)
        setFormData({
          name: "",
          description: "",
          projectNumber: "",
          location: "",
          bidDueDate: ""
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to create bidding project" }))
        setError(errorData.error || errorData.message || "Failed to create bidding project")
        console.error("Error creating bidding project:", errorData)
      }
    } catch (err) {
      setError("An error occurred while creating the bidding project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Closed":
        return "bg-gray-100 text-gray-800"
      case "Awarded":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {showArchived ? "Archived Bidding Projects" : "Bidding Projects"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center px-4 py-2 rounded transition duration-300 ${
              showArchived
                ? "bg-gray-600 hover:bg-gray-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            <Archive size={20} className="mr-2" />
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
          {!showArchived && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              <PlusCircle size={20} className="mr-2" />
              New Bidding Project
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Bidding Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Number
                </label>
                <input
                  type="text"
                  value={formData.projectNumber}
                  onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bid Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.bidDueDate}
                  onChange={(e) => setFormData({ ...formData, bidDueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({
                    name: "",
                    description: "",
                    projectNumber: "",
                    location: "",
                    bidDueDate: ""
                  })
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
            <Link href={`/bidding/${project.id}`}>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold text-gray-800">{project.name}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              {project.projectNumber && (
                <p className="text-sm text-gray-600 mb-2">Project #: {project.projectNumber}</p>
              )}
              
              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {project.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    <span>{project.location}</span>
                  </div>
                )}
                {project.bidDueDate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>Due: {new Date(project.bidDueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-600 mb-1">
                    <Users size={16} className="mr-1" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{project._count?.bidders ?? 0}</p>
                  <p className="text-xs text-gray-500">Bidders</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-600 mb-1">
                    <FileCheck size={16} className="mr-1" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{project._count?.bidSubmissions ?? 0}</p>
                  <p className="text-xs text-gray-500">Bids</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-600 mb-1">
                    <FileText size={16} className="mr-1" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{project._count?.biddingPlans ?? 0}</p>
                  <p className="text-xs text-gray-500">Plans</p>
                </div>
              </div>

              <div className="flex justify-end items-center mt-4 text-gray-800 hover:text-gray-600">
                View Details
                <ChevronRight size={20} className="ml-1" />
              </div>
            </Link>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
              {!showArchived && (
                <>
                  {project.status !== "Completed" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleComplete(project.id)
                      }}
                      className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
                      title="Mark as Complete & Archive"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Complete
                    </button>
                  )}
                  {!project.archivedAt && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleArchive(project.id)
                      }}
                      className="flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition"
                      title="Archive Project"
                    >
                      <Archive size={16} className="mr-1" />
                      Archive
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setProjectToDelete(project)
                      setShowDeleteConfirm(true)
                    }}
                    className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                    title="Delete Project"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </button>
                </>
              )}
              {showArchived && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnarchive(project.id)
                  }}
                  className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                  title="Unarchive Project"
                >
                  <Archive size={16} className="mr-1" />
                  Unarchive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !showCreateForm && (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p>
            {showArchived 
              ? "No archived bidding projects found." 
              : "No bidding projects found. Create your first bidding project to get started."}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-600">Delete Bidding Project</h3>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setProjectToDelete(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="mb-4 text-gray-700">
                Are you sure you want to delete <strong>{projectToDelete.name}</strong>? 
                This action cannot be undone and will permanently delete all associated bidders, plans, and submissions.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setProjectToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId === projectToDelete.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === projectToDelete.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

