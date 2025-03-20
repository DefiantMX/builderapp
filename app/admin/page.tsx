"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import { UserRole } from "@/lib/permissions"
import { Users, UserPlus, Settings, Shield } from "lucide-react"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.Admin) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/users" className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold">Manage Users</h2>
          </div>
          <p className="text-gray-600">View, edit, and manage user accounts and permissions.</p>
        </Link>

        <Link
          href="/admin/invites"
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300"
        >
          <div className="flex items-center mb-4">
            <UserPlus className="h-8 w-8 text-green-500 mr-3" />
            <h2 className="text-xl font-semibold">User Invitations</h2>
          </div>
          <p className="text-gray-600">Send invitations to new users and manage pending invites.</p>
        </Link>

        <Link href="/admin/roles" className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-purple-500 mr-3" />
            <h2 className="text-xl font-semibold">Roles & Permissions</h2>
          </div>
          <p className="text-gray-600">Configure user roles and their associated permissions.</p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300"
        >
          <div className="flex items-center mb-4">
            <Settings className="h-8 w-8 text-gray-500 mr-3" />
            <h2 className="text-xl font-semibold">System Settings</h2>
          </div>
          <p className="text-gray-600">Configure global system settings and preferences.</p>
        </Link>
      </div>
    </div>
  )
}

function UsersList() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch users on component mount
  useState(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users")
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        } else {
          setError("Failed to fetch users")
        }
      } catch (err) {
        setError("An error occurred while fetching users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  })

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.username}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.verified ? "Verified" : "Pending"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                  Edit
                </Link>
                <button className="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvitationsList() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch invitations on component mount
  useState(() => {
    const fetchInvitations = async () => {
      try {
        const response = await fetch("/api/admin/invitations")
        if (response.ok) {
          const data = await response.json()
          setInvitations(data)
        } else {
          setError("Failed to fetch invitations")
        }
      } catch (err) {
        setError("An error occurred while fetching invitations")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  })

  if (loading) {
    return <div className="text-center py-8">Loading invitations...</div>
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {invitations.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invitation.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {invitation.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{new Date(invitation.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{new Date(invitation.expiresAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-4">Resend</button>
                  <button className="text-red-600 hover:text-red-900">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-8 text-gray-500">No invitations found</div>
      )}
    </div>
  )
}

