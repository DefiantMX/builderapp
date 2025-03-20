"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserRole } from "@/lib/permissions"

export default function AcceptInvitation({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [invitation, setInvitation] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // In a real app, we would verify the token with the API
        // For this demo, we'll simulate a valid invitation
        const mockInvitation = {
          email: "invited@example.com",
          role: UserRole.Contractor,
          projectId: 1,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        }

        setInvitation(mockInvitation)
      } catch (err) {
        setError("Invalid or expired invitation")
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setSubmitting(true)

    try {
      // In a real app, we would call the API to accept the invitation
      // For this demo, we'll simulate a successful response
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 1500)
    } catch (err) {
      setError("Failed to create account")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-theme(spacing.32))]">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-theme(spacing.32))]">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-theme(spacing.32))]">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-2">Accept Invitation</h1>
          <p className="text-gray-600 text-center mb-6">You've been invited to join as a {invitation?.role}</p>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={invitation?.email}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Create Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                minLength={8}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                minLength={8}
              />
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

