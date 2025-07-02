"use client"

import { useState } from "react"
import { DIVISIONS } from "@/lib/constants"

interface UploadInvoiceFormProps {
  projectId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function UploadInvoiceForm({ projectId, onSuccess, onCancel }: UploadInvoiceFormProps) {
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [division, setDivision] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleAnalyzeInvoice = async () => {
    if (!file) return

    setAnalyzing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/analyze-invoice', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to analyze invoice')
      }

      const data = await response.json()
      
      // Update form fields with extracted data
      setVendor(data.vendor || '')
      setAmount(data.amount || 0)
      setDate(data.date || date)
      if (data.division) {
        setDivision(data.division)
      }
    } catch (error) {
      console.error('Error analyzing invoice:', error)
      setError('Failed to analyze invoice. Please enter details manually.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('vendor', vendor)
      formData.append('amount', amount.toString())
      formData.append('date', date)
      formData.append('description', description)
      formData.append('division', division)
      if (projectId) {
        formData.append('projectId', projectId)
      }
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/projects/' + projectId + '/invoices', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save invoice')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving invoice:', error)
      setError(error instanceof Error ? error.message : 'Failed to save invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Invoice</h2>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Smart Invoice Scanner</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload an invoice to automatically extract vendor, amount, date, and other details.
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => document.getElementById('invoice-file')?.click()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Select Invoice File
              </button>
              <button
                type="button"
                onClick={handleAnalyzeInvoice}
                disabled={!file || analyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Invoice'}
              </button>
            </div>
            <input
              id="invoice-file"
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
            />
            <p className="text-sm text-gray-500 mt-2">
              Note: Smart extraction works best with clear, well-formatted invoices. You can always adjust the details manually if needed.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vendor">
            Vendor/Supplier *
          </label>
          <input
            type="text"
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            Invoice Date *
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Total Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-600">$</span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="shadow appearance-none border rounded w-full py-2 pl-7 pr-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="division">
            Division *
          </label>
          <select
            id="division"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a division</option>
            {Object.entries(DIVISIONS).map(([code, name]) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter invoice description or notes"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Invoice'}
        </button>
      </div>
    </form>
  )
}

