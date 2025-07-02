"use client"

import { useState } from "react"
import { DIVISIONS } from "@/lib/constants"

type DivisionCode = keyof typeof DIVISIONS

interface DivisionBudget {
  division: DivisionCode
  amount: number
  description: string
}

interface BudgetFormProps {
  projectId: string
  initialBudget?: {
    totalAmount: number
    divisionBudgets: DivisionBudget[]
  }
  onSuccess: () => void
  onCancel: () => void
}

export default function BudgetForm({ projectId, initialBudget, onSuccess, onCancel }: BudgetFormProps) {
  const [totalAmount, setTotalAmount] = useState(initialBudget?.totalAmount || 0)
  const [divisionBudgets, setDivisionBudgets] = useState<DivisionBudget[]>(
    initialBudget?.divisionBudgets || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddDivision = () => {
    setDivisionBudgets([...divisionBudgets, { division: '01', amount: 0, description: '' }])
  }

  const handleRemoveDivision = (index: number) => {
    setDivisionBudgets(divisionBudgets.filter((_, i) => i !== index))
  }

  const handleDivisionChange = (index: number, field: keyof DivisionBudget, value: string) => {
    const newBudgets = [...divisionBudgets]
    newBudgets[index] = {
      ...newBudgets[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    }
    setDivisionBudgets(newBudgets)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate total amount
      if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0')
      }

      // Validate division budgets
      if (divisionBudgets.length === 0) {
        throw new Error('At least one division budget is required')
      }

      const totalDivisionAmount = divisionBudgets.reduce((sum, db) => sum + db.amount, 0)
      if (Math.abs(totalDivisionAmount - totalAmount) > 0.01) {
        throw new Error('Division budgets must sum to the total amount')
      }

      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: initialBudget ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount,
          divisionBudgets,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save budget')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving budget:', error)
      setError(error instanceof Error ? error.message : 'Failed to save budget. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {initialBudget ? 'Update Budget' : 'Set Project Budget'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="totalAmount">
          Total Budget Amount
        </label>
        <input
          type="number"
          id="totalAmount"
          value={totalAmount}
          onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Division Budgets</h3>
          <button
            type="button"
            onClick={handleAddDivision}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Division
          </button>
        </div>

        <div className="space-y-4">
          {divisionBudgets.map((budget, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Division
                </label>
                <select
                  value={budget.division}
                  onChange={(e) => handleDivisionChange(index, 'division', e.target.value)}
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
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={budget.amount}
                  onChange={(e) => handleDivisionChange(index, 'amount', e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDivision(index)}
                className="mt-8 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          ))}
          {divisionBudgets.map((budget, index) => (
            <div key={`desc-${index}`} className="col-span-full">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description for Division {budget.division}
              </label>
              <textarea
                value={budget.description}
                onChange={(e) => handleDivisionChange(index, 'description', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Enter description for this division..."
              />
            </div>
          ))}
        </div>
      </div>

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
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Budget'}
        </button>
      </div>
    </form>
  )
} 
