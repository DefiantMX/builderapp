"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../contexts/AuthContext"
import { UserRole, Permission, rolePermissions, users } from "@/lib/permissions"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"

export default function UserPermissions({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const userId = Number.parseInt(params.id)

  const [targetUser, setTargetUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
  const [useCustomPermissions, setUseCustomPermissions] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.Admin) {
      router.push("/")
      return
    }

    // In a real app, we would fetch the user from the API
    const foundUser = users.find((u) => u.id === userId)
    if (foundUser) {
      setTargetUser(foundUser)
      setSelectedRole(foundUser.role)
      setCustomPermissions(rolePermissions[foundUser.role])
    } else {
      setError("User not found")
    }

    setLoading(false)
  }, [user, router, userId])

  const handleSavePermissions = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // In a real app, we would call an API to update the user's permissions
      setTimeout(() => {
        // Update the user's role
        const updatedUser = { ...targetUser, role: selectedRole }
        setTargetUser(updatedUser)

        // Show success message
        setSuccess("User permissions updated successfully")
        setSaving(false)
      }, 1000)
    } catch (err) {
      setError("Failed to update user permissions")
      setSaving(false)
    }
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole
    setSelectedRole(newRole)
    setCustomPermissions(rolePermissions[newRole])
  }

  const togglePermission = (permission: Permission) => {
    if (customPermissions.includes(permission)) {
      setCustomPermissions(customPermissions.filter((p) => p !== permission))
    } else {
      setCustomPermissions([...customPermissions, permission])
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (!targetUser) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/admin/users" className="text-blue-500 hover:underline flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            Back to Users
          </Link>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">User not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href="/admin/users" className="text-blue-500 hover:underline flex items-center">
          <ArrowLeft size={16} className="mr-1" />
          Back to Users
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Edit User Permissions</h1>
      <p className="text-gray-600 mb-8">
        Manage permissions for {targetUser.username} ({targetUser.email})
      </p>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
            User Role
          </label>
          <select
            id="role"
            value={selectedRole || ""}
            onChange={handleRoleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={saving}
          >
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              id="useCustomPermissions"
              type="checkbox"
              checked={useCustomPermissions}
              onChange={() => setUseCustomPermissions(!useCustomPermissions)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={saving}
            />
            <label htmlFor="useCustomPermissions" className="ml-2 block text-sm text-gray-900">
              Use custom permissions (override role defaults)
            </label>
          </div>

          {useCustomPermissions && (
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium text-gray-700 mb-3">Custom Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(Permission).map((permission) => (
                  <div key={permission} className="flex items-center">
                    <input
                      id={`permission-${permission}`}
                      type="checkbox"
                      checked={customPermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <label htmlFor={`permission-${permission}`} className="ml-2 block text-sm text-gray-900">
                      {permission.replace(/_/g, " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Permissions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

