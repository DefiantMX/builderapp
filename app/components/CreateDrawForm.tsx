"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Upload, DollarSign, Calendar, FileText } from "lucide-react"

type CreateDrawFormProps = {
  projectId: number
  onDrawCreated: (draw: any) => void
  onCancel: () => void
  nextDrawNumber: number
}

export default function CreateDrawForm({ projectId, onDrawCreated, onCancel, nextDrawNumber }: CreateDrawFormProps) {
  const [drawNumber, setDrawNumber] = useState(nextDrawNumber)
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  useEffect(() => {
    // Fetch available invoices for this project
    const fetchInvoices = async () => {
      setLoadingInvoices(true)
      try {
        const response = await fetch(`/api/finances/invoices/${projectId}`)
        if (response.ok) {
          const data = await response.json()
          // Filter out invoices that have already been included in previous draws
          const availableInvoices = data.filter((invoice) => !invoice.includedInDraw)
          setInvoices(availableInvoices)
        }
      } catch (err) {
        console.error("Error fetching invoices:", err)
      } finally {
        setLoadingInvoices(false)
      }
    }
    fetchInvoices()
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!drawNumber || !date || !amount) {
      setError("Please fill in all required fields")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("projectId", projectId.toString())
      formData.append("drawNumber", drawNumber.toString())
      formData.append("date", date)
      formData.append("amount", amount)
      formData.append("description", description)
      formData.append("status", "Draft")
      formData.append("selectedInvoices", JSON.stringify(selectedInvoices))

      if (file) {
        formData.append("file", file)
      }

      const response = await fetch("/api/finances/draws", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create draw")
      }

      const newDraw = await response.json()
      onDrawCreated(newDraw)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the draw")
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleInvoiceSelect = (invoiceId: number) => {
    setSelectedInvoices((prev) => {
      if (prev.includes(invoiceId)) {
        return prev.filter((id) => id !== invoiceId)
      } else {
        return [...prev, invoiceId]
      }
    })
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Create New Draw</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="drawNumber">
              Draw Number *
            </label>
            <input
              id="drawNumber"
              type="number"
              value={drawNumber}
              onChange={(e) => setDrawNumber(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
              <div className="flex items-center">
                <Calendar className="mr-2" size={16} />
                Date *
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
              <div className="flex items-center">
                <DollarSign className="mr-2" size={16} />
                Amount *
              </div>
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
              required
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
              <div className="flex items-center">
                <FileText className="mr-2" size={16} />
                Supporting Documentation
              </div>
            </label>
            <div className="flex items-center">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="h-5 w-5 mr-2" />
                {file ? file.name : "Upload Documentation"}
              </label>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={3}
              placeholder="Enter draw description or notes"
            />
          </div>
          <div className="col-span-1 md:col-span-2 mt-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Invoices to Include</label>

            {loadingInvoices ? (
              <p className="text-gray-500 text-sm">Loading invoices...</p>
            ) : invoices.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Select
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Invoice #
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Vendor
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Division
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={selectedInvoices.includes(invoice.id) ? "bg-blue-50" : "hover:bg-gray-50"}
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleInvoiceSelect(invoice.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </label>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {invoice.invoiceNumber || `-`}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{invoice.vendor}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{invoice.division}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${invoice.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-sm font-medium text-right">
                        Selected Total:
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-right">
                        $
                        {invoices
                          .filter((invoice) => selectedInvoices.includes(invoice.id))
                          .reduce((sum, invoice) => sum + invoice.amount, 0)
                          .toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No available invoices found for this project.</p>
            )}

            {selectedInvoices.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Calculate the total of selected invoices
                    const total = invoices
                      .filter((invoice) => selectedInvoices.includes(invoice.id))
                      .reduce((sum, invoice) => sum + invoice.amount, 0)

                    // Update the amount field
                    setAmount(total.toString())
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Use selected invoices total as draw amount
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button type="button" onClick={onCancel} className="mr-4 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
          >
            {uploading ? "Creating..." : "Create Draw"}
          </button>
        </div>
      </form>
    </div>
  )
}

