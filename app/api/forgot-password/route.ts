import { NextResponse } from "next/server"
import crypto from "crypto"

// This is a mock user database. In a real application, you'd use a proper database.
const users: any[] = []

export async function POST(request: Request) {
  const { email } = await request.json()

  const user = users.find((user) => user.email === email)

  if (!user) {
    return NextResponse.json({ message: "If a user with that email exists, a password reset link has been sent." })
  }

  // Create reset token
  const resetToken = crypto.randomBytes(32).toString("hex")
  user.resetToken = resetToken
  user.resetTokenExpiry = Date.now() + 3600000 // 1 hour from now

  // Send password reset email (mock function)
  await sendPasswordResetEmail(email, resetToken)

  return NextResponse.json({ message: "If a user with that email exists, a password reset link has been sent." })
}

// Mock function to send password reset email
async function sendPasswordResetEmail(email: string, token: string) {
  console.log(`Sending password reset email to ${email} with token ${token}`)
  // In a real application, you would use an email service to send the actual email
}

