import { NextResponse } from "next/server"

// This is a mock user database. In a real application, you'd use a proper database.
const users: any[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  const user = users.find((user) => user.verificationToken === token)

  if (!user) {
    return NextResponse.json({ message: "Invalid verification token" }, { status: 400 })
  }

  user.verified = true
  user.verificationToken = null

  return NextResponse.json({ message: "Email verified successfully. You can now log in." })
}

