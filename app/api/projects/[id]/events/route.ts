import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const events = await db.event.findMany({
      where: {
        projectId: params.id
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[EVENTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
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

    const event = await db.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || "Scheduled",
        priority: priority || 0,
        percentComplete: percentComplete || 0,
        projectId: params.id
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("[EVENTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 