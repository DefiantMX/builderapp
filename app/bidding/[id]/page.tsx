"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Upload, Send, Filter, Download, Edit, Trash2, X, Check, XCircle, FileText, Users, DollarSign, Calendar, MapPin } from "lucide-react"

type BiddingProject = {
  id: string
  name: string
  description: string | null
  projectNumber: string | null
  location: string | null
  bidDueDate: string | null
  status: string
  bidders: Bidder[]
  bidSubmissions: BidSubmission[]
  biddingPlans: BiddingPlan[]
}

type Bidder = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string | null
  address: string | null
  licenseNumber: string | null
  specialties: string | null
  notes: string | null
  _count: {
    bidSubmissions: number
    bidInvitations: number
  }
}

type BidSubmission = {
  id: string
  division: string
  amount: number
  description: string | null
  fileUrl: string | null
  fileType: string | null
  status: string
  validUntil: string | null
  notes: string | null
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  bidder: Bidder
}

type BiddingPlan = {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  createdAt: string
}

const DIVISIONS = [
  { id: "01", name: "General Requirements" },
  { id: "02", name: "Existing Conditions" },
  { id: "03", name: "Concrete" },
  { id: "04", name: "Masonry" },
  { id: "05", name: "Metals" },
  { id: "06", name: "Wood, Plastics, and Composites" },
  { id: "07", name: "Thermal and Moisture Protection" },
  { id: "08", name: "Openings" },
  { id: "09", name: "Finishes" },
  { id: "10", name: "Specialties" },
  { id: "11", name: "Equipment" },
  { id: "12", name: "Furnishings" },
  { id: "13", name: "Special Construction" },
  { id: "14", name: "Conveying Equipment" },
  { id: "21", name: "Fire Suppression" },
  { id: "22", name: "Plumbing" },
  { id: "23", name: "Heating, Ventilating, and Air Conditioning" },
  { id: "26", name: "Electrical" },
  { id: "27", name: "Communications" },
  { id: "28", name: "Electronic Safety and Security" },
  { id: "31", name: "Earthwork" },
  { id: "32", name: "Exterior Improvements" },
  { id: "33", name: "Utilities" },
]

export default function BiddingProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "bidders" | "plans" | "submissions">("overview")
  const [project, setProject] = useState<BiddingProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Bidders
  const [showBidderForm, setShowBidderForm] = useState(false)
  const [editingBidder, setEditingBidder] = useState<Bidder | null>(null)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [bidderForm, setBidderForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    licenseNumber: "",
    specialties: "",
    notes: ""
  })

  // Plans
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [uploadingPlan, setUploadingPlan] = useState(false)
  const [planFile, setPlanFile] = useState<File | null>(null)
  const [planForm, setPlanForm] = useState({
    title: "",
    description: ""
  })

  // Submissions
  const [selectedDivision, setSelectedDivision] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [filteredSubmissions, setFilteredSubmissions] = useState<BidSubmission[]>([])
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [submissionForm, setSubmissionForm] = useState({
    bidderId: "",
    division: "",
    amount: "",
    description: "",
    validUntil: "",
    notes: ""
  })
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)

  // Invitations
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedBidders, setSelectedBidders] = useState<string[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [sendingInvitations, setSendingInvitations] = useState(false)
  
  // Bidders selection for sending RFB
  const [selectedBiddersForRFB, setSelectedBiddersForRFB] = useState<string[]>([])
  const [showRFBModal, setShowRFBModal] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  useEffect(() => {
    if (project) {
      filterSubmissions()
    }
  }, [selectedDivision, selectedStatus, project])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/bidding/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        setError("Failed to fetch bidding project")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = () => {
    if (!project) return
    
    let filtered = [...project.bidSubmissions]
    
    if (selectedDivision) {
      filtered = filtered.filter(s => s.division === selectedDivision)
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(s => s.status === selectedStatus)
    }
    
    setFilteredSubmissions(filtered)
  }

  const handleBidderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingBidder 
        ? `/api/bidding/projects/${params.id}/bidders/${editingBidder.id}`
        : `/api/bidding/projects/${params.id}/bidders`
      
      const method = editingBidder ? "PUT" : "POST"
      
      // Convert selected specialties array to comma-separated string
      const specialtiesString = selectedSpecialties.join(", ")
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bidderForm,
          specialties: specialtiesString
        })
      })

      if (response.ok) {
        fetchProject()
        setShowBidderForm(false)
        setEditingBidder(null)
        setSelectedSpecialties([])
        setBidderForm({
          companyName: "",
          contactName: "",
          email: "",
          phone: "",
          address: "",
          licenseNumber: "",
          specialties: "",
          notes: ""
        })
      }
    } catch (err) {
      console.error("Error saving bidder:", err)
    }
  }

  const handlePlanUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planFile) return

    setUploadingPlan(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append("file", planFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!uploadResponse.ok) throw new Error("Upload failed")

      const { fileUrl, fileType } = await uploadResponse.json()

      // Create plan
      const response = await fetch(`/api/bidding/projects/${params.id}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...planForm,
          fileUrl,
          fileType
        })
      })

      if (response.ok) {
        fetchProject()
        setShowPlanForm(false)
        setPlanFile(null)
        setPlanForm({ title: "", description: "" })
      }
    } catch (err) {
      console.error("Error uploading plan:", err)
    } finally {
      setUploadingPlan(false)
    }
  }

  const handleSendInvitations = async () => {
    if (selectedBidders.length === 0 || selectedPlans.length === 0) {
      alert("Please select at least one bidder and one plan")
      return
    }

    setSendingInvitations(true)
    try {
      const response = await fetch(`/api/bidding/projects/${params.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidderIds: selectedBidders,
          biddingPlanIds: selectedPlans
        })
      })

      if (response.ok) {
        alert("Invitations sent successfully!")
        setSelectedBidders([])
        setSelectedPlans([])
        fetchProject()
      }
    } catch (err) {
      console.error("Error sending invitations:", err)
    } finally {
      setSendingInvitations(false)
    }
  }

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let fileUrl = null
      let fileType = null

      if (submissionFile) {
        const formData = new FormData()
        formData.append("file", submissionFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })

        if (uploadResponse.ok) {
          const result = await uploadResponse.json()
          fileUrl = result.fileUrl
          fileType = result.fileType
        }
      }

      const response = await fetch(`/api/bidding/projects/${params.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionForm,
          amount: parseFloat(submissionForm.amount),
          fileUrl,
          fileType,
          validUntil: submissionForm.validUntil || null
        })
      })

      if (response.ok) {
        fetchProject()
        setShowSubmissionForm(false)
        setSubmissionForm({
          bidderId: "",
          division: "",
          amount: "",
          description: "",
          validUntil: "",
          notes: ""
        })
        setSubmissionFile(null)
      }
    } catch (err) {
      console.error("Error submitting bid:", err)
    }
  }

  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      const response = await fetch(`/api/bidding/projects/${params.id}/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchProject()
      }
    } catch (err) {
      console.error("Error updating submission:", err)
    }
  }

  const deleteBidder = async (bidderId: string) => {
    if (!confirm("Are you sure you want to delete this bidder?")) return

    try {
      const response = await fetch(`/api/bidding/projects/${params.id}/bidders/${bidderId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchProject()
      }
    } catch (err) {
      console.error("Error deleting bidder:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!project) {
    return <div className="p-4">Project not found</div>
  }

  const divisions = Array.from(new Set(project.bidSubmissions.map(s => s.division))).sort()
  const statuses = Array.from(new Set(project.bidSubmissions.map(s => s.status)))

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
        {project.projectNumber && (
          <p className="text-gray-600">Project #: {project.projectNumber}</p>
        )}
        {project.location && (
          <p className="text-gray-600 flex items-center">
            <MapPin size={16} className="mr-1" />
            {project.location}
          </p>
        )}
        {project.bidDueDate && (
          <p className="text-gray-600 flex items-center">
            <Calendar size={16} className="mr-1" />
            Bid Due: {new Date(project.bidDueDate).toLocaleString()}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "bidders", label: "Bidders" },
            { id: "plans", label: "Plans" },
            { id: "submissions", label: "Bid Submissions" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bidders</h3>
              <Users className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{project.bidders.length}</p>
            <p className="text-sm text-gray-600 mt-2">Total bidders</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Plans</h3>
              <FileText className="text-green-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{project.biddingPlans.length}</p>
            <p className="text-sm text-gray-600 mt-2">Plans uploaded</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Submissions</h3>
              <DollarSign className="text-purple-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{project.bidSubmissions.length}</p>
            <p className="text-sm text-gray-600 mt-2">Bids received</p>
          </div>
        </div>
      )}

      {/* Bidders Tab */}
      {activeTab === "bidders" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Bidders</h2>
            <div className="flex gap-2">
              {selectedBiddersForRFB.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedBidders(selectedBiddersForRFB)
                    setSelectedPlans([])
                    setShowRFBModal(true)
                  }}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  <Send size={20} className="mr-2" />
                  Send Request for Bid ({selectedBiddersForRFB.length})
                </button>
              )}
              <button
                onClick={() => setShowBidderForm(true)}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                <Plus size={20} className="mr-2" />
                Add Bidder
              </button>
            </div>
          </div>

          {showBidderForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingBidder ? "Edit Bidder" : "Add New Bidder"}
              </h3>
              <form onSubmit={handleBidderSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={bidderForm.companyName}
                      onChange={(e) => setBidderForm({ ...bidderForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={bidderForm.contactName}
                      onChange={(e) => setBidderForm({ ...bidderForm, contactName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={bidderForm.email}
                      onChange={(e) => setBidderForm({ ...bidderForm, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={bidderForm.phone}
                      onChange={(e) => setBidderForm({ ...bidderForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={bidderForm.address}
                      onChange={(e) => setBidderForm({ ...bidderForm, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">License Number</label>
                    <input
                      type="text"
                      value={bidderForm.licenseNumber}
                      onChange={(e) => setBidderForm({ ...bidderForm, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Specialties/Divisions</label>
                    <div className="border rounded-md p-2 min-h-[100px] max-h-[200px] overflow-y-auto bg-white">
                      {DIVISIONS.map(division => (
                        <label key={division.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSpecialties.includes(division.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSpecialties([...selectedSpecialties, division.id])
                              } else {
                                setSelectedSpecialties(selectedSpecialties.filter(id => id !== division.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">
                            <span className="font-medium">{division.id}</span> - {division.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedSpecialties.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {selectedSpecialties.map(id => {
                          const div = DIVISIONS.find(d => d.id === id)
                          return div ? `${div.id} (${div.name})` : id
                        }).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={bidderForm.notes}
                      onChange={(e) => setBidderForm({ ...bidderForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBidderForm(false)
                      setEditingBidder(null)
                      setSelectedSpecialties([])
                      setBidderForm({
                        companyName: "",
                        contactName: "",
                        email: "",
                        phone: "",
                        address: "",
                        licenseNumber: "",
                        specialties: "",
                        notes: ""
                      })
                    }}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    {editingBidder ? "Update" : "Add"} Bidder
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                    <input
                      type="checkbox"
                      checked={selectedBiddersForRFB.length === project.bidders.length && project.bidders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBiddersForRFB(project.bidders.map(b => b.id))
                        } else {
                          setSelectedBiddersForRFB([])
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bids</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.bidders.map(bidder => {
                  const specialtiesArray = bidder.specialties 
                    ? bidder.specialties.split(",").map(s => s.trim()).filter(s => s)
                    : []
                  return (
                  <tr key={bidder.id} className={selectedBiddersForRFB.includes(bidder.id) ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBiddersForRFB.includes(bidder.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBiddersForRFB([...selectedBiddersForRFB, bidder.id])
                          } else {
                            setSelectedBiddersForRFB(selectedBiddersForRFB.filter(id => id !== bidder.id))
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{bidder.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{bidder.contactName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{bidder.email}</td>
                    <td className="px-6 py-4">
                      {specialtiesArray.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {specialtiesArray.map(specialtyId => {
                            const division = DIVISIONS.find(d => d.id === specialtyId)
                            return (
                              <span 
                                key={specialtyId}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                title={division?.name || specialtyId}
                              >
                                {specialtyId}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{bidder._count.bidSubmissions}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditingBidder(bidder)
                        // Parse specialties string to array
                        const specialtiesArray = bidder.specialties 
                          ? bidder.specialties.split(",").map(s => s.trim()).filter(s => s)
                          : []
                        setSelectedSpecialties(specialtiesArray)
                        setBidderForm({
                          companyName: bidder.companyName,
                          contactName: bidder.contactName,
                          email: bidder.email,
                          phone: bidder.phone || "",
                          address: bidder.address || "",
                          licenseNumber: bidder.licenseNumber || "",
                          specialties: bidder.specialties || "",
                          notes: bidder.notes || ""
                        })
                        setShowBidderForm(true)
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                      <button
                        onClick={() => deleteBidder(bidder.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Plans</h2>
            <div className="flex gap-2">
              {project.bidders.length > 0 && project.biddingPlans.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedBidders([])
                    setSelectedPlans([])
                    setShowInviteModal(true)
                  }}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  <Send size={20} className="mr-2" />
                  Send Plans to Bidders
                </button>
              )}
              <button
                onClick={() => setShowPlanForm(true)}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                <Plus size={20} className="mr-2" />
                Upload Plan
              </button>
            </div>
          </div>

          {showPlanForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Upload Plan</h3>
              <form onSubmit={handlePlanUpload}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={planForm.title}
                    onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Plan File *</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.dwg,.jpg,.jpeg,.png"
                    onChange={(e) => setPlanFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false)
                      setPlanFile(null)
                      setPlanForm({ title: "", description: "" })
                    }}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPlan}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                  >
                    {uploadingPlan ? "Uploading..." : "Upload Plan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.biddingPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">{plan.title}</h3>
                {plan.description && <p className="text-sm text-gray-600 mb-2">{plan.description}</p>}
                <div className="flex gap-2">
                  <a
                    href={plan.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Download size={16} className="mr-1" />
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === "submissions" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Bid Submissions</h2>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              <Plus size={20} className="mr-2" />
              Add Submission
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Division</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">All Divisions</option>
                  {DIVISIONS.map(div => (
                    <option key={div.id} value={div.id}>
                      {div.id} - {div.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDivision("")
                    setSelectedStatus("")
                  }}
                  className="w-full px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {showSubmissionForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Add Bid Submission</h3>
              <form onSubmit={handleSubmissionSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bidder *</label>
                    <select
                      required
                      value={submissionForm.bidderId}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, bidderId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Bidder</option>
                      {project.bidders.map(bidder => (
                        <option key={bidder.id} value={bidder.id}>{bidder.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Division *</label>
                    <select
                      required
                      value={submissionForm.division}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, division: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Division</option>
                      {DIVISIONS.map(div => (
                        <option key={div.id} value={div.id}>
                          {div.id} - {div.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={submissionForm.amount}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valid Until</label>
                    <input
                      type="datetime-local"
                      value={submissionForm.validUntil}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={submissionForm.description}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bid Document (Optional)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={submissionForm.notes}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionForm(false)
                      setSubmissionForm({
                        bidderId: "",
                        division: "",
                        amount: "",
                        description: "",
                        validUntil: "",
                        notes: ""
                      })
                      setSubmissionFile(null)
                    }}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    Add Submission
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bid Comparison Table */}
          {filteredSubmissions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto mb-6">
              <h3 className="text-lg font-semibold p-4 border-b">Bid Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bidder</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubmissions.map(submission => {
                      const divisionName = DIVISIONS.find(d => d.id === submission.division)?.name || submission.division
                      return (
                        <tr key={submission.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{submission.division}</div>
                            <div className="text-sm text-gray-500">{divisionName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{submission.bidder.companyName}</div>
                            <div className="text-sm text-gray-500">{submission.bidder.contactName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">${submission.amount.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              submission.status === "Accepted" ? "bg-green-100 text-green-800" :
                              submission.status === "Rejected" ? "bg-red-100 text-red-800" :
                              submission.status === "Under Review" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {submission.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {submission.fileUrl && (
                                <a
                                  href={submission.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Download size={16} />
                                </a>
                              )}
                              {submission.status !== "Accepted" && (
                                <button
                                  onClick={() => updateSubmissionStatus(submission.id, "Accepted")}
                                  className="text-green-600 hover:text-green-800"
                                  title="Accept"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                              {submission.status !== "Rejected" && (
                                <button
                                  onClick={() => updateSubmissionStatus(submission.id, "Rejected")}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No bid submissions found for the selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Request for Bid Modal (from Bidders page) */}
      {showRFBModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Send Request for Bid</h3>
                <button
                  onClick={() => {
                    setShowRFBModal(false)
                    setSelectedPlans([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Selected Bidders ({selectedBidders.length}):</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {project.bidders
                    .filter(bidder => selectedBidders.includes(bidder.id))
                    .map(bidder => (
                      <div key={bidder.id} className="text-sm text-gray-700">
                        • {bidder.companyName} ({bidder.contactName})
                      </div>
                    ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Select Plans to Include:</h4>
                {project.biddingPlans.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 border rounded-md bg-gray-50">
                    No plans available. Please upload plans first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                    {project.biddingPlans.map(plan => (
                      <label key={plan.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedPlans.includes(plan.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlans([...selectedPlans, plan.id])
                            } else {
                              setSelectedPlans(selectedPlans.filter(id => id !== plan.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{plan.title}</span>
                        {plan.description && (
                          <span className="text-xs text-gray-500">- {plan.description}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowRFBModal(false)
                    setSelectedPlans([])
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (selectedPlans.length === 0) {
                      alert("Please select at least one plan to send")
                      return
                    }
                    setSendingInvitations(true)
                    try {
                      const response = await fetch(`/api/bidding/projects/${params.id}/invite`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bidderIds: selectedBidders,
                          biddingPlanIds: selectedPlans
                        })
                      })

                      if (response.ok) {
                        const result = await response.json()
                        alert(`Request for Bid sent successfully to ${selectedBidders.length} bidder(s)!`)
                        setShowRFBModal(false)
                        setSelectedBiddersForRFB([])
                        setSelectedPlans([])
                        fetchProject()
                      } else {
                        const errorData = await response.json()
                        alert(errorData.error || "Failed to send request for bid")
                      }
                    } catch (err) {
                      console.error("Error sending RFB:", err)
                      alert("An error occurred while sending the request for bid")
                    } finally {
                      setSendingInvitations(false)
                    }
                  }}
                  disabled={selectedPlans.length === 0 || sendingInvitations}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {sendingInvitations ? "Sending..." : "Send Request for Bid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Modal (from Plans page) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Send Plans to Bidders</h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setSelectedBidders([])
                    setSelectedPlans([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Select Bidders:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {project.bidders.map(bidder => (
                    <label key={bidder.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedBidders.includes(bidder.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBidders([...selectedBidders, bidder.id])
                          } else {
                            setSelectedBidders(selectedBidders.filter(id => id !== bidder.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{bidder.companyName} ({bidder.contactName})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Select Plans:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {project.biddingPlans.map(plan => (
                    <label key={plan.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPlans.includes(plan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlans([...selectedPlans, plan.id])
                          } else {
                            setSelectedPlans(selectedPlans.filter(id => id !== plan.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{plan.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setSelectedBidders([])
                    setSelectedPlans([])
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitations}
                  disabled={selectedBidders.length === 0 || selectedPlans.length === 0 || sendingInvitations}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {sendingInvitations ? "Sending..." : "Send Invitations"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

