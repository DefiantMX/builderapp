"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, FileText, ChevronRight } from "lucide-react"
import UploadInvoiceForm from "../components/UploadInvoiceForm"
import type { Project } from "@/lib/store"

type ProjectBudget = {
  projectId: number
  totalBudget: number
  totalSpent: number
  divisions: {
    id: string
    name: string
    budget: number
    spent: number
  }[]
}

export default function Finances() {
  const [projects, setProjects] = useState<Project[]>([])
  const [budgets, setBudgets] = useState<ProjectBudget[]>([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProjects()
    fetchBudgets()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        setError("Failed to fetch projects")
      }
    } catch (err) {
      setError("An error occurred while fetching projects")
    } finally {
      setLoading(false)
    }
  }

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/finances/budgets")
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      } else {
        setError("Failed to fetch budget data")
      }
    } catch (err) {
      setError("An error occurred while fetching budget data")
    }
  }

  const handleInvoiceUploaded = () => {
    fetchBudgets() // Refresh budget data after new invoice
    setShowUploadForm(false)
  }

  const getBudgetForProject = (projectId: number) => {
    return (
      budgets.find((budget) => budget.projectId === projectId) || {
        projectId,
        totalBudget: 0,
        totalSpent: 0,
        divisions: [],
      }
    )
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Project Finances</h1>
        <button
          onClick={() => setShowUploadForm(true)}
          className="flex items-center bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          <PlusCircle size={20} className="mr-2" />
          Upload Invoice
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showUploadForm && (
        <UploadInvoiceForm
          projects={projects}
          onInvoiceUploaded={handleInvoiceUploaded}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const budget = getBudgetForProject(project.id)
          const percentSpent = budget.totalBudget > 0 ? Math.round((budget.totalSpent / budget.totalBudget) * 100) : 0

          return (
            <Link key={project.id} href={`/finances/${project.id}`}>
              <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h2>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Budget:</span>
                    <span className="font-medium">${budget.totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Spent:</span>
                    <span className="font-medium">${budget.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Remaining:</span>
                    <span className="font-medium">${(budget.totalBudget - budget.totalSpent).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        percentSpent > 90 ? "bg-red-500" : percentSpent > 70 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentSpent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-gray-500">{percentSpent}% spent</p>
                </div>

                <div className="flex justify-end items-center text-gray-800 hover:text-gray-600">
                  View Details
                  <ChevronRight size={20} className="ml-1" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p>No projects found. Create a project to start tracking finances.</p>
          <Link
            href="/projects"
            className="mt-4 inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Go to Projects
          </Link>
        </div>
      )}
    </div>
  )
}

