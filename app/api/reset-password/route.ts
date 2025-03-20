import { NextResponse } from "next/server"

// This is a mock user database. In a real application, you'd use a proper database.
const users: any[] = []

export async function POST(request: Request) {
  const { token, password } = await request.json()

  const user = users.find((user) => user.resetToken === token && user.resetTokenExpiry > Date.now())

  if (!user) {
    return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 })
  }

  // Update user's password
  user.password = password // In a real app, you would hash this password
  user.resetToken = null
  user.resetTokenExpiry = null

  return NextResponse.json({ message: "Password reset successfully. You can now log in with your new password." })
}

