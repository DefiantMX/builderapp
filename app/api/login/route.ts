import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// This is a mock user database. In a real application, you'd use a proper database.
const users: any[] = [
  {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    password: "password123", // In a real app, this would be hashed
    verified: true,
  },
]

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Find user
  const user = users.find((user) => user.email === email)

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 401 })
  }

  if (user.password !== password) {
    return NextResponse.json({ message: "Incorrect password" }, { status: 401 })
  }

  if (!user.verified) {
    return NextResponse.json({ message: "Please verify your email before logging in" }, { status: 403 })
  }

  // Set a cookie to maintain the session
  cookies().set("user_id", user.id.toString(), { httpOnly: true })

  // Return user data (excluding password and sensitive information)
  const { password: _, ...userData } = user
  return NextResponse.json(userData)
}

