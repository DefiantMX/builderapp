"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarIcon, FolderIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"

type Project = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function ProjectList({ projects = [] }: { projects: Project[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    setIsDeleting(id)

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh the page to update the list
        window.location.reload()
      } else {
        alert("Failed to delete project")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project")
    } finally {
      setIsDeleting(null)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Projects Yet</h2>
        <p className="text-gray-600 mb-6">
          Create your first project to get started
        </p>
        <Link
          href="/projects/new"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Project
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <Link
          href="/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">New Project</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 truncate">
                {project.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || "No description"}
              </p>
              <div className="flex items-center text-gray-500 text-xs mb-4">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>Created: {formatDate(project.createdAt)}</span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-2 rounded-md flex items-center justify-center"
                >
                  <FolderIcon className="h-4 w-4 mr-1" />
                  <span>Open</span>
                </Link>
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={isDeleting === project.id}
                  className="bg-gray-100 hover:bg-red-100 text-gray-800 hover:text-red-700 py-2 px-3 rounded-md disabled:opacity-50"
                >
                  {isDeleting === project.id ? (
                    <span className="h-4 w-4 block animate-pulse">...</span>
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 