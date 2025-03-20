"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Upload, DollarSign, Calendar, FileText, Building, Plus, Trash2 } from "lucide-react"
import type { Project } from "@/lib/store"
import InvoiceAIParser from "./InvoiceAIParser"

// Construction divisions
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

type DivisionAllocation = {
  divisionId: string
  amount: string
}

type UploadInvoiceFormProps = {
  projects: Project[]
  onInvoiceUploaded: () => void
  onCancel: () => void
  initialProjectId?: number
}

export default function UploadInvoiceForm({
  projects,
  onInvoiceUploaded,
  onCancel,
  initialProjectId,
}: UploadInvoiceFormProps) {
  const [projectId, setProjectId] = useState<string>(initialProjectId?.toString() || "")
  const [vendor, setVendor] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [date, setDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [divisionAllocations, setDivisionAllocations] = useState<DivisionAllocation[]>([{ divisionId: "", amount: "" }])
  const [allocatedAmount, setAllocatedAmount] = useState(0)
  const [useMultipleDivisions, setUseMultipleDivisions] = useState(false)

  // Calculate the total allocated amount whenever division allocations change
  useEffect(() => {
    const total = divisionAllocations.reduce((sum, allocation) => {
      const amount = Number.parseFloat(allocation.amount) || 0
      return sum + amount
    }, 0)
    setAllocatedAmount(total)
  }, [divisionAllocations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!projectId || !vendor || !totalAmount || !date) {
      setError("Please fill in all required fields")
      return
    }

    // Validate division allocations if using multiple divisions
    if (useMultipleDivisions) {
      // Check if all divisions have been selected
      const emptyDivisions = divisionAllocations.some((allocation) => !allocation.divisionId)
      if (emptyDivisions) {
        setError("Please select a division for each allocation")
        return
      }

      // Check if the total allocated amount matches the invoice total
      const invoiceTotal = Number.parseFloat(totalAmount)
      const difference = Math.abs(invoiceTotal - allocatedAmount)

      if (difference > 0.01) {
        // Allow for small rounding errors
        setError(
          `Division allocations (${allocatedAmount.toFixed(2)}) don't match the invoice total (${invoiceTotal.toFixed(2)})`,
        )
        return
      }
    } else if (!divisionAllocations[0].divisionId) {
      setError("Please select a division for this invoice")
      return
    }

    setUploading(true)

    try {
      if (useMultipleDivisions) {
        // Handle multiple division allocations
        for (const allocation of divisionAllocations) {
          const formData = new FormData()
          formData.append("projectId", projectId)
          formData.append("division", allocation.divisionId)
          formData.append("vendor", vendor)
          formData.append("amount", allocation.amount)
          formData.append("date", date)
          formData.append("dueDate", dueDate || "")
          formData.append("invoiceNumber", invoiceNumber)
          formData.append("description", description)

          // Only attach the file to the first division allocation
          if (file && allocation === divisionAllocations[0]) {
            formData.append("file", file)
          }

          const response = await fetch("/api/finances/invoices", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || "Failed to upload invoice")
          }
        }
      } else {
        // Handle single division invoice
        const formData = new FormData()
        formData.append("projectId", projectId)
        formData.append("division", divisionAllocations[0].divisionId)
        formData.append("vendor", vendor)
        formData.append("amount", totalAmount)
        formData.append("date", date)
        formData.append("dueDate", dueDate || "")
        formData.append("invoiceNumber", invoiceNumber)
        formData.append("description", description)

        if (file) {
          formData.append("file", file)
        }

        const response = await fetch("/api/finances/invoices", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || "Failed to upload invoice")
        }
      }

      onInvoiceUploaded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading the invoice")
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const addDivisionAllocation = () => {
    setDivisionAllocations([...divisionAllocations, { divisionId: "", amount: "" }])
  }

  const removeDivisionAllocation = (index: number) => {
    const newAllocations = [...divisionAllocations]
    newAllocations.splice(index, 1)
    setDivisionAllocations(newAllocations)
  }

  const updateDivisionAllocation = (index: number, field: "divisionId" | "amount", value: string) => {
    const newAllocations = [...divisionAllocations]
    newAllocations[index][field] = value
    setDivisionAllocations(newAllocations)
  }

  const handleAIParsedData = (data: any) => {
    if (data.vendor) setVendor(data.vendor)
    if (data.invoiceDate) setDate(data.invoiceDate)
    if (data.dueDate) setDueDate(data.dueDate)
    if (data.amount) setTotalAmount(data.amount.replace(/[^0-9.]/g, ""))
    if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber)
    if (data.description) setDescription(data.description)

    // Try to match project name to a project
    if (data.projectName) {
      const matchedProject = projects.find((p) => p.name.toLowerCase().includes(data.projectName.toLowerCase()))
      if (matchedProject) {
        setProjectId(matchedProject.id.toString())
      }
    }

    // Handle divisions if present
    if (data.divisions && data.divisions.length > 0) {
      if (data.divisions.length > 1) {
        setUseMultipleDivisions(true)
        setDivisionAllocations(
          data.divisions.map((div: any) => ({
            divisionId: div.id,
            amount: div.amount.toString(),
          })),
        )
      } else {
        setDivisionAllocations([
          {
            divisionId: data.divisions[0].id,
            amount: data.divisions[0].amount.toString(),
          },
        ])
      }
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Upload Invoice</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <InvoiceAIParser onParsedData={handleAIParsedData} />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectId">
              Project *
            </label>
            <select
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vendor">
              <div className="flex items-center">
                <Building className="mr-2" size={16} />
                Vendor/Supplier *
              </div>
            </label>
            <input
              id="vendor"
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="invoiceNumber">
              Invoice Number
            </label>
            <input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter invoice number"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalAmount">
              <div className="flex items-center">
                <DollarSign className="mr-2" size={16} />
                Total Amount *
              </div>
            </label>
            <input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
              <div className="flex items-center">
                <Calendar className="mr-2" size={16} />
                Invoice Date *
              </div>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
              <div className="flex items-center">
                <Calendar className="mr-2" size={16} />
                Due Date
              </div>
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
              <div className="flex items-center">
                <FileText className="mr-2" size={16} />
                Invoice File
              </div>
            </label>
            <div className="flex items-center">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="h-5 w-5 mr-2" />
                {file ? file.name : "Upload Invoice"}
              </label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="block text-gray-700 text-sm font-bold" htmlFor="useMultipleDivisions">
              Division Allocation *
            </label>
            <div className="ml-4">
              <input
                type="checkbox"
                id="useMultipleDivisions"
                checked={useMultipleDivisions}
                onChange={(e) => setUseMultipleDivisions(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="useMultipleDivisions" className="text-sm text-gray-600">
                Split across multiple divisions
              </label>
            </div>
          </div>

          {!useMultipleDivisions ? (
            <div>
              <select
                value={divisionAllocations[0].divisionId}
                onChange={(e) => updateDivisionAllocation(0, "divisionId", e.target.value)}
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
          ) : (
            <div className="space-y-2">
              {divisionAllocations.map((allocation, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={allocation.divisionId}
                    onChange={(e) => updateDivisionAllocation(index, "divisionId", e.target.value)}
                    className="shadow appearance-none border rounded flex-grow py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Select a Division</option>
                    {DIVISIONS.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.id} - {div.name}
                      </option>
                    ))}
                  </select>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={allocation.amount}
                      onChange={(e) => updateDivisionAllocation(index, "amount", e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Amount"
                      required
                    />
                  </div>
                  {divisionAllocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDivisionAllocation(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={addDivisionAllocation}
                  className="flex items-center text-blue-500 hover:text-blue-700"
                >
                  <Plus size={18} className="mr-1" />
                  Add Division
                </button>

                <div className="text-sm">
                  <span className="text-gray-600">Allocated: </span>
                  <span
                    className={`font-medium ${
                      Math.abs(Number.parseFloat(totalAmount) - allocatedAmount) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${allocatedAmount.toFixed(2)}
                  </span>
                  <span className="text-gray-600"> of </span>
                  <span className="font-medium">${Number.parseFloat(totalAmount || "0").toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
            placeholder="Enter invoice description or notes"
          />
        </div>

        <div className="flex items-center justify-end">
          <button type="button" onClick={onCancel} className="mr-4 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Invoice"}
          </button>
        </div>
      </form>
    </div>
  )
}

