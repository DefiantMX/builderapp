import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// This is a mock project database. In a real application, you'd use a proper database.
const staticProjects = [
  {
    id: 1,
    name: "Downtown Office Complex",
    description: "A modern office complex in the heart of downtown",
    status: "In Progress",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
  {
    id: 2,
    name: "Riverside Apartments",
    description: "Luxury apartment complex with riverside views",
    status: "Planning",
    startDate: "2024-03-01",
    endDate: "2025-06-30",
  },
  {
    id: 3,
    name: "Tech Innovation Center",
    description: "State-of-the-art technology innovation hub",
    status: "In Progress",
    startDate: "2024-02-15",
    endDate: "2024-11-30",
  },
]

// Use a simple array instead of global variable for this mock implementation
const dynamicProjects: any[] = []

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      return new NextResponse("Invalid project ID", { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Check if the user owns the project
    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, status, startDate, endDate } = await request.json()

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Error updating project" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await prisma.project.delete({
      where: {
        id: parseInt(params.id),
      },
    })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Error deleting project" },
      { status: 500 }
    )
  }
}

