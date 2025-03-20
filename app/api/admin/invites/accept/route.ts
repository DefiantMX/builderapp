import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// This is a mock invitation database. In a real application, you'd use a proper database.
const invitations: any[] = []

// This is a mock user database. In a real application, you'd use a proper database.
const users: any[] = []

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required" }, { status: 400 })
    }

    // Find invitation
    const invitation = invitations.find((invite) => invite.token === token)
    if (!invitation) {
      return NextResponse.json({ message: "Invalid or expired invitation" }, { status: 400 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires) < new Date()) {
      return NextResponse.json({ message: "Invitation has expired" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = users.find((user) => user.email === invitation.email)
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create user
    const newUser = {
      id: users.length + 1,
      email: invitation.email,
      username: invitation.email.split("@")[0], // Generate username from email
      password, // In a real app, this would be hashed
      role: invitation.role,
      projectId: invitation.projectId,
      verified: true,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)

    // Remove invitation
    const inviteIndex = invitations.findIndex((invite) => invite.token === token)
    invitations.splice(inviteIndex, 1)

    // Set cookie for authentication
    cookies().set("user_id", newUser.id.toString(), { httpOnly: true })

    return NextResponse.json({ message: "Account created successfully" })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json({ message: "An error occurred while accepting the invitation" }, { status: 500 })
  }
}

