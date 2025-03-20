"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { UserRole, users } from "@/lib/permissions"
import { ArrowLeft, Edit, Trash2, Shield, Mail } from "lucide-react"

export default function ManageUsers() {
  const { user } = useAuth()
  const router = useRouter()
  const [userList, setUserList] = useState(users)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.Admin) {
      router.push("/")
    } else {
      // In a real app, we would fetch users from the API
      setLoading(false)
    }
  }, [user, router])

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      // In a real app, we would call an API to delete the user
      setUserList(userList.filter((u) => u.id !== userId))
    }
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Link
          href="/admin/invites"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <Mail className="mr-2 h-5 w-5" />
          Invite New User
        </Link>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Username
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
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
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{u.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        u.role === UserRole.Admin
                          ? "bg-purple-100 text-purple-800"
                          : u.role === UserRole.ProjectManager
                            ? "bg-blue-100 text-blue-800"
                            : u.role === UserRole.Contractor
                              ? "bg-green-100 text-green-800"
                              : u.role === UserRole.Client
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${u.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {u.verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/users/${u.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="h-5 w-5 inline" />
                    </Link>
                    <Link
                      href={`/admin/users/${u.id}/permissions`}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      <Shield className="h-5 w-5 inline" />
                    </Link>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={u.id === user.id} // Can't delete yourself
                    >
                      <Trash2 className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

