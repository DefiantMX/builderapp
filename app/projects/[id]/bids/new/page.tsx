"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload } from "lucide-react"

// Standard construction divisions
const DIVISIONS = [
  { id: "01", name: "General Requirements" },
  { id: "02", name: "Existing Conditions" },
  { id: "03", name: "Concrete" },
  { id: "04", name: "Masonry" },
  { id: "05", name: "Metals" },
  { id: "06", name: "Wood, Plastics, and Composites" },
  { id: "07", name: "Thermal and Moisture Protection" },
  { id: "08", name: "Openings" },
  { id: "09", name: "Finishes" },
  { id: "10", name: "Specialties" },
  { id: "11", name: "Equipment" },
  { id: "12", name: "Furnishings" },
  { id: "13", name: "Special Construction" },
  { id: "14", name: "Conveying Equipment" },
  { id: "21", name: "Fire Suppression" },
  { id: "22", name: "Plumbing" },
  { id: "23", name: "Heating, Ventilating, and Air Conditioning" },
  { id: "26", name: "Electrical" },
  { id: "27", name: "Communications" },
  { id: "28", name: "Electronic Safety and Security" },
  { id: "31", name: "Earthwork" },
  { id: "32", name: "Exterior Improvements" },
  { id: "33", name: "Utilities" },
]

export default function NewBid({ params }: { params: { id: string } }) {
  const [contractor, setContractor] = useState("")
  const [amount, setAmount] = useState("")
  const [division, setDivision] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("contractor", contractor)
      formData.append("amount", amount)
      formData.append("division", division)
      formData.append("description", description)
      if (file) {
        formData.append("document", file)
      }

      const response = await fetch(`/api/projects/${params.id}/bids`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        router.push(`/projects/${params.id}/bids`)
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.message || "Failed to submit bid")
      }
    } catch (err) {
      setError("An error occurred while submitting the bid")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Submit New Bid for Project {params.id}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="division" className="block text-gray-700 text-sm font-bold mb-2">
            Division
          </label>
          <select
            id="division"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a Division</option>
            {DIVISIONS.map((div) => (
              <option key={div.id} value={div.id}>
                {div.id} - {div.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="contractor" className="block text-gray-700 text-sm font-bold mb-2">
            Contractor Name
          </label>
          <input
            type="text"
            id="contractor"
            value={contractor}
            onChange={(e) => setContractor(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
            Bid Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
            placeholder="Enter bid details and scope of work..."
          />
        </div>
        <div className="mb-6">
          <label htmlFor="document" className="block text-gray-700 text-sm font-bold mb-2">
            Bid Document (Optional)
          </label>
          <div className="flex items-center">
            <input
              type="file"
              id="document"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
            <label
              htmlFor="document"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="h-5 w-5 mr-2" />
              {file ? file.name : "Upload Document"}
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Bid"}
          </button>
          <Link href={`/projects/${params.id}/bids`} className="text-blue-500 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

