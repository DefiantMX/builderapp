import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const projectId = params.id

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get tasks for this project
    const tasks = await db.task.findMany({
      where: {
        projectId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const projectId = params.id

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Parse request body
    const { title, description, status, dueDate } = await req.json()

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Create new task
    const task = await db.task.create({
      data: {
        title,
        description,
        status: status || "Todo",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}

