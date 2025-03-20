"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type React from "react"
import { TASK_CATEGORIES } from "./GanttChart"

type Task = {
  title: string
  startDate: string
  endDate: string
  assignee: string
  status: "Not Started" | "In Progress" | "Completed"
  category: 1 | 2 | 3 | 4 | 5
}

type AddTaskFormProps = {
  onAddTask: (task: Task) => void
  onCancel: () => void
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask, onCancel }) => {
  const [task, setTask] = useState<Task>({
    title: "",
    startDate: "",
    endDate: "",
    assignee: "",
    status: "Not Started",
    category: 1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTask((prevTask) => ({
      ...prevTask,
      [name]: name === "category" ? Number.parseInt(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTask(task)
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Add New Task</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Task Title
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="title"
            type="text"
            name="title"
            value={task.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
            Start Date
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="startDate"
            type="date"
            name="startDate"
            value={task.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
            End Date
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="endDate"
            type="date"
            name="endDate"
            value={task.endDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assignee">
            Assignee
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="assignee"
            type="text"
            name="assignee"
            value={task.assignee}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
            Status
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="status"
            name="status"
            value={task.status}
            onChange={handleChange}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
            Category
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="category"
            name="category"
            value={task.category}
            onChange={handleChange}
          >
            {Object.entries(TASK_CATEGORIES).map(([id, { name, color }]) => (
              <option key={id} value={id} style={{ backgroundColor: color }}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end">
          <button
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            type="submit"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddTaskForm

