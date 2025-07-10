import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// Get a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        events: {
          orderBy: {
            startDate: 'asc'
          }
        },
        dailyLogs: {
          orderBy: {
            date: 'desc'
          }
        },
        budget: {
          include: {
            divisionBudgets: true
          }
        },
        invoices: true,
        draws: {
          include: {
            invoices: true
          }
        },
        changeOrders: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Update a project
export async function PUT(
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
    const { name, description } = await req.json()

    // Verify ownership
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

    // Update the project
    const updatedProject = await db.project.update({
      where: {
        id: projectId
      },
      data: {
        name,
        description
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// Delete a project
export async function DELETE(
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

    // Verify ownership
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

    // Delete the project
    await db.project.delete({
      where: {
        id: projectId
      }
    })

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}

