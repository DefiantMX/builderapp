import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return user data without password
    const { password: _, ...userData } = user
    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error in /api/user:', error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

