"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

type Task = {
  id: number
  title: string
  startDate: string
  endDate: string
  status: "Not Started" | "In Progress" | "Completed"
}

type ScheduleProps = {
  projectId: number
}

export default function Schedule({ projectId }: ScheduleProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    title: "",
    startDate: "",
    endDate: "",
    status: "Not Started",
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchTasks()
  }, []) // Removed projectId from dependencies

  const fetchTasks = async () => {
    const response = await fetch(`/api/projects/${projectId}/tasks`)
    if (response.ok) {
      const data = await response.json()
      setTasks(data)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
    if (response.ok) {
      fetchTasks()
      setNewTask({ title: "", startDate: "", endDate: "", status: "Not Started" })
    }
  }

  const handleDelete = async (taskId: number) => {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    })
    if (response.ok) {
      fetchTasks()
    }
  }

  if (!user) {
    return <p>Please log in to view the schedule.</p>
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Project Schedule</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="title"
            value={newTask.title}
            onChange={handleInputChange}
            placeholder="Task Title"
            className="border rounded px-2 py-1"
            required
          />
          <input
            type="date"
            name="startDate"
            value={newTask.startDate}
            onChange={handleInputChange}
            className="border rounded px-2 py-1"
            required
          />
          <input
            type="date"
            name="endDate"
            value={newTask.endDate}
            onChange={handleInputChange}
            className="border rounded px-2 py-1"
            required
          />
          <select
            name="status"
            value={newTask.status}
            onChange={handleInputChange}
            className="border rounded px-2 py-1"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Task
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Task</th>
              <th className="px-4 py-2 border">Start Date</th>
              <th className="px-4 py-2 border">End Date</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-2 border">{task.title}</td>
                <td className="px-4 py-2 border">{task.startDate}</td>
                <td className="px-4 py-2 border">{task.endDate}</td>
                <td className="px-4 py-2 border">{task.status}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

