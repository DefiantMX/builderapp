"use client"

import { useState } from "react"

interface DrawFormProps {
  projectId: string
  selectedInvoices: string[]
  totalAmount: number
  onSuccess: () => void
  onCancel: () => void
}

export default function DrawForm({ 
  projectId, 
  selectedInvoices, 
  totalAmount,
  onSuccess, 
  onCancel 
}: DrawFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/${projectId}/draws`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          amount: totalAmount,
          description: description || null,
          invoiceIds: selectedInvoices,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create draw')
      }

      onSuccess()
    } catch (error) {
      console.error('Error creating draw:', error)
      setError(error instanceof Error ? error.message : 'Failed to create draw. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Draw</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            Draw Date
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
            Total Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-600">$</span>
            <input
              type="text"
              id="amount"
              value={totalAmount.toLocaleString()}
              className="shadow appearance-none border rounded w-full py-2 pl-7 pr-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter draw description..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Draw'}
        </button>
      </div>
    </form>
  )
} 