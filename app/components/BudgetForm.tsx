"use client"

import { useState } from "react"
import { DIVISIONS } from "@/lib/constants"

interface BudgetFormProps {
  projectId: number
  initialBudget?: {
    totalAmount: number
    divisions: Array<{
      division: string
      amount: number
    }>
  }
  onSuccess: () => void
}

export default function BudgetForm({ projectId, initialBudget, onSuccess }: BudgetFormProps) {
  const [totalAmount, setTotalAmount] = useState(initialBudget?.totalAmount || 0)
  const [divisionAmounts, setDivisionAmounts] = useState<Record<string, number>>(
    initialBudget?.divisions.reduce((acc, div) => ({
      ...acc,
      [div.division]: div.amount
    }), {}) || {}
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const divisions = Object.entries(divisionAmounts)
        .filter(([_, amount]) => amount > 0)
        .map(([division, amount]) => ({
          division,
          amount: Number(amount)
        }))

      const response = await fetch(`/api/finances/budgets/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: Number(totalAmount),
          divisions
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save budget")
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDivisionAmountChange = (division: string, amount: string) => {
    const numAmount = amount === "" ? 0 : Number(amount)
    setDivisionAmounts(prev => ({
      ...prev,
      [division]: numAmount
    }))

    // Update total amount
    const newTotal = Object.entries(divisionAmounts)
      .reduce((sum, [id, amt]) => sum + (id === division ? numAmount : amt), 0)
    setTotalAmount(newTotal)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Total Budget</label>
        <div className="mt-1">
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Division Budgets</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(DIVISIONS).map(([id, name]) => (
            <div key={id} className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">{name}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={divisionAmounts[id] || ""}
                  onChange={(e) => handleDivisionAmountChange(id, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Saving..." : "Save Budget"}
      </button>
    </form>
  )
} 