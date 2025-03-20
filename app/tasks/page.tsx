"use client"

import { useState } from "react"
import Link from "next/link"
import StickyNoteBoard from "../components/StickyNoteBoard"

export default function Tasks() {
  const [activeTab, setActiveTab] = useState<"list" | "notes">("list")

  const tasks = [
    { id: 1, name: "Foundation Work", project: "Residential Complex", dueDate: "2023-06-15" },
    { id: 2, name: "Electrical Wiring", project: "Office Building", dueDate: "2023-07-01" },
    { id: 3, name: "Interior Design", project: "Shopping Mall", dueDate: "2023-06-30" },
  ]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Tasks</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("list")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Task List
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sticky Notes
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "list" ? (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id} className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-xl font-semibold">{task.name}</h2>
              <p className="text-gray-600">Project: {task.project}</p>
              <p className="text-gray-600">Due Date: {task.dueDate}</p>
            </li>
          ))}
        </ul>
      ) : (
        <StickyNoteBoard />
      )}

      <Link href="/" className="mt-4 inline-block bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
        Back to Home
      </Link>
    </div>
  )
}

