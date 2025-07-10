"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import BudgetForm from "@/app/components/BudgetForm"
import CreateDrawForm from "@/app/components/CreateDrawForm"
import EditDrawForm from "@/app/components/EditDrawForm"
import UploadInvoiceForm from "@/app/components/UploadInvoiceForm"
import ChangeOrderForm from "@/app/components/ChangeOrderForm"
import { DIVISIONS } from "@/lib/constants"
import { FileText } from "lucide-react"

type DivisionCode = keyof typeof DIVISIONS

interface Budget {
  division: DivisionCode
  amount: number
}

interface DivisionAllocation {
  division: DivisionCode
  amount: number
}

interface Invoice {
  id: string
  date: string
  vendor: string
  amount: number
  description?: string
  division: DivisionCode
  projectId: string
}

interface Draw {
  id: string
  drawNumber: string
  date: string
  amount: number
  status: string
  description?: string
  projectId: string
  invoices: Invoice[]
}

interface ChangeOrder {
  id: string
  title: string
  description?: string
  amount: number
  status: string
  date: string
  division: string
  reason?: string
  approvedBy?: string
  approvedAt?: string
  projectId: string
}

interface ProjectBudget {
  id: string
  totalAmount: number
  divisionBudgets: {
    division: DivisionCode
    amount: number
  }[]
}

interface Project {
  id: string
  name: string
  budget: ProjectBudget | null
  invoices: Invoice[]
  draws: Draw[]
  changeOrders: ChangeOrder[]
}

export default function ClientFinancePage({ 
  projectId,
  activeTab = 'overview'
}: { 
  projectId: string
  activeTab?: 'overview' | 'budget' | 'invoices' | 'draws' | 'change-orders'
}) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showDrawForm, setShowDrawForm] = useState(false)
  const [showChangeOrderForm, setShowChangeOrderForm] = useState(false)
  const [editingDraw, setEditingDraw] = useState<Draw | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editingChangeOrder, setEditingChangeOrder] = useState<ChangeOrder | null>(null)
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [overviewData, setOverviewData] = useState<{
    totalBudget: number
    totalInvoices: number
    totalDraws: number
    budgetByDivision: Record<DivisionCode, number>
    invoicesByDivision: Record<DivisionCode, number>
  } | null>(null)

  // Derive invoices directly from the project state
  const invoices = project?.invoices || []

  const handleInvoiceSelect = useCallback((invoiceId: string, checked: boolean) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(invoiceId)
      } else {
        newSet.delete(invoiceId)
      }
      return newSet
    })
  }, []) // No dependency needed as it only uses setSelectedInvoices and passed args

  const handleSelectAllInvoices = useCallback((checked: boolean) => {
    // Use the derived 'invoices' variable which updates when 'project' changes
    if (checked) {
      setSelectedInvoices(new Set(invoices.map(invoice => invoice.id)))
    } else {
      setSelectedInvoices(new Set())
    }
  }, [invoices]) // Depend explicitly on the derived 'invoices'

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setError(null)
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          if (mounted) {
            setError('Failed to load project data')
            setLoading(false)
          }
          return
        }
        const data = await response.json()
        if (mounted) {
          setProject(data)
          // Calculate overview data
          const totalBudget = data.budget?.totalAmount || 0
          const totalInvoices = data.invoices.reduce((sum: number, invoice: Invoice) => sum + invoice.amount, 0)
          const totalDraws = data.draws.reduce((sum: number, draw: Draw) => sum + draw.amount, 0)

          const budgetByDivision = data.budget?.divisionBudgets.reduce((acc: Record<DivisionCode, number>, budget: { division: DivisionCode; amount: number }) => {
            acc[budget.division] = budget.amount
            return acc
          }, {} as Record<DivisionCode, number>) || {}

          const invoicesByDivision = data.invoices.reduce((acc: Record<DivisionCode, number>, invoice: Invoice) => {
            acc[invoice.division] = (acc[invoice.division] || 0) + invoice.amount
            return acc
          }, {} as Record<DivisionCode, number>)

          setOverviewData({
            totalBudget,
            totalInvoices,
            totalDraws,
            budgetByDivision,
            invoicesByDivision,
          })
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        if (mounted) {
          setError('An error occurred while loading the project')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [projectId])

  const analyzeFinances = async () => {
    if (!project) return

    const totalBudget = project.budget?.totalAmount || 0
    const totalInvoices = project.invoices.reduce((sum: number, invoice: Invoice) => sum + invoice.amount, 0)
    const totalDraws = project.draws.reduce((sum: number, draw: Draw) => sum + draw.amount, 0)

    const budgetByDivision = project.budget?.divisionBudgets.reduce((acc: Record<DivisionCode, number>, budget: { division: DivisionCode; amount: number }) => {
      acc[budget.division] = budget.amount
      return acc
    }, {} as Record<DivisionCode, number>) || {}

    const invoicesByDivision = project.invoices.reduce((acc: Record<DivisionCode, number>, invoice: Invoice) => {
      acc[invoice.division] = (acc[invoice.division] || 0) + invoice.amount
      return acc
    }, {} as Record<DivisionCode, number>)

    return {
      totalBudget,
      totalInvoices,
      totalDraws,
      budgetByDivision,
      invoicesByDivision,
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/invoices?invoiceId=${invoiceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invoice")
      }

      // Reload the page to refresh data
      window.location.reload()
    } catch (error) {
      console.error("Error deleting invoice:", error)
    }
  }

  const handleUpdateDrawStatus = async (drawId: string, status: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/draws`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawId,
          status,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update draw status")
      }

      // Reload the page to refresh data
      window.location.reload()
    } catch (error) {
      console.error("Error updating draw status:", error)
    }
  }

  const handleDeleteDraw = async (drawId: string) => {
    if (!confirm("Are you sure you want to delete this draw?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/draws?drawId=${drawId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete draw")
      }

      // Reload the page to refresh data
      window.location.reload()
    } catch (error) {
      console.error("Error deleting draw:", error)
    }
  }

  const handleExportAIA = async (drawId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/draws/${drawId}/export-aia`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to export AIA document');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `draw-${drawId}-aia.pdf`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting AIA document:', error);
      setError('Failed to export AIA document');
    }
  };

  const handleSaveChangeOrder = async (changeOrderData: any) => {
    try {
      const url = changeOrderData.id 
        ? `/api/projects/${projectId}/change-orders/${changeOrderData.id}`
        : `/api/projects/${projectId}/change-orders`
      
      const method = changeOrderData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changeOrderData),
      })

      if (!response.ok) {
        throw new Error('Failed to save change order')
      }

      setShowChangeOrderForm(false)
      setEditingChangeOrder(null)
      window.location.reload()
    } catch (error) {
      console.error('Error saving change order:', error)
      setError('Failed to save change order')
    }
  }

  const handleDeleteChangeOrder = async (changeOrderId: string) => {
    if (!confirm("Are you sure you want to delete this change order?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/change-orders/${changeOrderId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete change order")
      }

      window.location.reload()
    } catch (error) {
      console.error("Error deleting change order:", error)
    }
  }

  const handleUpdateChangeOrderStatus = async (changeOrderId: string, status: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/change-orders/${changeOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update change order status")
      }

      window.location.reload()
    } catch (error) {
      console.error("Error updating change order status:", error)
    }
  }

  // Helper function to safely get project data
  const getProjectData = () => {
    const currentProject = project
    const currentInvoices = currentProject?.invoices || []
    const currentDraws = currentProject?.draws || []
    const currentChangeOrders = currentProject?.changeOrders || []
    const currentBudget = currentProject?.budget || null
    return { currentProject, currentInvoices, currentDraws, currentChangeOrders, currentBudget }
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    )
  }

  // Project Not Found State
  if (!project) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">Project not found</p>
      </div>
    )
  }

  // Initialize default values for project data
  const { currentInvoices, currentDraws, currentChangeOrders, currentBudget } = getProjectData()

  const renderBudget = () => {
    const { currentBudget } = getProjectData()

    // This function should only DISPLAY the budget, not render the form
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Project Budget</h2>
          {currentBudget && (
            <button 
              onClick={() => setShowBudgetForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Budget
            </button>
          )}
          {!currentBudget && (
            <button 
              onClick={() => setShowBudgetForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Set Budget
            </button>
          )}
        </div>

        {/* Remove BudgetForm rendering from here */}
        {/* {showBudgetForm && project && ( ... BudgetForm was here ... )} */}

        {/* Keep the budget display logic */}
        {!showBudgetForm && (
          <div className="space-y-4">
            {currentBudget?.divisionBudgets.map((item) => (
              <div key={item.division} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{DIVISIONS[item.division]} ({item.division})</p>
                    {/* Add description display if available, though ProjectBudget doesn't have it */}
                  </div>
                  <p className="text-lg font-semibold text-gray-800">${item.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {currentBudget && (
              <div className="pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-900">Total Budget:</p>
                  <p className="text-xl font-bold text-gray-900">${currentBudget.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            )}
            {!currentBudget && (
              <p className="text-gray-500">No budget items found.</p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderInvoices = () => (
    <div className="bg-white shadow-lg rounded-lg p-6">
      {showDrawForm ? (
        <CreateDrawForm
          projectId={project.id}
          onDrawCreated={() => {
            setShowDrawForm(false)
            setSelectedInvoices(new Set())
            window.location.reload()
          }}
          onCancel={() => {
            setShowDrawForm(false)
            setSelectedInvoices(new Set())
          }}
          nextDrawNumber={currentDraws.length > 0 ? Math.max(...currentDraws.map((d) => Number(d.drawNumber))) + 1 : 1}
          preselectedInvoices={Array.from(selectedInvoices)}
        />
      ) : showInvoiceForm ? (
        <UploadInvoiceForm
          projectId={project.id}
          onSuccess={() => {
            setShowInvoiceForm(false)
            window.location.reload()
          }}
          onCancel={() => {
            setShowInvoiceForm(false)
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Invoices</h2>
            <div className="space-x-2">
              {selectedInvoices.size > 0 && (
                <button
                  onClick={() => setShowDrawForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Create Draw with Selected
                </button>
              )}
              <button
                onClick={() => {
                  setEditingInvoice(null)
                  setShowInvoiceForm(true)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Invoice
              </button>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={currentInvoices.length > 0 && selectedInvoices.size === currentInvoices.length}
                    onChange={(e) => handleSelectAllInvoices(e.target.checked)}
                    disabled={currentInvoices.length === 0} // Disable if no invoices
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentInvoices.map((invoice) => (
                <tr 
                  key={invoice.id}
                  className={selectedInvoices.has(invoice.id) ? "bg-blue-50" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.has(invoice.id)}
                      onChange={(e) => handleInvoiceSelect(invoice.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-500">
                      Division {invoice.division} - {DIVISIONS[invoice.division]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentInvoices.length === 0 && (
            <p className="text-center text-gray-500 py-4">No invoices found.</p>
          )}
        </>
      )}
    </div>
  )

  const renderDraws = () => {
    const { currentDraws } = getProjectData();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Project Draws</h2>
          <button
            onClick={() => setShowDrawForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Draw
          </button>
        </div>

        {editingDraw ? (
          <EditDrawForm
            projectId={projectId}
            draw={editingDraw}
            onDrawUpdated={() => {
              setEditingDraw(null)
              window.location.reload()
            }}
            onCancel={() => setEditingDraw(null)}
          />
        ) : currentDraws.map((draw) => (
          <div key={draw.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">Draw #{draw.drawNumber}</h3>
                <p className="text-gray-500">{new Date(draw.date).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExportAIA(draw.id)}
                  className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Export AIA
                </button>
                <button
                  onClick={() => setEditingDraw(draw)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  Edit
                </button>
                <select
                  value={draw.status}
                  onChange={(e) => handleUpdateDrawStatus(draw.id, e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={() => handleDeleteDraw(draw.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium">Amount: ${draw.amount.toLocaleString()}</p>
              {draw.description && (
                <p className="text-gray-600 mt-2">{draw.description}</p>
              )}
            </div>

            {draw.invoices && draw.invoices.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Included Invoices:</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  {draw.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{invoice.vendor}</p>
                        <p className="text-sm text-gray-500">
                          Division: {invoice.division} | Date: {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {currentDraws.length === 0 && (
          <p className="text-gray-500 text-center py-8">No draws found.</p>
        )}
      </div>
    );
  };

  const renderChangeOrders = () => {
    const { currentChangeOrders } = getProjectData();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Change Orders</h2>
          <button
            onClick={() => {
              setEditingChangeOrder(null)
              setShowChangeOrderForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Change Order
          </button>
        </div>

        {showChangeOrderForm && (
          <ChangeOrderForm
            projectId={projectId}
            changeOrder={editingChangeOrder}
            onSave={handleSaveChangeOrder}
            onCancel={() => {
              setShowChangeOrderForm(false)
              setEditingChangeOrder(null)
            }}
          />
        )}

        {currentChangeOrders.map((changeOrder) => (
          <div key={changeOrder.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{changeOrder.title}</h3>
                <p className="text-gray-500">{new Date(changeOrder.date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Division: {DIVISIONS[changeOrder.division as keyof typeof DIVISIONS] || changeOrder.division}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Download AIA PDF
                    fetch(`/api/projects/${projectId}/change-orders/${changeOrder.id}/export-aia`)
                      .then(res => res.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `AIA-Change-Order-${changeOrder.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      });
                  }}
                  className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Export AIA
                </button>
                <button
                  onClick={() => {
                    setEditingChangeOrder(changeOrder)
                    setShowChangeOrderForm(true)
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  Edit
                </button>
                <select
                  value={changeOrder.status}
                  onChange={(e) => handleUpdateChangeOrderStatus(changeOrder.id, e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={() => handleDeleteChangeOrder(changeOrder.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium">Amount: ${changeOrder.amount.toLocaleString()}</p>
              {changeOrder.description && (
                <p className="text-gray-600 mt-2">{changeOrder.description}</p>
              )}
              {changeOrder.reason && (
                <div className="mt-2">
                  <p className="font-medium text-sm">Reason:</p>
                  <p className="text-gray-600 text-sm">{changeOrder.reason}</p>
                </div>
              )}
              {changeOrder.approvedBy && (
                <div className="mt-2">
                  <p className="font-medium text-sm">Approved by: {changeOrder.approvedBy}</p>
                  {changeOrder.approvedAt && (
                    <p className="text-gray-600 text-sm">on {new Date(changeOrder.approvedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {currentChangeOrders.length === 0 && (
          <p className="text-gray-500 text-center py-8">No change orders found.</p>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold">${overviewData?.totalBudget.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold">${overviewData?.totalInvoices.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Draws</p>
            <p className="text-2xl font-bold">${overviewData?.totalDraws.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (loading) return <div>Loading project finances...</div>
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!project) return <div>Project data not found.</div>

    // Pass necessary data down to forms/render functions
    const { currentInvoices, currentDraws, currentBudget } = getProjectData()

    if (showBudgetForm) {
      // Transform currentBudget to match the expected structure in BudgetForm
      const transformedBudget = currentBudget ? {
        ...currentBudget,
        divisionBudgets: currentBudget.divisionBudgets.map(db => ({
          ...db,
          description: '', // Add default empty description
        })),
      } : undefined;

      return (
        <BudgetForm 
          projectId={projectId} 
          initialBudget={transformedBudget} 
          onSuccess={() => { 
            setShowBudgetForm(false); 
            window.location.reload(); 
          }} 
          onCancel={() => setShowBudgetForm(false)} 
        />
      );
    }
    if (showInvoiceForm) {
      return <UploadInvoiceForm 
               projectId={projectId} 
               onSuccess={() => { setShowInvoiceForm(false); window.location.reload(); }} 
               onCancel={() => setShowInvoiceForm(false)} 
             />
    }
    if (showDrawForm) {
      return <CreateDrawForm
               projectId={projectId}
               onDrawCreated={() => { setShowDrawForm(false); window.location.reload(); }}
               onCancel={() => setShowDrawForm(false)}
               nextDrawNumber={currentDraws.length > 0 ? Math.max(...currentDraws.map((d) => Number(d.drawNumber))) + 1 : 1}
               preselectedInvoices={Array.from(selectedInvoices)}
             />
    }

    switch (activeTab) {
      case 'budget':
        return renderBudget()
      case 'invoices':
        return renderInvoices()
      case 'draws':
        return renderDraws()
      case 'change-orders':
        return renderChangeOrders()
      case 'overview':
      default:
        return renderOverview()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderContent()}
    </div>
  )
} 