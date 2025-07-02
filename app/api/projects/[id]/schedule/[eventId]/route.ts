import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; eventId: string } }
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

    // Then verify that the event belongs to the project
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: parseInt(params.eventId),
        projectId: parseInt(params.id),
      },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const updates = await request.json()

    const updatedEvent = await prisma.event.update({
      where: {
        id: parseInt(params.eventId),
      },
      data: {
        ...updates,
        startDate: updates.startDate ? new Date(updates.startDate) : existingEvent.startDate,
        endDate: updates.endDate ? new Date(updates.endDate) : existingEvent.endDate,
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Error updating event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; eventId: string } }
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

    // Then verify that the event belongs to the project
    const event = await prisma.event.findFirst({
      where: {
        id: parseInt(params.eventId),
        projectId: parseInt(params.id),
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await prisma.event.delete({
      where: {
        id: parseInt(params.eventId),
      },
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Error deleting event" },
      { status: 500 }
    )
  }
} 