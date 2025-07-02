import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This is a mock schedule database. In a real application, you'd use a proper database.
const scheduleItems = [
  {
    id: 1,
    projectId: "1",
    title: "Foundation Work",
    startDate: "2023-06-01",
    endDate: "2023-06-15",
    assignee: "John Doe",
    status: "Completed",
  },
  {
    id: 2,
    projectId: "1",
    title: "Framing",
    startDate: "2023-06-16",
    endDate: "2023-07-15",
    assignee: "Jane Smith",
    status: "In Progress",
  },
  {
    id: 3,
    projectId: "1",
    title: "Electrical Wiring",
    startDate: "2023-07-16",
    endDate: "2023-07-31",
    assignee: "Bob Johnson",
    status: "Not Started",
  },
]

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get all events for the project
    const events = await prisma.event.findMany({
      where: {
        projectId: parseInt(params.id),
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Error fetching events" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { title, description, startDate, endDate, status } = await request.json()

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        projectId: parseInt(params.id),
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Error creating event" },
      { status: 500 }
    )
  }
}

