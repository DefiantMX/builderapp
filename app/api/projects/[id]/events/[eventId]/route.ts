import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Authentication required', { status: 401 })
    }

    const body = await request.json()
    const { percentComplete, status, startDate, endDate, priority, title, description, assignee, parentId, predecessorIds } = body

    // Validate input
    if (percentComplete !== undefined && (typeof percentComplete !== 'number' || percentComplete < 0 || percentComplete > 100)) {
      return new NextResponse('Invalid percent complete value', { status: 400 })
    }

    if (status && !['Scheduled', 'In Progress', 'Completed', 'On Hold'].includes(status)) {
      return new NextResponse('Invalid status value', { status: 400 })
    }

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Update event - support full Smartsheet-style field updates
    const updateData: Record<string, unknown> = {}
    if (percentComplete !== undefined) updateData.percentComplete = percentComplete
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (priority !== undefined) updateData.priority = priority
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (assignee !== undefined) updateData.assignee = assignee || null
    if (parentId !== undefined) updateData.parentId = parentId || null
    if (predecessorIds !== undefined) updateData.predecessorIds = Array.isArray(predecessorIds) ? predecessorIds : []

    // If percentComplete is 100, automatically set status to Completed
    if (percentComplete === 100) {
      updateData.status = 'Completed'
    }
    // If percentComplete is > 0 and < 100, set status to In Progress
    else if (percentComplete > 0 && percentComplete < 100) {
      updateData.status = 'In Progress'
    }

    const updatedEvent = await db.event.update({
      where: {
        id: params.eventId,
        projectId: params.id
      },
      data: updateData
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, description, startDate, endDate, status, priority, percentComplete } = body

    // Validate required fields
    if (!title || !startDate) {
      return new NextResponse("Title and start date are required", { status: 400 })
    }

    // Validate priority if provided
    if (priority !== undefined && (typeof priority !== 'number' || priority < 0)) {
      return new NextResponse("Invalid priority value", { status: 400 })
    }

    // Validate percent complete if provided
    if (percentComplete !== undefined && (typeof percentComplete !== 'number' || percentComplete < 0 || percentComplete > 100)) {
      return new NextResponse("Invalid percent complete value", { status: 400 })
    }

    const event = await db.event.update({
      where: {
        id: params.eventId,
        projectId: params.id
      },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || "Scheduled",
        priority: priority || 0,
        percentComplete: percentComplete || 0
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("[EVENT_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await db.event.delete({
      where: {
        id: params.eventId,
        projectId: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[EVENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 