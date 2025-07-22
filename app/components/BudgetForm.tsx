"use client"

import { useState, useEffect } from "react"
import { DIVISIONS, DIVISION_SUBCATEGORIES } from "@/lib/constants"

type DivisionCode = keyof typeof DIVISIONS

interface SubcategoryBudget {
  subcategory: string
  amount: number
  description: string
}

interface DivisionBudget {
  division: DivisionCode
  amount: number
  description: string
  subcategories: SubcategoryBudget[]
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
  console.log('BudgetForm props:', { projectId, initialBudget })
  console.log('Available divisions:', Object.entries(DIVISIONS).sort(([a], [b]) => parseInt(a) - parseInt(b)))
  console.log('Checking specific divisions:', {
    '00': DIVISIONS['00'],
    '15': DIVISIONS['15'],
    '16': DIVISIONS['16'],
    '17': DIVISIONS['17']
  })
  
  // Force check if divisions exist
  const allDivisions = Object.entries(DIVISIONS).sort(([a], [b]) => parseInt(a) - parseInt(b))
  console.log('All divisions sorted:', allDivisions.map(([code, name]) => `${code} - ${name}`))
  console.log('Divisions 00-17:', allDivisions.filter(([code]) => parseInt(code) <= 17).map(([code, name]) => `${code} - ${name}`))
  
  const [divisionBudgets, setDivisionBudgets] = useState<DivisionBudget[]>(() => {
    if (!initialBudget?.divisionBudgets) {
      console.log('No initial budget data')
      return []
    }
    
    console.log('Converting legacy budget data:', initialBudget.divisionBudgets)
    // Convert legacy budget data to new format with subcategories
    return initialBudget.divisionBudgets.map(division => {
      // If division has subcategories, use them
      if (division.subcategories && division.subcategories.length > 0) {
        return {
          ...division,
          subcategories: division.subcategories
        }
      }
      
      // If no subcategories exist, create a default one with the division amount
      const defaultSubcategory = {
        subcategory: 'General',
        amount: division.amount || 0,
        description: division.description || ''
      }
      
      return {
        ...division,
        subcategories: [defaultSubcategory]
      }
    })
  })

  // Calculate total automatically from division budgets
  const totalAmount = divisionBudgets.reduce((sum, division) => {
    const divisionTotal = (division.subcategories || []).reduce((subSum, sub) => subSum + sub.amount, 0)
    return sum + divisionTotal
  }, 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddDivision = () => {
    setDivisionBudgets([...divisionBudgets, { 
      division: '00', 
      amount: 0, 
      description: '',
      subcategories: []
    }])
  }

  // Initialize with default divisions if no data exists
  useEffect(() => {
    if (divisionBudgets.length === 0 && !initialBudget) {
      // Add some default divisions
      const defaultDivisions: DivisionBudget[] = [
        {
          division: '00',
          amount: 0,
          description: '',
          subcategories: []
        },
        {
          division: '01',
          amount: 0,
          description: '',
          subcategories: []
        },
        {
          division: '02',
          amount: 0,
          description: '',
          subcategories: []
        }
      ]
      setDivisionBudgets(defaultDivisions)
    }
  }, [divisionBudgets.length, initialBudget])

  const handleAddSubcategory = (divisionIndex: number) => {
    const newBudgets = [...divisionBudgets]
    const division = newBudgets[divisionIndex]
    const subcategories = DIVISION_SUBCATEGORIES[division.division]?.subcategories || []
    
    if (subcategories.length > 0) {
      const availableSubcategories = subcategories.filter(sub => 
        !(division.subcategories || []).some(existing => existing.subcategory === sub)
      )
      
      if (availableSubcategories.length > 0) {
        if (!newBudgets[divisionIndex].subcategories) {
          newBudgets[divisionIndex].subcategories = []
        }
        newBudgets[divisionIndex].subcategories.push({
          subcategory: availableSubcategories[0],
          amount: 0,
          description: ''
        })
        setDivisionBudgets(newBudgets)
      }
    }
  }

  const handleRemoveSubcategory = (divisionIndex: number, subcategoryIndex: number) => {
    const newBudgets = [...divisionBudgets]
    if (newBudgets[divisionIndex].subcategories) {
      newBudgets[divisionIndex].subcategories.splice(subcategoryIndex, 1)
      setDivisionBudgets(newBudgets)
    }
  }

  const handleSubcategoryChange = (divisionIndex: number, subcategoryIndex: number, field: keyof SubcategoryBudget, value: string) => {
    const newBudgets = [...divisionBudgets]
    if (newBudgets[divisionIndex].subcategories && newBudgets[divisionIndex].subcategories[subcategoryIndex]) {
      newBudgets[divisionIndex].subcategories[subcategoryIndex] = {
        ...newBudgets[divisionIndex].subcategories[subcategoryIndex],
        [field]: field === 'amount' ? parseFloat(value) || 0 : value
      }
      setDivisionBudgets(newBudgets)
    }
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
      // Validate division budgets
      if (divisionBudgets.length === 0) {
        throw new Error('At least one division budget is required')
      }

      // Validate that each division has subcategories with amounts
      const hasValidSubcategories = divisionBudgets.every(division => 
        (division.subcategories || []).length > 0 && 
        (division.subcategories || []).some(sub => sub.amount > 0)
      )
      
      if (!hasValidSubcategories) {
        throw new Error('Each division must have at least one subcategory with an amount')
      }

      const requestBody = {
        totalAmount,
        divisionBudgets: divisionBudgets.map(division => ({
          ...division,
          // Keep the individual subcategory amounts, don't override with sum
          amount: (division.subcategories || []).reduce((sum, sub) => sum + sub.amount, 0)
        }))
      }
      
      console.log('Sending budget data to API:', requestBody)
      console.log('Sample division with subcategories:', requestBody.divisionBudgets[0])
      
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: initialBudget ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-blue-900">Total Budget:</span>
          <span className="text-2xl font-bold text-blue-900">${totalAmount.toLocaleString()}</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">Automatically calculated from subcategory amounts</p>
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

        <div className="space-y-6">
          {/* Show available divisions that can be added */}
          {(() => {
            const usedDivisions = new Set(divisionBudgets.map(b => b.division))
            const availableDivisions = Object.entries(DIVISIONS).filter(([code]) => !usedDivisions.has(code as DivisionCode))
            
            if (availableDivisions.length === 0) return null
            
            return (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Divisions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableDivisions.map(([code, name]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setDivisionBudgets([...divisionBudgets, {
                          division: code as DivisionCode,
                          amount: 0,
                          description: '',
                          subcategories: []
                        }])
                      }}
                      className="p-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {code} - {name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
          
          {/* Show existing divisions */}
          {divisionBudgets.map((budget, divisionIndex) => (
            <div key={divisionIndex} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex gap-4 items-start mb-4">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Division
                  </label>
                  <select
                    value={budget.division}
                    onChange={(e) => handleDivisionChange(divisionIndex, 'division', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a division</option>
                    {Object.entries(DIVISIONS)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} - {name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Division Total
                  </label>
                  <div className="p-2 bg-gray-100 border rounded text-gray-700 font-semibold">
                    ${(budget.subcategories || []).reduce((sum, sub) => sum + sub.amount, 0).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDivision(divisionIndex)}
                  className="mt-8 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Remove Division
                </button>
              </div>

              {/* Division Description */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Division Description
                </label>
                <textarea
                  value={budget.description}
                  onChange={(e) => handleDivisionChange(divisionIndex, 'description', e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter description for this division..."
                />
              </div>

              {/* Subcategories */}
              {budget.division && DIVISION_SUBCATEGORIES[budget.division] && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Subcategories</h4>
                    <button
                      type="button"
                      onClick={() => handleAddSubcategory(divisionIndex)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Add Subcategory
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(budget.subcategories || []).map((subcategory, subcategoryIndex) => (
                      <div key={subcategoryIndex} className="bg-white p-3 rounded border">
                        <div className="flex gap-3 items-start">
                          <div className="flex-1">
                            <label className="block text-gray-600 text-xs font-medium mb-1">
                              Subcategory
                            </label>
                            {subcategory.subcategory === 'Custom' ? (
                              <input
                                type="text"
                                value={subcategory.description || ''}
                                onChange={(e) => handleSubcategoryChange(divisionIndex, subcategoryIndex, 'description', e.target.value)}
                                className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter custom subcategory name..."
                              />
                            ) : (
                              <select
                                value={subcategory.subcategory}
                                onChange={(e) => handleSubcategoryChange(divisionIndex, subcategoryIndex, 'subcategory', e.target.value)}
                                className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {DIVISION_SUBCATEGORIES[budget.division]?.subcategories.map(sub => (
                                  <option key={sub} value={sub}>
                                    {sub}
                                  </option>
                                ))}
                                <option value="Custom">Custom</option>
                              </select>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-gray-600 text-xs font-medium mb-1">
                              Amount
                            </label>
                            <input
                              type="number"
                              value={subcategory.amount}
                              onChange={(e) => handleSubcategoryChange(divisionIndex, subcategoryIndex, 'amount', e.target.value)}
                              className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(divisionIndex, subcategoryIndex)}
                            className="mt-6 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Remove
                          </button>
                        </div>
                                                {subcategory.subcategory !== 'Custom' && (
                          <div className="mt-2">
                            <label className="block text-gray-600 text-xs font-medium mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={subcategory.description}
                              onChange={(e) => handleSubcategoryChange(divisionIndex, subcategoryIndex, 'description', e.target.value)}
                              className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter description..."
                            />
                          </div>
                        )}
            </div>
          ))}
        </div>
                </div>
              )}
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
