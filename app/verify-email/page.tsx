"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function VerifyEmail() {
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token")
      if (!token) {
        setError("Invalid verification link")
        return
      }

      try {
        const response = await fetch(`/api/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setMessage(data.message)
        } else {
          setError(data.message)
        }
      } catch (err) {
        setError("An error occurred during email verification")
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-500 mb-4">{message}</p>}
      <Link href="/login" className="text-blue-500 hover:underline">
        Go to Login
      </Link>
    </div>
  )
}

