"use client"

import { useState } from "react"
import { DIVISIONS } from "@/lib/constants"

type DivisionCode = keyof typeof DIVISIONS

interface DivisionAllocation {
  division: DivisionCode
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  date: string
  dueDate?: string
  vendor: string
  amount: number
  description?: string
  file?: string
  divisionAllocations: DivisionAllocation[]
  projectId: string
}

interface InvoiceFormProps {
  projectId: string
  invoice?: Invoice
  onSuccess: () => void
  onCancel: () => void
}

export default function InvoiceForm({ projectId, invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || "")
  const [date, setDate] = useState(invoice?.date ? new Date(invoice.date).toISOString().split("T")[0] : "")
  const [dueDate, setDueDate] = useState(invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "")
  const [vendor, setVendor] = useState(invoice?.vendor || "")
  const [amount, setAmount] = useState(invoice?.amount?.toString() || "")
  const [description, setDescription] = useState(invoice?.description || "")
  const [divisionAllocations, setDivisionAllocations] = useState<DivisionAllocation[]>(
    invoice?.divisionAllocations || []
  )
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}/invoices${invoice ? `?invoiceId=${invoice.id}` : ""}`, {
        method: invoice ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceNumber,
          date,
          dueDate: dueDate || undefined,
          vendor,
          amount: parseFloat(amount),
          description,
          divisionAllocations,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to save invoice")
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleAddDivision = () => {
    setDivisionAllocations([...divisionAllocations, { division: "01", amount: 0 }])
  }

  const handleRemoveDivision = (index: number) => {
    setDivisionAllocations(divisionAllocations.filter((_, i) => i !== index))
  }

  const handleDivisionChange = (index: number, field: keyof DivisionAllocation, value: string) => {
    const newAllocations = [...divisionAllocations]
    if (field === "division") {
      newAllocations[index].division = value as DivisionCode
    } else if (field === "amount") {
      newAllocations[index].amount = parseFloat(value) || 0
    }
    setDivisionAllocations(newAllocations)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">
          Invoice Number
        </label>
        <input
          type="text"
          id="invoiceNumber"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Invoice Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
          Vendor
        </label>
        <input
          type="text"
          id="vendor"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Division Allocations</label>
        {divisionAllocations.map((allocation, index) => (
          <div key={index} className="flex space-x-4 mb-2">
            <select
              value={allocation.division}
              onChange={(e) => handleDivisionChange(index, "division", e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {Object.entries(DIVISIONS).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
            <div className="relative rounded-md shadow-sm flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={allocation.amount}
                onChange={(e) => handleDivisionChange(index, "amount", e.target.value)}
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                step="0.01"
                min="0"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveDivision(index)}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddDivision}
          className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Add Division
        </button>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {invoice ? "Update" : "Create"} Invoice
        </button>
      </div>
    </form>
  )
} 
