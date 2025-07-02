"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { X, Upload, DollarSign, Calendar, FileText } from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber?: string
  date: string
  vendor: string
  amount: number
  division: string
  includedInDraw?: boolean
}

type CreateDrawFormProps = {
  projectId: string
  onDrawCreated: (draw: any) => void
  onCancel: () => void
  nextDrawNumber: number
  preselectedInvoices?: string[]
}

export default function CreateDrawForm({ 
  projectId, 
  onDrawCreated, 
  onCancel, 
  nextDrawNumber,
  preselectedInvoices = [] 
}: CreateDrawFormProps) {
  const today = new Date().toISOString().split("T")[0]
  const [drawNumber, setDrawNumber] = useState(nextDrawNumber)
  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(() => new Set(preselectedInvoices))
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/invoices`)
      if (response.ok) {
        const data = await response.json()
        const availableInvoices = data.filter((invoice: Invoice) => !invoice.includedInDraw)
        setInvoices(availableInvoices)

        if (preselectedInvoices.length > 0) {
          const total = availableInvoices
            .filter((invoice: Invoice) => preselectedInvoices.includes(invoice.id))
            .reduce((sum: number, invoice: Invoice) => sum + invoice.amount, 0)
          setAmount(total.toString())
        }
      } else {
        throw new Error("Failed to fetch invoices")
      }
    } catch (err) {
      console.error("Error fetching invoices:", err)
      setError(err instanceof Error ? err.message : "Failed to load invoices")
    } finally {
      setLoadingInvoices(false)
    }
  }, [projectId, preselectedInvoices])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleInvoiceSelect = useCallback((invoiceId: string) => {
    setSelectedInvoices(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(invoiceId)) {
        newSelected.delete(invoiceId)
      } else {
        newSelected.add(invoiceId)
      }
      return newSelected
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedInvoices(prev => {
      if (checked) {
        return new Set(invoices.map(invoice => invoice.id))
      }
      return new Set()
    })
  }, [invoices])

  const calculateSelectedTotal = useCallback(() => {
    return invoices
      .filter(invoice => selectedInvoices.has(invoice.id))
      .reduce((sum, invoice) => sum + invoice.amount, 0)
  }, [invoices, selectedInvoices])

  const selectedTotal = useMemo(() => calculateSelectedTotal(), [calculateSelectedTotal])

  useEffect(() => {
    if (selectedInvoices.size > 0) {
      setAmount(selectedTotal.toString())
    }
  }, [selectedTotal])

  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (!drawNumber) {
      errors.drawNumber = "Draw number is required"
    }
    if (!date) {
      errors.date = "Date is required"
    }
    if (!amount || parseFloat(amount) <= 0) {
      errors.amount = "Valid amount is required"
    }
    if (selectedInvoices.size === 0) {
      errors.invoices = "Please select at least one invoice"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setValidationErrors({})

    if (!validateForm()) {
      setError("Please fill in all required fields")
      return
    }

    setUploading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/draws`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          amount: parseFloat(amount),
          description: description || undefined,
          invoiceIds: Array.from(selectedInvoices),
          drawNumber
        }),
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
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                validationErrors.drawNumber ? 'border-red-500' : ''
              }`}
              required
            />
            {validationErrors.drawNumber && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.drawNumber}</p>
            )}
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
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                validationErrors.date ? 'border-red-500' : ''
              }`}
              required
            />
            {validationErrors.date && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.date}</p>
            )}
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
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                validationErrors.amount ? 'border-red-500' : ''
              }`}
              placeholder="0.00"
              required
            />
            {validationErrors.amount && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
            )}
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
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Invoices to Include *</label>
            {validationErrors.invoices && (
              <p className="text-red-500 text-xs mt-1 mb-2">{validationErrors.invoices}</p>
            )}

            {loadingInvoices ? (
              <p className="text-gray-500 text-sm">Loading invoices...</p>
            ) : error ? (
              <div className="text-red-500 text-sm p-4 bg-red-50 rounded-md">
                {error}
                <button 
                  onClick={fetchInvoices}
                  className="ml-2 text-red-700 hover:text-red-900 underline"
                >
                  Try Again
                </button>
              </div>
            ) : invoices.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={invoices.length > 0 && selectedInvoices.size === invoices.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
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
                    {invoices.map((invoice) => {
                      const isSelected = selectedInvoices.has(invoice.id)
                      return (
                        <tr
                          key={invoice.id}
                          className={isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
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
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-sm font-medium text-right">
                        Selected Total:
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-right">
                        ${selectedTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-md">
                No available invoices found for this project. Please create invoices first.
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

