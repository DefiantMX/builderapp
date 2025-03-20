"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { UserRole, invitations } from "@/lib/permissions"
import { ArrowLeft, Send, RefreshCw, Trash2 } from "lucide-react"
import { projectStore } from "@/lib/store"

export default function UserInvitations() {
  const { user } = useAuth()
  const router = useRouter()
  const [inviteList, setInviteList] = useState(invitations)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>(UserRole.Contractor)
  const [projectId, setProjectId] = useState<string>("")
  const [sending, setSending] = useState(false)
  const [projects, setProjects] = useState(projectStore.getAllProjects())

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.Admin) {
      router.push("/")
    } else {
      // In a real app, we would fetch invitations from the API
      setLoading(false)
    }
  }, [user, router])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError("")

    try {
      // In a real app, we would call an API to send the invitation
      const newInvite = {
        id: inviteList.length + 1,
        email,
        role,
        projectId: projectId ? Number(projectId) : null,
        token: Math.random().toString(36).substring(2, 15),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      setInviteList([...inviteList, newInvite])
      setEmail("")
      setRole(UserRole.Contractor)
      setProjectId("")
    } catch (err) {
      setError("Failed to send invitation")
    } finally {
      setSending(false)
    }
  }

  const handleDeleteInvite = (inviteId: number) => {
    if (confirm("Are you sure you want to delete this invitation?")) {
      // In a real app, we would call an API to delete the invitation
      setInviteList(inviteList.filter((invite) => invite.id !== inviteId))
    }
  }

  const handleResendInvite = (inviteId: number) => {
    // In a real app, we would call an API to resend the invitation
    alert("Invitation resent successfully!")
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-500 hover:underline flex items-center">
          <ArrowLeft size={16} className="mr-1" />
          Back to Admin Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">User Invitations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>

            {inviteList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Project
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Expires
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inviteList.map((invite) => (
                      <tr key={invite.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              invite.role === UserRole.Admin
                                ? "bg-purple-100 text-purple-800"
                                : invite.role === UserRole.ProjectManager
                                  ? "bg-blue-100 text-blue-800"
                                  : invite.role === UserRole.Contractor
                                    ? "bg-green-100 text-green-800"
                                    : invite.role === UserRole.Client
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {invite.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {invite.projectId
                              ? projects.find((p) => p.id === invite.projectId)?.name || `Project ${invite.projectId}`
                              : "All Projects"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(invite.expires).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleResendInvite(invite.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Resend Invitation"
                          >
                            <RefreshCw className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Invitation"
                          >
                            <Trash2 className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending invitations</p>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Send New Invitation</h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSendInvite}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  User Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {Object.values(UserRole).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectId">
                  Specific Project (Optional)
                </label>
                <select
                  id="projectId"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If selected, the user will only have access to this specific project.
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

