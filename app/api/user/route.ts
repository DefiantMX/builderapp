import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// This is a mock user database. In a real application, you'd use a proper database.
const users: any[] = []

export async function GET() {
  const userId = cookies().get("user_id")?.value

  if (userId) {
    const user = users.find((user) => user.id.toString() === userId)
    if (user) {
      const { password: _, ...userData } = user
      return NextResponse.json(userData)
    }
  }

  return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
}

