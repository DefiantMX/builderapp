import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

// This is a mock invitation database. In a real application, you'd use a proper database.
const invitations: any[] = []

export async function GET(request: Request) {
  // Check if user is admin
  const userId = cookies().get("user_id")?.value
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // In a real app, we would check if the user is an admin

  return NextResponse.json(invitations)
}

export async function POST(request: Request) {
  // Check if user is admin
  const userId = cookies().get("user_id")?.value
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // In a real app, we would check if the user is an admin

  try {
    const { email, role, projectId } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ message: "Email and role are required" }, { status: 400 })
    }

    // Check if invitation already exists
    const existingInvite = invitations.find((invite) => invite.email === email)
    if (existingInvite) {
      return NextResponse.json({ message: "An invitation has already been sent to this email" }, { status: 400 })
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex")

    // Create invitation
    const newInvitation = {
      id: invitations.length + 1,
      email,
      role,
      projectId: projectId || null,
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
    }

    invitations.push(newInvitation)

    // In a real app, we would send an email to the user with the invitation link

    return NextResponse.json(newInvitation, { status: 201 })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ message: "An error occurred while creating the invitation" }, { status: 500 })
  }
}

