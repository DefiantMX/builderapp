"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, FileText, Check, Clock, Plus, Download, Eye } from "lucide-react"
import CreateDrawForm from "./CreateDrawForm"

type Draw = {
  id: number
  projectId: number
  drawNumber: number
  date: string
  amount: number
  status: "Draft" | "Submitted" | "Approved" | "Paid" | "Rejected"
  description: string
  fileUrl?: string
  invoices?: Array<{
    id: number
    invoiceNumber?: string
    vendor: string
    amount: number
    division: string
    date: string
  }>
}

type MonthlyDrawsProps = {
  projectId: number
}

export default function MonthlyDraws({ projectId }: MonthlyDrawsProps) {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null)

  useEffect(() => {
    fetchDraws()
  }, []) // Updated useEffect dependency array

  const fetchDraws = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/finances/draws/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setDraws(data)
      } else {
        setError("Failed to fetch draws")
      }
    } catch (err) {
      setError("An error occurred while fetching draws")
    } finally {
      setLoading(false)
    }
  }

  const handleDrawCreated = (newDraw: Draw) => {
    setDraws([...draws, newDraw])
    setShowCreateForm(false)
  }

  const getStatusBadgeClass = (status: Draw["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Submitted":
        return "bg-blue-100 text-blue-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Paid":
        return "bg-purple-100 text-purple-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading draws...</div>
  }

  if (selectedDraw) {
    return (
      <div>
        <button
          onClick={() => setSelectedDraw(null)}
          className="mb-6 flex items-center text-blue-500 hover:text-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Draws List
        </button>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Draw #{selectedDraw.drawNumber}</h2>
              <p className="text-gray-600">{new Date(selectedDraw.date).toLocaleDateString()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedDraw.status)}`}>
              {selectedDraw.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Amount</h3>
              <p className="text-2xl font-bold">${selectedDraw.amount.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Description</h3>
              <p>{selectedDraw.description}</p>
            </div>
          </div>

          {selectedDraw.invoices && selectedDraw.invoices.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-2">Included Invoices</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                    {selectedDraw.invoices.map((invoice) => (
                      <tr key={invoice.id}>
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
                </table>
              </div>
            </div>
          )}

          {selectedDraw.fileUrl && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-2">Supporting Documentation</h3>
              <a href={selectedDraw.fileUrl} download className="flex items-center text-blue-500 hover:text-blue-700">
                <FileText className="h-5 w-5 mr-2" />
                Download Documentation
              </a>
            </div>
          )}

          <div className="mt-8 flex space-x-4">
            {selectedDraw.status === "Draft" && (
              <>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Submit Draw
                </button>
                <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                  Edit Draw
                </button>
              </>
            )}
            {selectedDraw.status === "Submitted" && (
              <>
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Approve
                </button>
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Reject</button>
              </>
            )}
            {selectedDraw.status === "Approved" && (
              <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Mark as Paid
              </button>
            )}
            <button
              onClick={() => window.open(`/api/finances/draws/${selectedDraw.id}/export-aia`, "_blank")}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Export AIA Format
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Monthly Draws</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Draw
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showCreateForm ? (
        <CreateDrawForm
          projectId={projectId}
          onDrawCreated={handleDrawCreated}
          onCancel={() => setShowCreateForm(false)}
          nextDrawNumber={draws.length > 0 ? Math.max(...draws.map((d) => d.drawNumber)) + 1 : 1}
        />
      ) : (
        <>
          {draws.length > 0 ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Draw #
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {draws.map((draw) => (
                      <tr key={draw.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {draw.drawNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(draw.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />${draw.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              draw.status,
                            )}`}
                          >
                            {draw.status === "Submitted" && <Clock className="h-3 w-3 mr-1" />}
                            {draw.status === "Approved" && <Check className="h-3 w-3 mr-1" />}
                            {draw.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{draw.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedDraw(draw)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {draw.fileUrl && (
                            <a href={draw.fileUrl} download className="text-gray-600 hover:text-gray-900">
                              <Download className="h-5 w-5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No draws yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first monthly draw to request payment for completed work.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Draw
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

