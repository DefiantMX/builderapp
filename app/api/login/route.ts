import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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
  try {
    const { email, password } = await request.json()

    console.log("Login attempt for email:", email)

    // Validate credentials
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      console.log("User not found or password missing for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      console.log("Invalid password for email:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    })

    console.log("Login successful for email:", email, "Session token:", session.id)

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      sessionToken: session.id
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}

