"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, DollarSign, Mail, Calendar } from "lucide-react"

type Bid = {
  id: number
  title: string
  description: string | null
  contractorName: string
  contractorEmail: string
  amount: number
  status: string
  submissionDate: string
  validUntil: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function ProjectBidsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingBid, setIsAddingBid] = useState(false)
  const [newBid, setNewBid] = useState({
    title: "",
    description: "",
    contractorName: "",
    contractorEmail: "",
    amount: "",
    validUntil: "",
    notes: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchBids()
    }
  }, [status, params.id])

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/bids`)
      if (!response.ok) {
        throw new Error("Failed to fetch bids")
      }
      const data = await response.json()
      setBids(data)
    } catch (err) {
      setError("Error loading bids")
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${params.id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newBid,
          amount: parseFloat(newBid.amount),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create bid")
      }

      const createdBid = await response.json()
      setBids([...bids, createdBid])
      setIsAddingBid(false)
      setNewBid({
        title: "",
        description: "",
        contractorName: "",
        contractorEmail: "",
        amount: "",
        validUntil: "",
        notes: "",
      })
    } catch (err) {
      setError("Error creating bid")
      console.error("Error:", err)
    }
  }

  const handleStatusChange = async (bidId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/bids/${bidId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update bid")
      }

      const updatedBid = await response.json()
      setBids(bids.map((bid) => (bid.id === bidId ? updatedBid : bid)))
    } catch (err) {
      setError("Error updating bid")
      console.error("Error:", err)
    }
  }

  const handleDelete = async (bidId: number) => {
    if (!confirm("Are you sure you want to delete this bid?")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${params.id}/bids/${bidId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete bid")
      }

      setBids(bids.filter((bid) => bid.id !== bidId))
    } catch (err) {
      setError("Error deleting bid")
      console.error("Error:", err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href={`/projects/${params.id}`} className="text-blue-600 hover:text-blue-800">
              ← Back to Project
            </Link>
            <h1 className="text-2xl font-bold mt-2">Project Bids</h1>
          </div>
          <button
            onClick={() => setIsAddingBid(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Bid
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isAddingBid && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Bid Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newBid.title}
                  onChange={(e) => setNewBid({ ...newBid, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newBid.description}
                  onChange={(e) => setNewBid({ ...newBid, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contractorName" className="block text-sm font-medium text-gray-700">
                    Contractor Name
                  </label>
                  <input
                    type="text"
                    id="contractorName"
                    value={newBid.contractorName}
                    onChange={(e) => setNewBid({ ...newBid, contractorName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contractorEmail" className="block text-sm font-medium text-gray-700">
                    Contractor Email
                  </label>
                  <input
                    type="email"
                    id="contractorEmail"
                    value={newBid.contractorEmail}
                    onChange={(e) => setNewBid({ ...newBid, contractorEmail: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={newBid.amount}
                    onChange={(e) => setNewBid({ ...newBid, amount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    id="validUntil"
                    value={newBid.validUntil}
                    onChange={(e) => setNewBid({ ...newBid, validUntil: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={newBid.notes}
                  onChange={(e) => setNewBid({ ...newBid, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingBid(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Submit Bid
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {bids.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No bids yet. Add your first bid to get started!</p>
            </div>
          ) : (
            bids.map((bid) => (
              <div key={bid.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">{bid.title}</h3>
                      {bid.description && (
                        <p className="text-gray-600 mt-1">{bid.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-lg font-semibold">{formatCurrency(bid.amount)}</span>
                      </div>

                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <a
                          href={`mailto:${bid.contractorEmail}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {bid.contractorName}
                        </a>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          Submitted: {new Date(bid.submissionDate).toLocaleDateString()}
                        </span>
                      </div>

                      {bid.validUntil && (
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            Valid until: {new Date(bid.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {bid.notes && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">{bid.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <select
                      value={bid.status}
                      onChange={(e) => handleStatusChange(bid.id, e.target.value)}
                      className={`text-sm rounded-md border-gray-300 pr-8 ${
                        bid.status === "Accepted"
                          ? "text-green-800 bg-green-50"
                          : bid.status === "Rejected"
                          ? "text-red-800 bg-red-50"
                          : "text-yellow-800 bg-yellow-50"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => handleDelete(bid.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

