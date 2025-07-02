import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the session and check if the user is authenticated
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get the user ID from the session
    const userId = session.user.id

    if (!userId) {
      console.error("User ID is missing from session", session)
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      )
    }

    // Verify that the user exists in the database
    const userExists = await db.user.findUnique({
      where: { id: userId }
    })

    if (!userExists) {
      console.error(`User with ID ${userId} not found in database`)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Parse the request body
    const { name, description } = await req.json()

    // Validate the required fields
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    // Create the project
    const project = await db.project.create({
      data: {
        name,
        description,
        userId
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}


